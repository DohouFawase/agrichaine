<?php

namespace App\Services; // ✅ Namespace propre aux services

use App\Models\Order;
use App\Models\UserRating;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Exception;

class OrderCollectionService // ✅ Plus de "extends ServiceProvider"
{
    /**
     * Valide la collecte physique par le chauffeur (Vérification QR Code + Volume)
     * POST api/v1/orders/{id}/validate-collection
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

                if ($order->driver_id !== $driverId) {
                    throw new Exception("Ce chauffeur n'est pas autorisé à collecter cette commande.");
                }

                // Ajustement selon ton ENUM : la commande est prête si elle est payée et cherche un chauffeur
                if ($order->status !== 'paid_searching_driver' && $order->status !== 'assigned_to_driver') {
                    throw new Exception("La commande n'est pas prête pour la collecte.");
                }

                if ($order->verification_code_collection !== $scannedCode) {
                    throw new Exception("Le code de validation de collecte est invalide. Fraude suspectée.");
                }

                $order->quantity_collected = $quantityCollected;

                $margeErreurAllowed = 0.10;
                $differenceVolume   = abs($order->quantity_ordered - $quantityCollected);
                $limiteAllowed      = $order->quantity_ordered * $margeErreurAllowed;

                if ($differenceVolume > $limiteAllowed) {
                    $order->status         = 'disputed'; // ✅ Aligné avec 'disputed' de ton ENUM
                    $order->dispute_reason = "Écart de volume trop important lors du chargement : Commandé ({$order->quantity_ordered}), Chargé ({$quantityCollected})";
                    $order->save();

                    throw new Exception("Écart de volume trop important. La commande est placée en litige.");
                }

                $order->status       = 'collected';
                $order->collected_at = now();
                $order->save();

                return $order;
            });

        } finally {
            $lock->release();
        }
    }

    /**
     * Enregistre une notation du chauffeur envers le producteur après livraison.
     * POST api/v1/orders/{id}/rate-producer
     */
    public function rateProducer(string $orderId, string $fromDriverId, int $rating, ?string $comment = null): void
    {
        $order = Order::findOrFail($orderId);

        if ($order->driver_id !== $fromDriverId || $order->status !== 'delivered') {
            throw new Exception("Vous n'êtes pas autorisé à noter cette commande.");
        }

        DB::transaction(function () use ($order, $fromDriverId, $rating, $comment) {
            UserRating::create([
                'order_id'     => $order->id,
                'from_user_id' => $fromDriverId,
                'to_user_id'   => $order->product->user_id,
                'rating'       => $rating,
                'comment'      => $comment,
            ]);

            $producer = User::find($order->product->user_id);
            $newAverage = UserRating::where('to_user_id', $producer->id)->avg('rating');

            $producer->average_rating = round($newAverage, 2);
            $producer->save();
        });
    }
}