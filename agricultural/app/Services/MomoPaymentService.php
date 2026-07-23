<?php

namespace App\Services;

use App\Models\MomoTransaction;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Exception;

class MomoPaymentService
{
    protected MtnMomoService $momo;

    public function __construct(MtnMomoService $momo)
    {
        $this->momo = $momo;
    }

    /**
     * ── FLUX 1 : RECHARGE DU WALLET ──────────────────────────────────
     * Initie une demande de paiement MoMo pour recharger le wallet de l'utilisateur.
     * Ne crédite RIEN tout de suite — MoMo est asynchrone (202 Accepted), il faut
     * ensuite appeler confirmTopUp() (polling ou webhook) pour créditer réellement.
     */
    public function initiateTopUp(string $userId, string $phone, int $amount): MomoTransaction
    {
        if ($amount <= 0) {
            throw new Exception("Montant de recharge invalide.");
        }

        $cleanPhone = $this->momo->formatPhoneNumber($phone);

        $momoTransaction = MomoTransaction::create([
            'user_id'             => $userId,
            'order_id'            => null,
            'type'                => 'topup',
            'external_reference'  => (string) Str::uuid(),
            'phone'               => $cleanPhone,
            'amount'              => $amount,
            'currency'            => 'XOF',
            'status'              => 'pending',
        ]);

        // On envoie NOTRE référence (pas celle générée en interne par requestToPay)
        // pour pouvoir la retrouver facilement au moment de la confirmation.
        $this->momo->requestToPay(
            (string) $amount,
            $cleanPhone,
            $momoTransaction->external_reference
        );

        return $momoTransaction;
    }

    /**
     * Vérifie le statut auprès de MoMo et crédite le wallet si le paiement est confirmé.
     * Idempotent : si déjà traité (processed_at renseigné), ne fait rien de plus.
     */
    public function confirmTopUp(string $externalReference): MomoTransaction
    {
        return DB::transaction(function () use ($externalReference) {
            $momoTransaction = MomoTransaction::where('external_reference', $externalReference)
                ->where('type', 'topup')
                ->lockForUpdate()
                ->firstOrFail();

            // ── Garde anti double-crédit ──
            if ($momoTransaction->processed_at !== null) {
                return $momoTransaction; // déjà traité, on ne refait rien
            }

            $statusData = $this->momo->getTransactionStatus($momoTransaction->external_reference);
            $momoStatus = $statusData['status'] ?? 'UNKNOWN';

            $momoTransaction->momo_status = $momoStatus;

            if ($momoStatus === 'SUCCESSFUL') {
                $wallet = Wallet::where('user_id', $momoTransaction->user_id)
                    ->lockForUpdate()
                    ->first();

                if (!$wallet) {
                    throw new Exception("Portefeuille introuvable pour cet utilisateur.");
                }

                if ($wallet->currency !== $momoTransaction->currency) {
                    throw new Exception("Incohérence de devise détectée. Recharge bloquée par sécurité.");
                }

                $wallet->increment('balance', $momoTransaction->amount);

                WalletTransaction::create([
                    'wallet_id'   => $wallet->id,
                    'amount'      => $momoTransaction->amount,
                    'type'        => 'momo_topup',
                    'reference'   => 'MOMO-' . $momoTransaction->external_reference,
                    'description' => "Recharge du portefeuille via MTN Mobile Money",
                ]);

                $momoTransaction->status = 'successful';
                $momoTransaction->processed_at = now();
            } elseif ($momoStatus === 'FAILED') {
                $momoTransaction->status = 'failed';
                $momoTransaction->processed_at = now();
            }
            // Si PENDING : on ne change rien, le frontend devra réessayer plus tard.

            $momoTransaction->save();

            return $momoTransaction;
        });
    }

    /**
     * ── FLUX 2 : PAIEMENT DIRECT D'UNE COMMANDE ──────────────────────
     * Crée la commande en statut 'awaiting_payment' (pas encore de stock décrémenté,
     * pas de wallet touché) et initie le paiement MoMo. La commande ne devient
     * réellement active qu'une fois confirmPayment() appelé avec succès.
     */
    public function initiateOrderPayment(array $orderData, string $buyerId, string $phone, int $amount): array
    {
        return DB::transaction(function () use ($orderData, $buyerId, $phone, $amount) {

            if ($amount <= 0) {
                throw new Exception("Montant de commande invalide.");
            }

            $totalPrice   = (int) ($orderData['total_price'] ?? 0);
            $deliveryFees = (int) ($orderData['delivery_fees'] ?? 0);

            if ($amount !== ($totalPrice + $deliveryFees)) {
                throw new Exception("Incohérence entre le montant à payer et les montants de la commande.");
            }

            // Vérification du stock, MAIS PAS de décrément : le produit ne doit être
            // réservé qu'une fois le paiement confirmé, sinon un paiement jamais
            // finalisé bloquerait du stock indéfiniment.
            $product = Product::where('id', $orderData['product_id'])->firstOrFail();
            if ($product->quantity < ($orderData['quantity_ordered'] ?? 0)) {
                throw new Exception("Quantité insuffisante en stock au champ.");
            }

            $orderData['status'] = 'awaiting_payment';
            $order = Order::create($orderData);

            $cleanPhone = $this->momo->formatPhoneNumber($phone);

            $momoTransaction = MomoTransaction::create([
                'user_id'             => $buyerId,
                'order_id'            => $order->id,
                'type'                => 'order_payment',
                'external_reference'  => (string) Str::uuid(),
                'phone'               => $cleanPhone,
                'amount'              => $amount,
                'currency'            => 'XOF',
                'status'              => 'pending',
            ]);

            $this->momo->requestToPay(
                (string) $amount,
                $cleanPhone,
                $momoTransaction->external_reference
            );

            return ['order' => $order, 'momo_transaction' => $momoTransaction];
        });
    }

    /**
     * Vérifie le statut auprès de MoMo et, si confirmé, active réellement la commande :
     * décrémente le stock (avec verrou anti-survente) et passe le statut à
     * 'paid_searching_driver'. Idempotent comme confirmTopUp().
     */
    public function confirmOrderPayment(string $externalReference): MomoTransaction
    {
        return DB::transaction(function () use ($externalReference) {
            $momoTransaction = MomoTransaction::where('external_reference', $externalReference)
                ->where('type', 'order_payment')
                ->lockForUpdate()
                ->firstOrFail();

            if ($momoTransaction->processed_at !== null) {
                return $momoTransaction;
            }

            $order = Order::where('id', $momoTransaction->order_id)->lockForUpdate()->firstOrFail();

            if ($order->status !== 'awaiting_payment') {
                // La commande a déjà été traitée ou annulée entre-temps
                return $momoTransaction;
            }

            $statusData = $this->momo->getTransactionStatus($momoTransaction->external_reference);
            $momoStatus = $statusData['status'] ?? 'UNKNOWN';

            $momoTransaction->momo_status = $momoStatus;

            if ($momoStatus === 'SUCCESSFUL') {
                $product = Product::where('id', $order->product_id)->lockForUpdate()->firstOrFail();

                if ($product->quantity < $order->quantity_ordered) {
                    // Stock épuisé entre-temps par une autre commande : on rembourse
                    // logiquement en marquant la commande en échec (le remboursement
                    // réel MoMo — Refund/Disbursement API — est un flux séparé à traiter).
                    $order->status = 'payment_failed_out_of_stock';
                    $order->save();

                    $momoTransaction->status = 'failed';
                    $momoTransaction->processed_at = now();
                    $momoTransaction->save();

                    return $momoTransaction;
                }

                $product->decrement('quantity', $order->quantity_ordered);
                if ($product->quantity == 0) {
                    $product->update(['status' => 'sold_out']);
                }

                $order->status = 'paid_searching_driver';
                $order->save();

                $momoTransaction->status = 'successful';
                $momoTransaction->processed_at = now();
            } elseif ($momoStatus === 'FAILED') {
                $order->status = 'payment_failed';
                $order->save();

                $momoTransaction->status = 'failed';
                $momoTransaction->processed_at = now();
            }

            $momoTransaction->save();

            return $momoTransaction;
        });
    }
}