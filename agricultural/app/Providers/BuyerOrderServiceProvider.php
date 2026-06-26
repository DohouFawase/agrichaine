<?php

namespace App\Providers;

use App\Models\Order;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\ServiceProvider;
use Exception;

class BuyerOrderServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Étape 1 : Création de la commande et Verrouillage des fonds de l'acheteur au séquestre
     */
    public function createAndEscrowOrder(array $data, int $buyerId): Order
    {
        return DB::transaction(function () use ($data, $buyerId) {
            $wallet = Wallet::where('user_id', $buyerId)->lockForUpdate()->firstOrFail();
            $totalCost = $data['total_price'];

            if ($wallet->balance < $totalCost) {
                throw new Exception("Solde insuffisant dans votre portefeuille pour sécuriser cette commande.");
            }

            $wallet->decrement('balance', $totalCost);

            $order = Order::create([
                'buyer_id'                  => $buyerId,
                'product_id'                => $data['product_id'],
                'quantity_ordered'          => $data['quantity_ordered'],
                'total_price'               => $totalCost,
                'delivery_price'            => $data['delivery_price'],
                'status'                    => 'escrowed',
                'verification_code_delivery'=> 'DELIV-' . strtoupper(bin2hex(random_bytes(8))),
                'escrowed_at'               => now(),
            ]);

            return $order;
        });
    }

    /**
     * Étape 2 : Ouverture d'un litige par l'acheteur à la livraison
     */
    public function triggerBuyerDispute(string $orderId, int $buyerId, string $reason, string $photoPath): Order
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

                $order->status                    = 'dispute';
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