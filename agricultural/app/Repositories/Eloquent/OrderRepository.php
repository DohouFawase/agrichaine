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

    public function find(string $id)
    {
        return $this->model->with(['buyer', 'product', 'transporter', 'transaction'])->findOrFail($id);
    }

    /**
     * Récupère les commandes selon le rôle de l'utilisateur connecté
     */
    /**
     * Récupère les commandes selon le rôle de l'utilisateur connecté
     */
    public function getOrdersByRole(string $userId, string $role, bool $inProgressOnly = true)
    {
        $query = $this->model->with(['buyer', 'product', 'transporter']);

        switch ($role) {
            case 'producer':
                // 🎯 CORRECTION : On précise explicitement 'products.user_id' pour éviter l'erreur 1054
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
                $query->where('transporter_id', $userId);
                if ($inProgressOnly) {
                    $query->whereIn('status', ['assigned_to_driver', 'collected']);
                }
                break;

            default:
                throw new \Exception("Rôle utilisateur non pris en charge pour l'historique des commandes.");
        }

        return $query->orderBy('created_at', 'desc')->get();
    }
    /**
     * Crée la commande en sécurisant les fonds du Wallet et en décrémentant les stocks vivriers
     */
    public function create(array $orderData, int $buyerId, float $globalCost)
    {
        return DB::transaction(function () use ($orderData, $buyerId, $globalCost) {

            // 1. Gestion des stocks du produit vivrier
            $product = Product::findOrFail($orderData['product_id']);

            if ($product->quantity < $orderData['quantity_ordered']) {
                throw new \Exception("Quantité insuffisante en stock au champ.");
            }

            $product->decrement('quantity', $orderData['quantity_ordered']);
            if ($product->quantity == 0) {
                $product->update(['status' => 'sold_out']);
            }

            // 2. Verrouillage et déduction du Portefeuille de la commerçante (Buyer)
            $wallet = Wallet::where('user_id', $buyerId)->lockForUpdate()->firstOrFail();

            if ($wallet->balance < $globalCost) {
                throw new \Exception("Solde insuffisant dans votre portefeuille pour sécuriser cette commande.");
            }

            $wallet->decrement('balance', $globalCost);

            // 3. Historiser le blocage au séquestre
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'amount' => $globalCost,
                'type' => 'escrow_lock',
                'reference' => 'ESC-' . strtoupper(Str::random(16)),
                'description' => "Fonds bloqués en séquestre pour achat vivrier"
            ]);

            // 4. Création de la commande
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

        return $order;
    }

    public function updateStatus(string $orderId, string $status)
    {
        $order = $this->find($orderId);
        $order->update(['status' => $status]);

        return $order;
    }

    /**
     * Validation finale de la livraison par scan de QR Code (Déblocage du Séquestre)
     */
    public function validateDeliveryWithQRCode(string $orderId, string $scannedCode): bool
    {
        return DB::transaction(function () use ($orderId, $scannedCode) {

            // 1. Récupérer la commande avec un verrou de ligne (Pessimistic Locking)
            $order = Order::where('id', $orderId)->lockForUpdate()->firstOrFail();

            // 2. Vérification de la validité du QR Code
            if ($order->verification_code_delivery !== $scannedCode) {
                throw new \Exception("Le code QR de livraison est invalide.");
            }

            if ($order->status !== 'collected') {
                throw new \Exception("La commande n'est pas dans un état permettant la livraison.");
            }

            // 3. Mise à jour du statut de la commande
            $order->status = 'delivered';
            $order->save();

            // 4. Flux financier Séquestre -> Portefeuilles (Calcul des parts)
            $totalAmount = $order->total_price;
            $deliveryFee = $order->delivery_fees; // Doit matcher la colonne exacte de ta table
            $productPrice = $totalAmount - $deliveryFee;

            // Créditer le producteur/vendeur pour ses produits vivriers
            $sellerWallet = Wallet::where('user_id', $order->product->user_id)->lockForUpdate()->firstOrFail();
            $sellerWallet->increment('balance', $productPrice);

            // Créditer le chauffeur pour sa course logistique
            $driverWallet = Wallet::where('user_id', $order->transporter_id)->lockForUpdate()->firstOrFail();
            $driverWallet->increment('balance', $deliveryFee);

            // Créer les transactions d'historique pour le vendeur et le chauffeur
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
