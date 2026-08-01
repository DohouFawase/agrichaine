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
                    // 🔧 CORRIGÉ : 'momo_topup' n'existe pas dans l'ENUM de la
                    // colonne wallet_transactions.type ("Data truncated for
                    // column 'type'"). On réutilise 'deposit', déjà prévu et
                    // affiché correctement par WalletController::getWalletSummary
                    // ("Dépôt Mobile Money", credit).
                    'type'        => 'deposit',
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
    public function initiateOrderPayment(array $orderData, string $buyerId, string $phone): array
    {
        return DB::transaction(function () use ($orderData, $buyerId, $phone) {

            // 🔧 CORRIGÉ — même faille que BuyerOrderService avant correction :
            // le prix ne doit JAMAIS venir du client. On le recalcule ici à
            // partir du prix unitaire réel du produit en base, exactement comme
            // BuyerOrderService::createAndEscrowOrder.
            $product = Product::where('id', $orderData['product_id'])->firstOrFail();

            if ($product->quantity < ($orderData['quantity_ordered'] ?? 0)) {
                throw new Exception("Quantité insuffisante en stock au champ.");
            }

            $totalPrice   = (int) round($orderData['quantity_ordered'] * $product->price_per_unit);
            $deliveryFees = (int) round($totalPrice * 0.15); // même taux que BuyerOrderService::DELIVERY_FEE_RATE
            $amount       = $totalPrice + $deliveryFees;

            $orderData['total_price']   = $totalPrice;
            $orderData['delivery_fees'] = $deliveryFees;
            $orderData['status']        = 'awaiting_payment';

            // 🔧 AJOUT : ces deux codes étaient absents ici — une commande payée
            // via MoMo direct se serait retrouvée avec verification_code_collection
            // et verification_code_delivery à null, cassant tout le flux QR
            // (exactement le bug diagnostiqué au tout début : fallback silencieux
            // sur order.id côté frontend, scan toujours rejeté côté backend).
            $orderData['verification_code_collection'] = 'COLL-' . strtoupper(Str::random(12));
            $orderData['verification_code_delivery']   = 'DELIV-' . strtoupper(Str::random(12));

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

    /**
     * ── FLUX 3 : RETRAIT DU WALLET ────────────────────────────────────
     * Débite le wallet IMMÉDIATEMENT (avant même la confirmation MoMo) pour
     * éviter qu'un utilisateur ne lance plusieurs retraits simultanés au-delà
     * de son solde réel. Si le transfert échoue côté MoMo, les fonds sont
     * recrédités automatiquement (voir confirmWithdrawal).
     */
    public function initiateWithdrawal(string $userId, string $phone, int $amount): MomoTransaction
    {
        return DB::transaction(function () use ($userId, $phone, $amount) {

            if ($amount <= 0) {
                throw new Exception("Montant de retrait invalide.");
            }

            $wallet = Wallet::where('user_id', $userId)->lockForUpdate()->firstOrFail();

            if ($wallet->balance < $amount) {
                throw new Exception("Solde insuffisant pour ce retrait.");
            }

            $cleanPhone = $this->momo->formatPhoneNumber($phone);

            // Débit immédiat — les fonds ne peuvent pas être dépensés deux fois
            // pendant que le transfert MoMo est en cours de traitement.
            $wallet->decrement('balance', $amount);

            WalletTransaction::create([
                'wallet_id'   => $wallet->id,
                'amount'      => $amount,
                'type'        => 'withdraw', // 🔧 CORRIGÉ : 'withdrawal' n'existe pas dans l'ENUM, la vraie valeur est 'withdraw'
                'reference'   => 'WD-' . strtoupper(Str::random(12)),
                'description' => "Retrait vers Mobile Money",
            ]);

            $momoTransaction = MomoTransaction::create([
                'user_id'             => $userId,
                'order_id'            => null,
                'type'                => 'withdrawal',
                'external_reference'  => (string) Str::uuid(),
                'phone'               => $cleanPhone,
                'amount'              => $amount,
                'currency'            => 'XOF',
                'status'              => 'pending',
            ]);

            $this->momo->transfer(
                (string) $amount,
                $cleanPhone,
                $momoTransaction->external_reference
            );

            return $momoTransaction;
        });
    }

    /**
     * Vérifie le statut du transfert. Si échoué, RECRÉDITE le wallet
     * automatiquement (les fonds avaient été débités par anticipation
     * dans initiateWithdrawal). Idempotent comme les autres flux.
     */
    public function confirmWithdrawal(string $externalReference): MomoTransaction
    {
        return DB::transaction(function () use ($externalReference) {
            $momoTransaction = MomoTransaction::where('external_reference', $externalReference)
                ->where('type', 'withdrawal')
                ->lockForUpdate()
                ->firstOrFail();

            if ($momoTransaction->processed_at !== null) {
                return $momoTransaction;
            }

            $statusData = $this->momo->getTransferStatus($momoTransaction->external_reference);
            $momoStatus = $statusData['status'] ?? 'UNKNOWN';

            $momoTransaction->momo_status = $momoStatus;

            if ($momoStatus === 'SUCCESSFUL') {
                $momoTransaction->status = 'successful';
                $momoTransaction->processed_at = now();
                // Rien de plus à faire côté wallet : le débit a déjà eu lieu
                // à l'initiation.
            } elseif ($momoStatus === 'FAILED') {
                // 🔧 Remboursement automatique : le transfert MoMo n'a pas
                // abouti, on annule le débit initial pour ne pas pénaliser
                // l'utilisateur.
                $wallet = Wallet::where('user_id', $momoTransaction->user_id)
                    ->lockForUpdate()
                    ->first();

                if ($wallet) {
                    $wallet->increment('balance', $momoTransaction->amount);

                    WalletTransaction::create([
                        'wallet_id'   => $wallet->id,
                        'amount'      => $momoTransaction->amount,
                        // 🔧 CORRIGÉ : 'escrow_refund' est la valeur ENUM dédiée
                        // aux remboursements — plus précis que réutiliser 'deposit'.
                        'type'        => 'escrow_refund',
                        'reference'   => 'REFUND-' . $momoTransaction->external_reference,
                        'description' => "Remboursement suite à l'échec du retrait Mobile Money",
                    ]);
                }

                $momoTransaction->status = 'failed';
                $momoTransaction->processed_at = now();
            }

            $momoTransaction->save();

            return $momoTransaction;
        });
    }
}
