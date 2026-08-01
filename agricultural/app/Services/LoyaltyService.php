<?php

namespace App\Services;

use App\Models\CustomerLoyaltyStatus;
use App\Models\LoyaltyTier;
use App\Models\Order;
use App\Models\Product;
use App\Models\RecurringOrder;
use App\Notifications\BestClientAchieved;
use Illuminate\Support\Facades\DB;
use Exception;

class LoyaltyService
{
    /**
     * ── 1. ANALYSE ET QUALIFICATION ──────────────────────────────────
     * Réévalue le statut de fidélité d'un acheteur envers un producteur,
     * sur une fenêtre glissante (par défaut 60 jours = 2 mois).
     *
     * Déclenché après chaque livraison confirmée (voir intégration dans
     * OrderCollectionService::validateDelivery) — pas besoin d'un cron
     * qui balaie toute la base : seul le couple acheteur/producteur
     * concerné par la commande vient d'évoluer.
     */
    public function evaluate(string $buyerId, string $producerId): CustomerLoyaltyStatus
    {
        return DB::transaction(function () use ($buyerId, $producerId) {
            $status = CustomerLoyaltyStatus::firstOrCreate(
                ['buyer_id' => $buyerId, 'producer_id' => $producerId],
                ['period_start' => now()]
            );

            $tiers = LoyaltyTier::where('is_active', true)
                ->orderByDesc('rank')
                ->get();

            if ($tiers->isEmpty()) {
                return $status;
            }

            $maxPeriodDays = $tiers->max('period_days');
            $windowStart = now()->subDays($maxPeriodDays);

            $orders = Order::where('buyer_id', $buyerId)
                ->whereHas('product', fn ($q) => $q->where('producer_id', $producerId))
                ->where('status', 'delivered')
                ->where('delivered_at', '>=', $windowStart)
                ->get();

            $rollingVolume = (int) $orders->sum('total_price');
            $rollingOrders = $orders->count();

            $status->rolling_volume = $rollingVolume;
            $status->rolling_orders_count = $rollingOrders;
            $status->last_evaluated_at = now();

            // Le palier atteint = le plus haut rang dont les deux seuils sont franchis
            $matchedTier = null;
            foreach ($tiers as $tier) {
                $tierWindowStart = now()->subDays($tier->period_days);
                $ordersInTierWindow = $orders->filter(
                    fn ($o) => $o->delivered_at >= $tierWindowStart
                );

                $volumeInWindow = (int) $ordersInTierWindow->sum('total_price');
                $countInWindow = $ordersInTierWindow->count();

                if ($volumeInWindow >= $tier->min_volume && $countInWindow >= $tier->min_orders) {
                    $matchedTier = $tier;
                    break; // premier trouvé = plus haut rang, grâce à orderByDesc('rank')
                }
            }

            $previousTierId = $status->current_tier_id;
            $status->current_tier_id = $matchedTier?->id;
            $status->save();

            // ── 2. NOTIFICATION VIP ──────────────────────────────────
            if (
                $matchedTier
                && $matchedTier->grants_recurring_purchases
                && $previousTierId !== $matchedTier->id
                && $status->best_client_notified_at === null
            ) {
                $buyer = $status->buyer;
                $buyer->notify(new BestClientAchieved($status));
                $status->best_client_notified_at = now();
                $status->save();
            }

            return $status;
        });
    }

    /**
     * ── 2 (suite). Activation au clic sur la notification ────────────
     * N'active la fonctionnalité que si le client a réellement le palier
     * requis — empêche un appel direct à l'API de contourner la
     * qualification.
     */
    public function enableRecurringPurchases(string $buyerId, string $producerId): CustomerLoyaltyStatus
    {
        $status = CustomerLoyaltyStatus::where('buyer_id', $buyerId)
            ->where('producer_id', $producerId)
            ->with('currentTier')
            ->firstOrFail();

        if (!$status->currentTier || !$status->currentTier->grants_recurring_purchases) {
            throw new Exception("Vous n'avez pas encore le statut requis pour cette fonctionnalité.");
        }

        $status->recurring_purchases_enabled = true;
        $status->save();

        return $status;
    }

    /**
     * ── 3. PROGRAMMATION D'ACHATS + RÉSERVATION DE STOCK ─────────────
     * Réserve immédiatement le volume nécessaire (product.reserved_quantity)
     * afin que des acheteurs classiques ne puissent pas épuiser le stock
     * prévu pour ce client VIP avant la prochaine exécution programmée.
     */
    public function scheduleRecurringOrder(
        string $buyerId,
        string $productId,
        float $quantity,
        string $frequency,
        float $deliveryLatitude,
        float $deliveryLongitude,
        ?string $deliveryAddressName = null,
        ?string $scheduledAt = null // 🔧 AJOUT : date/heure précise (style Facebook)
    ): RecurringOrder {
        return DB::transaction(function () use (
            $buyerId, $productId, $quantity, $frequency,
            $deliveryLatitude, $deliveryLongitude, $deliveryAddressName, $scheduledAt
        ) {
            $product = Product::where('id', $productId)->lockForUpdate()->firstOrFail();

            $status = CustomerLoyaltyStatus::where('buyer_id', $buyerId)
                ->where('producer_id', $product->producer_id)
                ->with('currentTier')
                ->first();

            if (!$status?->recurring_purchases_enabled) {
                throw new Exception("La programmation d'achats n'est pas activée pour ce vendeur.");
            }

            $availableForReservation = $product->quantity - $product->reserved_quantity;

            if ($availableForReservation < $quantity) {
                throw new Exception("Stock insuffisant pour réserver cette quantité en programmation.");
            }

            // Réservation : ce volume n'est plus proposé aux nouvelles
            // commandes classiques (voir Product::getAvailableQuantity()).
            $product->increment('reserved_quantity', $quantity);

            $recurringOrder = RecurringOrder::create([
                'buyer_id' => $buyerId,
                'product_id' => $productId,
                'quantity' => $quantity,
                'frequency' => $frequency,
                // 🔧 CORRIGÉ : utilise la date choisie par l'acheteur plutôt
                // que de toujours démarrer immédiatement.
                'next_run_at' => $scheduledAt ? \Carbon\Carbon::parse($scheduledAt) : now(),
                'status' => 'active',
                'delivery_latitude' => $deliveryLatitude,
                'delivery_longitude' => $deliveryLongitude,
                'delivery_address_name' => $deliveryAddressName,
            ]);

            return $recurringOrder;
        });
    }

    /**
     * Annule une commande programmée et libère le stock réservé.
     */
    public function cancelRecurringOrder(string $recurringOrderId, string $buyerId): void
    {
        DB::transaction(function () use ($recurringOrderId, $buyerId) {
            $recurringOrder = RecurringOrder::where('id', $recurringOrderId)
                ->where('buyer_id', $buyerId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($recurringOrder->status === 'cancelled') {
                return;
            }

            $product = Product::where('id', $recurringOrder->product_id)->lockForUpdate()->first();
            if ($product) {
                $product->reserved_quantity = max(0, $product->reserved_quantity - $recurringOrder->quantity);
                $product->save();
            }

            $recurringOrder->status = 'cancelled';
            $recurringOrder->save();
        });
    }

    /**
     * ── Exécution automatique des commandes programmées arrivées à échéance ──
     * Appelé par la commande planifiée ProcessRecurringOrders (toutes les heures).
     * Consomme le stock RÉSERVÉ (pas le stock général) puisqu'il a déjà été
     * mis de côté lors de la programmation.
     */
    public function processRecurringOrder(RecurringOrder $recurringOrder, BuyerOrderService $buyerOrderService): void
    {
        DB::transaction(function () use ($recurringOrder, $buyerOrderService) {
            $product = Product::where('id', $recurringOrder->product_id)->lockForUpdate()->firstOrFail();

            // Le stock réservé doit être suffisant — il l'était à la
            // programmation, mais on revérifie par sécurité (annulations
            // partielles, ajustements manuels, etc.)
            if ($product->reserved_quantity < $recurringOrder->quantity) {
                // On ne bloque pas indéfiniment : on repousse à la prochaine
                // échéance plutôt que de faire échouer silencieusement.
                $recurringOrder->next_run_at = $recurringOrder->computeNextRunAt();
                $recurringOrder->save();
                return;
            }

            // Libère la réservation AVANT de créer la commande réelle : la
            // commande passera par le flux standard (BuyerOrderService), qui
            // va lui-même décrémenter product.quantity normalement. On ne
            // veut pas double-compter (réservé + décrémenté).
            $product->decrement('reserved_quantity', $recurringOrder->quantity);

            $order = $buyerOrderService->createAndEscrowOrder([
                'product_id' => $recurringOrder->product_id,
                'quantity_ordered' => $recurringOrder->quantity,
                'delivery_latitude' => $recurringOrder->delivery_latitude,
                'delivery_longitude' => $recurringOrder->delivery_longitude,
                'delivery_address_name' => $recurringOrder->delivery_address_name,
            ], $recurringOrder->buyer_id);

            $recurringOrder->last_order_id = $order->id;
            $recurringOrder->last_executed_at = now();
            $recurringOrder->next_run_at = $recurringOrder->computeNextRunAt();

            // Re-réserve le même volume pour la PROCHAINE échéance, si le
            // stock disponible le permet encore.
            $availableForReservation = $product->quantity - $product->reserved_quantity;
            if ($availableForReservation >= $recurringOrder->quantity) {
                $product->increment('reserved_quantity', $recurringOrder->quantity);
            } else {
                // Pas assez de stock pour reconduire la réservation : la
                // prochaine exécution tentera sans garantie prioritaire.
                \Illuminate\Support\Facades\Log::warning('[Loyalty] Stock insuffisant pour reconduire la réservation', [
                    'recurring_order_id' => $recurringOrder->id,
                    'product_id' => $product->id,
                ]);
            }

            $recurringOrder->save();
        });
    }
}