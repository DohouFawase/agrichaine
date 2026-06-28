<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Wallet;
use App\Models\Product;
use App\Models\WalletTransaction;
use App\Events\OrderPlacedForProducer;   // ⚡ Import pour notifier le producteur
use App\Events\OrderAvailableForDrivers; // ⚡ Import pour lancer le radar chauffeur
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Exception;

class BuyerOrderService
{
    /**
     * Étape 1 : Création de la commande, décrémentation des stocks, séquestre et notifications Reverb
     */
    public function createAndEscrowOrder(array $data, string $buyerId): Order
    {
        return DB::transaction(function () use ($data, $buyerId) {
            
            // 1. Verrouiller et vérifier le stock disponible au champ
            $product = Product::lockForUpdate()->findOrFail($data['product_id']);

            if ($product->quantity < $data['quantity_ordered']) {
                throw new Exception("Quantité insuffisante en stock au champ pour honorer cette commande.");
            }

            // Décrémenter la quantité (gère le type decimal 10,2 de ta migration)
            $product->decrement('quantity', $data['quantity_ordered']);

            // 2. Calcul du coût total (Prix d'achat + frais logistiques)
            $totalPrice = (int) $data['total_price'];
            $deliveryFees = (int) $data['delivery_price'];
            $globalCost = $totalPrice + $deliveryFees;

            // 3. Verrouiller le portefeuille de l'acheteur (Pessimistic Locking)
            $wallet = Wallet::where('user_id', $buyerId)->lockForUpdate()->firstOrFail();

            if ($wallet->balance < $globalCost) {
                throw new Exception("Solde insuffisant dans votre portefeuille pour sécuriser cette commande (Requis : {$globalCost} XOF).");
            }

            // 4. Déduire l'argent du portefeuille
            $wallet->decrement('balance', $globalCost);

            // 5. Tracer le blocage financier
            WalletTransaction::create([
                'wallet_id'   => $wallet->id,
                'amount'      => $globalCost,
                'type'        => 'escrow_lock',
                'reference'   => 'ESC-' . strtoupper(Str::random(16)),
                'description' => "Fonds bloqués au séquestre pour commande vivrière"
            ]);

            // 6. Insérer la commande avec les statuts et colonnes EXACTES de ta migration
            $order = Order::create([
                'buyer_id'                     => $buyerId,
                'product_id'                   => $data['product_id'],
                'quantity_ordered'             => $data['quantity_ordered'],
                'total_price'                  => $totalPrice,
                'delivery_fees'                => $deliveryFees, // S'aligne sur ta colonne 'delivery_fees'
                'status'                       => 'paid_searching_driver', // ✅ Aligné avec ton ENUM
                'verification_code_collection' => 'COLL-' . strtoupper(Str::random(12)),
                'verification_code_delivery'   => 'DELIV-' . strtoupper(Str::random(12)),
                'escrowed_at'                  => now(), 
            ]);

            // 7. Charger les relations à la volée pour préparer les payloads de Reverb
            $order->load(['buyer', 'product.producer']);

            // 8. ⚡ Déclencher la notification temps réel pour le Producteur/Vendeur concerné
            broadcast(new OrderPlacedForProducer($order))->toOthers();

            // 9. 🗺️ Extraire la zone géographique du produit pour arroser les transporteurs du périmètre
            $zone = $order->product->zone ?? 'default_zone';

            // 10. ⚡ Activer le radar temps réel pour avertir tous les chauffeurs de la zone
            broadcast(new OrderAvailableForDrivers($order, $zone))->toOthers();

            return $order;
        });
    }

    /**
     * Étape 2 : Déclenchement d'un litige sécurisé par verrou atomique
     */
    public function triggerBuyerDispute(string $orderId, string $buyerId, string $reason, string $photoPath): Order
    {
        $lock = Cache::lock('processing-dispute-' . $orderId, 10);

        if (!$lock->get()) {
            throw new Exception("Une opération est déjà en cours sur cette commande.");
        }

        try {
            return DB::transaction(function () use ($orderId, $buyerId, $reason, $photoPath) {
                $order = Order::where('id', $orderId)->lockForUpdate()->firstOrFail();

                if ($order->buyer_id !== $buyerId) {
                    throw new Exception("Vous n'êtes pas le propriétaire de cette commande.");
                }

                if ($order->status !== 'collected') {
                    throw new Exception("Impossible d'ouvrir un litige à ce stade du transport.");
                }

                // Réglage de la valeur pour correspondre exactement à l'ENUM de ta table
                $order->status                    = 'disputed'; // ✅ "disputed" avec le 'd'
                $order->buyer_dispute_reason      = $reason;
                $order->buyer_dispute_photo_path  = $photoPath;
                $order->save();

                return $order;
            });
        } finally {
            $lock->release();
        }
    }
}