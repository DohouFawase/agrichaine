<?php

namespace App\Http\Controllers\Api\V1\Fidelity;

use App\Http\Controllers\Controller;
use App\Models\CustomerLoyaltyStatus;
use App\Models\RecurringOrder;
use App\Services\LoyaltyService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;


class LoyaltyController extends Controller
{
    protected LoyaltyService $loyaltyService;

    public function __construct(LoyaltyService $loyaltyService)
    {
        $this->loyaltyService = $loyaltyService;
    }

    /**
     * Statut de fidélité de l'acheteur connecté envers un producteur donné
     * GET api/v1/loyalty/status/{producerId}
     */
    public function status(Request $request, string $producerId): JsonResponse
    {
        $buyerId = $request->user()->id;

        $status = CustomerLoyaltyStatus::where('buyer_id', $buyerId)
            ->where('producer_id', $producerId)
            ->with('currentTier')
            ->first();

        return response()->json([
            'success' => true,
            'data' => $status ? [
                'tier_name' => $status->currentTier?->name,
                'badge_slug' => $status->currentTier?->badge_slug,
                'rolling_volume' => $status->rolling_volume,
                'rolling_orders_count' => $status->rolling_orders_count,
                'recurring_purchases_enabled' => $status->recurring_purchases_enabled,
                'can_enable_recurring_purchases' => $status->currentTier?->grants_recurring_purchases ?? false,
            ] : null,
        ]);
    }

    /**
     * 🔧 AJOUT : Liste de TOUS les statuts de fidélité de l'acheteur connecté,
     * tous producteurs confondus — alimente l'onglet dédié du profil.
     * GET api/v1/loyalty/statuses
     */
    public function allStatuses(Request $request): JsonResponse
    {
        $buyerId = $request->user()->id;

        $statuses = CustomerLoyaltyStatus::where('buyer_id', $buyerId)
            ->whereNotNull('current_tier_id') // n'affiche que les paliers réellement atteints
            ->with(['currentTier', 'producer'])
            ->get();

        // Récupère aussi le palier suivant (pour la barre de progression)
        $allTiers = \App\Models\LoyaltyTier::where('is_active', true)->orderBy('rank')->get();

        $data = $statuses->map(function ($status) use ($allTiers) {
            $nextTier = $allTiers->first(fn($t) => $t->rank > $status->currentTier->rank);

            return [
                'producer_id' => $status->producer_id,
                'producer_name' => $status->producer->name,
                'tier_name' => $status->currentTier->name,
                'badge_slug' => $status->currentTier->badge_slug,
                'rolling_volume' => $status->rolling_volume,
                'rolling_orders_count' => $status->rolling_orders_count,
                'recurring_purchases_enabled' => $status->recurring_purchases_enabled,
                'can_enable_recurring_purchases' => $status->currentTier->grants_recurring_purchases,
                'next_tier' => $nextTier ? [
                    'name' => $nextTier->name,
                    'volume_remaining' => max(0, $nextTier->min_volume - $status->rolling_volume),
                    'orders_remaining' => max(0, $nextTier->min_orders - $status->rolling_orders_count),
                ] : null, // null = déjà au palier maximum
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Active la programmation d'achats (déclenché au clic sur la notification)
     * POST api/v1/loyalty/recurring-purchases/enable
     */
    public function enableRecurringPurchases(Request $request): JsonResponse
    {
        $buyerId = $request->user()->id;

        $request->validate([
            'producer_id' => 'required|uuid',
        ]);

        try {
            $status = $this->loyaltyService->enableRecurringPurchases($buyerId, $request->producer_id);

            return response()->json([
                'success' => true,
                'message' => 'Programmation d\'achats activée avec succès.',
                'data' => ['recurring_purchases_enabled' => $status->recurring_purchases_enabled],
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 403);
        }
    }

    /**
     * Programme une commande récurrente
     * POST api/v1/loyalty/recurring-orders
     */
    public function scheduleRecurringOrder(Request $request): JsonResponse
    {
        $buyerId = $request->user()->id;

        $request->validate([
            'product_id' => 'required|uuid|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'frequency' => 'required|in:weekly,biweekly,monthly',
            // 🔧 AJOUT : date/heure précise choisie par l'acheteur (style
            // programmation de post Facebook), doit être dans le futur.
            'scheduled_at' => 'required|date|after:now',
            'delivery_latitude' => 'required|numeric',
            'delivery_longitude' => 'required|numeric',
            'delivery_address_name' => 'nullable|string',
        ]);

        try {
            $recurringOrder = $this->loyaltyService->scheduleRecurringOrder(
                $buyerId,
                $request->product_id,
                $request->quantity,
                $request->frequency,
                $request->delivery_latitude,
                $request->delivery_longitude,
                $request->delivery_address_name,
                $request->scheduled_at // 🔧 AJOUT
            );

            return response()->json([
                'success' => true,
                'message' => 'Commande programmée avec succès. Le stock nécessaire est réservé.',
                'data' => $recurringOrder,
            ], 201);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Liste des commandes programmées de l'acheteur connecté
     * GET api/v1/loyalty/recurring-orders
     */
    public function listRecurringOrders(Request $request): JsonResponse
    {
        $buyerId = $request->user()->id;

        $orders = RecurringOrder::where('buyer_id', $buyerId)
            ->with('product')
            ->orderBy('next_run_at')
            ->get();

        return response()->json(['success' => true, 'data' => $orders]);
    }

    /**
     * Annule une commande programmée et libère le stock réservé
     * DELETE api/v1/loyalty/recurring-orders/{id}
     */
    public function cancelRecurringOrder(Request $request, string $id): JsonResponse
    {
        $buyerId = $request->user()->id;

        try {
            $this->loyaltyService->cancelRecurringOrder($id, $buyerId);

            return response()->json(['success' => true, 'message' => 'Commande programmée annulée.']);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
