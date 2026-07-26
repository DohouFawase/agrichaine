<?php

namespace App\Http\Controllers\Api\V1\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\AssignDriverRequest;
use App\Http\Requests\Order\UpdateStatusRequest;
use App\Http\Resources\OrderResource;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Models\OrderTracking;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    protected $orderRepository;
    protected $productRepository;

    public function __construct(
        OrderRepositoryInterface $orderRepository,
        ProductRepositoryInterface $productRepository
    ) {
        $this->orderRepository = $orderRepository;
        $this->productRepository = $productRepository;
    }

    /**
     * Liste toutes les commandes en cours de l'utilisateur connecté selon son rôle
     * GET api/v1/orders
     */
    public function index(Request $request): JsonResponse
    {
        $userId = Auth::guard('api')->id();
        $user = Auth::guard('api')->user();
        $role = $user->role;

        try {
            $orders = $this->orderRepository->getOrdersByRole($userId, $role, true);

            return response()->json([
                'success' => true,
                'user_role' => $role,
                'count' => $orders->count(),
                'data' => OrderResource::collection($orders)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    // 🔧 RETIRÉ : store() — doublon de BuyerOrderController::store(), qui est
    // désormais la seule route de création de commande (POST api/v1/buyer/orders).
    // Voir BuyerOrderService::createAndEscrowOrder pour la logique canonique.

    /**
     * Tracking International Multizone (Bénin, Togo, Nigéria...)
     */
    public function getTracking(string $id): JsonResponse
    {
        $order = $this->orderRepository->find($id);
        $product = $order->product;

        $points = OrderTracking::where('order_id', $order->id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'order_status' => $order->status,
            'currency' => $order->currency ?? 'XOF',

            'origin' => [
                'latitude' => (float) $product->latitude,
                'longitude' => (float) $product->longitude,
                'address_name' => $product->location ?? 'Point de collecte',
                'country_code' => $order->origin_country_code ?? 'BJ',
            ],

            'destination' => [
                'latitude' => (float) $order->delivery_latitude,
                'longitude' => (float) $order->delivery_longitude,
                'address_name' => $order->delivery_address_name ?? 'Point de livraison',
                'country_code' => $order->destination_country_code ?? 'BJ',
            ],

            'current_position' => $points->last() ? [
                'latitude' => (float) $points->last()->latitude,
                'longitude' => (float) $points->last()->longitude,
                'current_city' => $points->last()->current_city ?? 'Axe routier',
                'updated_at' => $points->last()->created_at,
            ] : null,

            'full_itinerary' => $points->map(function ($point) {
                return [
                    'latitude' => (float) $point->latitude,
                    'longitude' => (float) $point->longitude,
                    'timestamp' => $point->created_at
                ];
            })
        ]);
    }

    /**
     * Un chauffeur clique sur "ACCEPTER" sur son écran
     */
    public function assignDriver(AssignDriverRequest $request): JsonResponse
    {
        $driverId = Auth::guard('api')->id();
        $user = Auth::guard('api')->user();

        if ($user->role !== 'transporter') {
            return response()->json(['success' => false, 'message' => 'Action non autorisée. Réservé aux transporteurs.'], 403);
        }

        $order = $this->orderRepository->find($request->order_id);

        if ($order->transporter_id !== null || $order->status !== 'paid_searching_driver') {
            return response()->json([
                'success' => false,
                'message' => 'Cette course a déjà été prise par un autre chauffeur.'
            ], 400);
        }

        $updatedOrder = $this->orderRepository->assignDriver($request->order_id, $driverId);

        return response()->json([
            'success' => true,
            'message' => 'Course attribuée avec succès. En route pour récupérer la marchandise !',
            'data' => new OrderResource($updatedOrder)
        ]);
    }

    /**
     * Changement de statut standard
     */
    public function updateStatus(UpdateStatusRequest $request, string $id): JsonResponse
    {
        $order = $this->orderRepository->find($id);
        $user = Auth::guard('api')->user();
        $newStatus = $request->status;

        if ($newStatus === 'collected' && $order->transporter_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Action non autorisée.'], 403);
        }

        if ($newStatus === 'delivered' && $order->buyer_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Seul l’acheteur peut confirmer la livraison sans QR code.'], 403);
        }

        $updatedOrder = $this->orderRepository->updateStatus($id, $newStatus);

        return response()->json([
            'success' => true,
            'message' => "Statut de la commande mis à jour : {$newStatus}.",
            'data' => new OrderResource($updatedOrder)
        ]);
    }

    /**
     * Envoi automatique des coordonnées GPS du téléphone (Tâche de fond)
     */
    public function updateTracking(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'current_city' => 'nullable|string'
        ]);

        $order = $this->orderRepository->find($id);

        if (Auth::guard('api')->id() !== $order->transporter_id) {
            return response()->json(['success' => false, 'message' => 'Action non autorisée.'], 403);
        }

        $tracking = OrderTracking::create([
            'order_id' => $order->id,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'current_city' => $request->current_city
        ]);

        broadcast(new \App\Events\DriverLocationUpdated($tracking, $order->buyer_id))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Coordonnées de suivi enregistrées.',
            'data' => $tracking
        ]);
    }

    /**
     * Voir les détails d'une commande
     */
    public function show(string $id): JsonResponse
    {
        $order = $this->orderRepository->find($id);

        return response()->json([
            'success' => true,
            'data' => new OrderResource($order)
        ]);
    }

    /**
     * Synchronisation du tracking par paquets (Batch Sync pour mode déconnecté)
     */
    public function syncTrackingBatch(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'locations' => 'required|array',
            'locations.*.latitude' => 'required|numeric',
            'locations.*.longitude' => 'required|numeric',
            'locations.*.current_city' => 'nullable|string',
            'locations.*.timestamp' => 'required|date_format:Y-m-d H:i:s',
        ]);

        $order = $this->orderRepository->find($id);

        foreach ($request->locations as $location) {
            OrderTracking::create([
                'order_id' => $order->id,
                'latitude' => $location['latitude'],
                'longitude' => $location['longitude'],
                'current_city' => $location['current_city'] ?? 'Axe de transport',
                'created_at' => $location['timestamp'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => count($request->locations) . ' points de tracking synchronisés avec succès.'
        ]);
    }
}