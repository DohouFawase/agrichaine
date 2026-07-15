<?php

namespace App\Repositories\Eloquent;

use App\Models\Order;
use App\Models\Product;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderRepository implements OrderRepositoryInterface
{
    protected $model;

    public function __construct(Order $model)
    {
        $this->model = $model;
    }

    /**
     * Récupère les détails d'une commande spécifique
     */
    public function find(string $id)
    {
        $order = $this->model->with(['buyer', 'product', 'transporter', 'transaction'])->findOrFail($id);

        if ($order->product) {
            $order->product->loadMissing('producer');
        }

        return $order;
    }

    /**
     * Récupère les commandes selon le rôle de l'utilisateur connecté
     */
     public function getOrdersByRole(string $userId, string $role, bool $inProgressOnly = true)
    {
        $query = $this->model->with(['buyer', 'product', 'transporter']);
 
        switch ($role) {
            case 'producer':
                $query->whereHas('product', function ($q) use ($userId) {
                    $q->where('products.producer_id', $userId);
                });
 
                if ($inProgressOnly) {
                    $query->where('status', '!=', 'delivered');
                }
                break;
 
            case 'buyer':
                $query->where('buyer_id', $userId);
                if ($inProgressOnly) {
                    $query->where('status', '!=', 'delivered');
                }
                break;
 
            case 'transporter':
                $query->where(function ($q) use ($userId) {
                    $q->where(function ($sub) {
                        $sub->where('status', 'paid_searching_driver')
                            ->whereNull('transporter_id');
                    })
                    ->orWhere('transporter_id', $userId);
                });
 
                if ($inProgressOnly) {
                    $query->whereIn('status', ['paid_searching_driver', 'assigned_to_driver', 'collected']);
                }
                break;
 
            default:
                throw new \Exception("Rôle utilisateur non pris en charge pour l'historique des commandes.");
        }
 
        $orders = $query->orderBy('created_at', 'desc')->get();
 
        foreach ($orders as $order) {
            if ($order->product) {
                $order->product->loadMissing('producer');
            }
        }
 
        return $orders;
    }

    /**
     * Crée la commande en sécurisant les fonds du Wallet et en décrémentant les stocks vivriers.
     *
     * 🔧 RENFORCÉ (sécurité financière) :
     * - Verrouillage du produit (lockForUpdate) pour empêcher toute survente en cas
     *   de commandes concurrentes sur le même stock.
     * - Vérification de cohérence entre $globalCost et les montants présents dans
     *   $orderData (total_price + delivery_fees), pour ne jamais débiter un montant
     *   différent de celui qui sera affiché/remboursé plus tard.
     * - Vérification de devise entre le wallet de l'acheteur et la commande.
     * - Rejet de toute quantité ou montant nul/négatif.
     */
    public function create(array $orderData, int $buyerId, float $globalCost)
    {
        return DB::transaction(function () use ($orderData, $buyerId, $globalCost) {

            // ── Vérification #1 : cohérence des montants avant tout mouvement d'argent ──
            $quantityOrdered = $orderData['quantity_ordered'] ?? 0;
            $totalPrice      = (int) ($orderData['total_price'] ?? 0);
            $deliveryFees    = (int) ($orderData['delivery_fees'] ?? 0);

            if ($quantityOrdered <= 0) {
                throw new \Exception("Quantité commandée invalide.");
            }

            if ($totalPrice <= 0) {
                throw new \Exception("Montant total invalide.");
            }

            if ($deliveryFees < 0) {
                throw new \Exception("Frais de livraison invalides.");
            }

            // Le montant réellement débité du wallet doit correspondre exactement
            // à ce qui sera stocké sur la commande — sinon incohérence future au paiement.
            if ((int) round($globalCost) !== ($totalPrice + $deliveryFees)) {
                throw new \Exception("Incohérence entre le montant à débiter et les montants de la commande. Opération bloquée par sécurité.");
            }

            // ── Vérification #2 : verrouillage et gestion des stocks (anti-survente) ──
            $product = Product::where('id', $orderData['product_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($product->quantity < $quantityOrdered) {
                throw new \Exception("Quantité insuffisante en stock au champ.");
            }

            $product->decrement('quantity', $quantityOrdered);
            if ($product->quantity == 0) {
                $product->update(['status' => 'sold_out']);
            }

            // ── Vérification #3 : verrouillage et débit du portefeuille acheteur ──
            $wallet = Wallet::where('user_id', $buyerId)->lockForUpdate()->firstOrFail();

            if ($wallet->balance < $globalCost) {
                throw new \Exception("Solde insuffisant dans votre portefeuille pour sécuriser cette commande.");
            }

            // Cohérence de devise : on ne débite jamais un wallet dans une devise
            // différente de celle attendue par la commande.
            $orderCurrency = $orderData['currency'] ?? 'XOF';
            if ($wallet->currency !== $orderCurrency) {
                throw new \Exception("Incohérence de devise détectée. Opération bloquée par sécurité.");
            }

            $wallet->decrement('balance', $globalCost);

            // ── Historiser le blocage au séquestre ──
            WalletTransaction::create([
                'wallet_id'   => $wallet->id,
                'amount'      => $globalCost,
                'type'        => 'escrow_lock',
                'reference'   => 'ESC-' . strtoupper(Str::random(16)),
                'description' => "Fonds bloqués en séquestre pour achat vivrier",
            ]);

            // ── Création de la commande ──
            return $this->model->create($orderData);
        });
    }

    public function assignDriver(string $orderId, string $driverId)
    {
        $order = $this->find($orderId);

        $order->update([
            'transporter_id' => $driverId,
            'status' => 'assigned_to_driver'
        ]);
        $order->load(['buyer', 'transporter', 'product.producer', 'transaction']);
        return $order;
    }

    public function updateStatus(string $orderId, string $status)
    {
        $order = $this->find($orderId);
        $order->update(['status' => $status]);

        return $order;
    }

    /**
     * ⚠️ NOTE : cette méthode duplique désormais la logique déjà présente et sécurisée
     * dans OrderCollectionService::validateDelivery (qui vérifie en plus l'autorisation
     * de l'acheteur, chose absente ici). Elle n'est plus appelée depuis le controller —
     * conservée uniquement si un autre endroit du code y fait encore référence.
     * Vérifie avec `grep -rn "validateDeliveryWithQRCode" app/` puis supprime si inutile.
     */
    public function validateDeliveryWithQRCode(string $orderId, string $scannedCode): bool
    {
        return DB::transaction(function () use ($orderId, $scannedCode) {
            $order = Order::where('id', $orderId)->lockForUpdate()->firstOrFail();

            if ($order->verification_code_delivery !== $scannedCode) {
                throw new \Exception("Le code QR de livraison est invalide.");
            }

            if ($order->status !== 'collected') {
                throw new \Exception("La commande n'est pas dans un état permettant la livraison.");
            }

            $order->status = 'delivered';
            $order->save();

            $totalAmount  = $order->total_price;
            $deliveryFee  = $order->delivery_fees;
            $productPrice = $totalAmount - $deliveryFee;

            $sellerWallet = Wallet::where('user_id', $order->product->producer_id)->lockForUpdate()->firstOrFail();
            $sellerWallet->increment('balance', $productPrice);

            $driverWallet = Wallet::where('user_id', $order->transporter_id)->lockForUpdate()->firstOrFail();
            $driverWallet->increment('balance', $deliveryFee);

            WalletTransaction::create([
                'wallet_id' => $sellerWallet->id,
                'amount' => $productPrice,
                'type' => 'escrow_unlock',
                'reference' => 'UNLK-SEL-' . strtoupper(Str::random(12)),
                'description' => "Paiement reçu pour la vente de produits vivriers"
            ]);

            WalletTransaction::create([
                'wallet_id' => $driverWallet->id,
                'amount' => $deliveryFee,
                'type' => 'escrow_unlock',
                'reference' => 'UNLK-DRV-' . strtoupper(Str::random(12)),
                'description' => "Paiement reçu pour la course logistique"
            ]);

            return true;
        });
    }
}