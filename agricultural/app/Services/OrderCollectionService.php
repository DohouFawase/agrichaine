<?php

namespace App\Services;

use App\Models\Order;
use App\Models\UserRating;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Events\OrderCollected;          // ✅ Ajouté
use App\Events\OrderCollectionDisputed; // ✅ Ajouté
use App\Events\OrderDelivered;          // 🔧 AJOUT : à créer (voir note plus bas)
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;

class OrderCollectionService
{
    /**
     * Valide la collecte physique par le chauffeur (Vérification QR Code + Volume)
     */
    public function validateCollection(string $orderId, string $driverId, string $scannedCode, int $quantityCollected): Order
    {
        $lock = Cache::lock('processing-collection-' . $orderId, 10);

        if (!$lock->get()) {
            throw new Exception("Opération déjà en cours de traitement.");
        }

        try {
            return DB::transaction(function () use ($orderId, $driverId, $scannedCode, $quantityCollected) {
                $order = Order::where('id', $orderId)->lockForUpdate()->firstOrFail();

                if ((string) $order->transporter_id !== (string) $driverId) {
                    throw new Exception("Ce chauffeur n'est pas autorisé à collecter cette commande.");
                }

                if ($order->status !== 'paid_searching_driver' && $order->status !== 'assigned_to_driver') {
                    throw new Exception("La commande n'est pas prête pour la collecte.");
                }

                if ($order->verification_code_collection !== $scannedCode) {
                    // 🔍 LOG DE DEBUG TEMPORAIRE — à retirer une fois le bug identifié
                    Log::info('Debug QR collecte', [
                        'order_id'          => $order->id,
                        'expected'          => $order->verification_code_collection,
                        'expected_length'   => strlen($order->verification_code_collection ?? ''),
                        'expected_bytes'    => bin2hex($order->verification_code_collection ?? ''),
                        'scanned'           => $scannedCode,
                        'scanned_length'    => strlen($scannedCode),
                        'scanned_bytes'     => bin2hex($scannedCode),
                        'trimmed_match'     => trim($order->verification_code_collection ?? '') === trim($scannedCode),
                        'case_insensitive_match' => strcasecmp($order->verification_code_collection ?? '', $scannedCode) === 0,
                    ]);

                    throw new Exception("Le code de validation de collecte est invalide. Fraude suspectée.");
                }

                $order->quantity_collected = $quantityCollected;

                $margeErreurAllowed = 0.10;
                $differenceVolume   = abs($order->quantity_ordered - $quantityCollected);
                $limiteAllowed      = $order->quantity_ordered * $margeErreurAllowed;

                // CAS 1 : Écart trop grand -> Passage en litige automatique
                if ($differenceVolume > $limiteAllowed) {
                    $order->status         = 'disputed';
                    $order->dispute_reason = "Écart de volume trop important lors du chargement : Commandé ({$order->quantity_ordered}), Chargé ({$quantityCollected})";
                    $order->save();

                    // ⚡ Alerte l'acheteur du litige immédiat
                    broadcast(new OrderCollectionDisputed($order))->toOthers();

                    throw new Exception("Écart de volume trop important. La commande est placée en litige.");
                }

                // CAS 2 : Tout est parfait -> Collecte validée avec succès
                $order->status       = 'collected';
                $order->collected_at = now();
                $order->save();

                // ⚡ Alerte l'acheteur que son colis est en route
                broadcast(new OrderCollected($order))->toOthers();

                return $order;
            });
        } finally {
            $lock->release();
        }
    }

    /**
     * 🔧 AJOUT : Valide la livraison finale par l'acheteur (Scan du QR Code Transporteur)
     * L'acheteur scanne le code que le transporteur affiche sur son téléphone
     * une fois arrivé à destination. Ce code (verification_code_delivery)
     * a été généré dès la création de la commande (OrderController::store).
     */
    public function validateDelivery(string $orderId, string $buyerId, string $scannedCode): Order
    {
        $lock = Cache::lock('processing-delivery-' . $orderId, 10);

        if (!$lock->get()) {
            throw new Exception("Opération déjà en cours de traitement.");
        }

        try {
            return DB::transaction(function () use ($orderId, $buyerId, $scannedCode) {
                $order = Order::where('id', $orderId)->lockForUpdate()->firstOrFail();

                // Seul l'acheteur de la commande peut valider sa propre livraison
                if ((string) $order->buyer_id !== (string) $buyerId) {
                    throw new Exception("Vous n'êtes pas autorisé à confirmer la livraison de cette commande.");
                }

                // La commande doit être au stade "collectée / en transport" pour être livrée
                if ($order->status !== 'collected') {
                    throw new Exception("Cette commande n'est pas encore prête pour la livraison finale.");
                }

                // Vérification anti-fraude : le code scanné doit correspondre
                // exactement au code de livraison généré à la commande
                if ($order->verification_code_delivery !== $scannedCode) {
                    throw new Exception("Le code de validation de livraison est invalide. Fraude suspectée.");
                }

                $order->status       = 'delivered';
                $order->delivered_at = now();
                $order->save();

                // 🔧 AJOUT : Flux financier Séquestre -> Portefeuilles
                // (reprend le pattern déjà validé dans OrderRepository::validateDeliveryWithQRCode,
                // qui n'était jamais appelé depuis ce service — c'était le vrai bug)
                $totalAmount  = $order->total_price;
                $deliveryFee  = $order->delivery_fees;
                $productPrice = $totalAmount - $deliveryFee;

                $order->loadMissing('product');

                // Créditer le producteur (prix des articles)
                $sellerWallet = Wallet::where('user_id', $order->product->producer_id)
                    ->lockForUpdate()
                    ->firstOrFail();
                $sellerWallet->increment('balance', $productPrice);

                WalletTransaction::create([
                    'wallet_id'   => $sellerWallet->id,
                    'amount'      => $productPrice,
                    'type'        => 'escrow_unlock',
                    'reference'   => 'UNLK-SEL-' . strtoupper(Str::random(12)),
                    'description' => "Paiement reçu pour la vente de produits vivriers",
                ]);

                // Créditer le transporteur (frais de livraison)
                $driverWallet = Wallet::where('user_id', $order->transporter_id)
                    ->lockForUpdate()
                    ->firstOrFail();
                $driverWallet->increment('balance', $deliveryFee);

                WalletTransaction::create([
                    'wallet_id'   => $driverWallet->id,
                    'amount'      => $deliveryFee,
                    'type'        => 'escrow_unlock',
                    'reference'   => 'UNLK-DRV-' . strtoupper(Str::random(12)),
                    'description' => "Paiement reçu pour la course logistique",
                ]);

                // ⚡ Alerte le producteur et le transporteur : fonds libérés, commande terminée
                // broadcast(new OrderDelivered($order))->toOthers();

                return $order;
            });
        } finally {
            $lock->release();
        }
    }

    /**
     * Enregistre une notation du chauffeur envers le producteur après livraison.
     */
    public function rateProducer(string $orderId, string $fromDriverId, int $rating, ?string $comment = null): void
    {
        $order = Order::findOrFail($orderId);

        if ((string) $order->transporter_id !== (string) $fromDriverId || $order->status !== 'delivered') {
            throw new Exception("Vous n'êtes pas autorisé à noter cette commande.");
        }

        DB::transaction(function () use ($order, $fromDriverId, $rating, $comment) {
            $order->loadMissing('product');

            UserRating::create([
                'order_id'     => $order->id,
                'from_user_id' => $fromDriverId,
                'to_user_id'   => $order->product->producer_id, // 🔧 CORRIGÉ : était user_id (colonne inexistante/inutilisée)
                'rating'       => $rating,
                'comment'      => $comment,
            ]);

            $producer = User::find($order->product->producer_id);
            $newAverage = UserRating::where('to_user_id', $producer->id)->avg('rating');
            $producer->average_rating = round($newAverage, 2);
            $producer->save();
        });
    }
}