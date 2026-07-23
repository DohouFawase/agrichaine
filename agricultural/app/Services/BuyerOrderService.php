<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Wallet;
use App\Models\Product;
use App\Models\WalletTransaction;
use App\Notifications\OrderPlacedForProducer;
use App\Events\OrderAvailableForDrivers;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Exception;

class BuyerOrderService
{
    /**
     * Taux de frais de livraison appliqué sur le prix des articles.
     * 🔧 Aligné sur OrderController::store pour que les deux chemins de
     * création de commande utilisent la même règle métier.
     */
    protected const DELIVERY_FEE_RATE = 0.15;

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

            // 🔧 CORRIGÉ — FAILLE CRITIQUE : le prix n'est JAMAIS accepté depuis le
            // client. Avant cette correction, $data['total_price'] et
            // $data['delivery_price'] venaient directement du body de la requête
            // HTTP, permettant à n'importe quel acheteur de commander pour
            // quasiment 0 FCFA en falsifiant ces champs. Le prix est maintenant
            // recalculé ici à partir du prix unitaire réel du produit en base.
            $totalPrice   = (int) round($data['quantity_ordered'] * $product->price_per_unit);
            $deliveryFees = (int) round($totalPrice * self::DELIVERY_FEE_RATE);
            $globalCost   = $totalPrice + $deliveryFees;

            // Décrémenter la quantité (gère le type decimal 10,2 de ta migration)
            $product->decrement('quantity', $data['quantity_ordered']);

            // 🔧 AJOUT : cohérent avec OrderRepository::create — évite qu'un produit
            // à 0 en stock reste affiché comme disponible.
            if ($product->quantity == 0) {
                $product->update(['status' => 'sold_out']);
            }

            // 2. Verrouiller le portefeuille de l'acheteur (Pessimistic Locking)
            $wallet = Wallet::where('user_id', $buyerId)->lockForUpdate()->firstOrFail();

            if ($wallet->balance < $globalCost) {
                throw new Exception("Solde insuffisant dans votre portefeuille pour sécuriser cette commande (Requis : {$globalCost} XOF).");
            }

            // 🔧 AJOUT : cohérence de devise, même garde que sur le flux de livraison
            $orderCurrency = $wallet->currency ?? 'XOF';
            if ($wallet->currency !== $orderCurrency) {
                throw new Exception("Incohérence de devise détectée. Opération bloquée par sécurité.");
            }

            // 3. Déduire l'argent du portefeuille
            $wallet->decrement('balance', $globalCost);

            // 4. Tracer le blocage financier
            WalletTransaction::create([
                'wallet_id'   => $wallet->id,
                'amount'      => $globalCost,
                'type'        => 'escrow_lock',
                'reference'   => 'ESC-' . strtoupper(Str::random(16)),
                'description' => "Fonds bloqués au séquestre pour commande vivrière",
            ]);

            // 5. Insérer la commande avec les statuts et colonnes EXACTES de ta migration
            $order = Order::create([
                'buyer_id'                     => $buyerId,
                'product_id'                   => $data['product_id'],
                'quantity_ordered'              => $data['quantity_ordered'],
                'total_price'                  => $totalPrice,   // 🔧 valeur calculée, plus celle du client
                'delivery_fees'                => $deliveryFees, // 🔧 idem
                'status'                       => 'paid_searching_driver',
                'verification_code_collection' => 'COLL-' . strtoupper(Str::random(12)),
                'verification_code_delivery'   => 'DELIV-' . strtoupper(Str::random(12)),
                'escrowed_at'                  => now(),
            ]);

            // 6. Charger les relations à la volée pour préparer les payloads de Reverb
            $order->load(['buyer', 'product.producer']);

            $producer = $order->product?->producer;
            if ($producer) {
                $producer->notify(new OrderPlacedForProducer($order));
            }

            // 7. 🔧 CORRIGÉ : 'product->zone' n'existe pas sur le modèle Product
            // (colonnes réelles : producer_id, name, quantity, unit, price_per_unit,
            // location, status). La zone était donc TOUJOURS 'default_zone',
            // empêchant tout filtrage géographique réel des transporteurs.
            // On utilise 'origin_country_code', colonne confirmée sur `orders`,
            // comme le fait déjà OrderController::store.
            $zone = $order->origin_country_code ?? 'BJ';

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

                $order->status                   = 'disputed';
                $order->buyer_dispute_reason     = $reason;
                $order->buyer_dispute_photo_path = $photoPath;
                $order->save();

                return $order;
            });
        } finally {
            $lock->release();
        }
    }
}