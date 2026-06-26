<?php

namespace App\Http\Controllers\Api\V1\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\StoreOrderRequest;
use App\Http\Requests\Order\AssignDriverRequest;
use App\Http\Requests\Order\UpdateStatusRequest;
use App\Http\Resources\OrderResource;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Models\OrderTracking;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
     * ✨ AJOUT : Liste toutes les commandes en cours de l'utilisateur connecté selon son rôle
     * GET api/v1/orders
     */
    public function index(Request $request): JsonResponse
    {
        $userId = Auth::guard('api')->id();
        $user = Auth::guard('api')->user();
        $role = $user->role; // 'producer', 'buyer', ou 'transporter'

        try {
            // Interroge le repository avec le filtre dynamique par rôle
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

    /**
     * ÉTAPE 1 : Passer commande et bloquer les fonds via le Wallet (Séquestre)
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $buyerId = Auth::guard('api')->id();
        $product = $this->productRepository->find($request->product_id);

        // Validation stricte des coordonnées et des contraintes terrain (vocal)
        $request->validate([
            'delivery_latitude' => 'required|numeric',
            'delivery_longitude' => 'required|numeric',
            'delivery_address_name' => 'nullable|string',
            'audio_instruction' => 'nullable|file|mimes:mp3,wav,ogg,m4a|max:2000', // Max 2Mo pour le terrain
        ]);

        $totalPrice = (int) ($request->quantity_ordered * $product->price_per_unit);
        $deliveryFees = (int) ($totalPrice * 0.15);
        $globalCost = $totalPrice + $deliveryFees;

        try {
            // Traitement de la consigne audio en langue locale (géré avant la transaction pour garder le bloc léger)
            $audioPath = null;
            if ($request->hasFile('audio_instruction')) {
                $path = $request->file('audio_instruction')->store('orders/vocals', 'public');
                $audioPath = Storage::url($path);
            }

            // Préparation des données avec génération des jetons QR Codes uniques (Anti-fraude)
            $orderData = [
                'buyer_id' => $buyerId,
                'product_id' => $request->product_id,
                'quantity_ordered' => $request->quantity_ordered,
                'total_price' => $totalPrice,
                'delivery_fees' => $deliveryFees,
                'status' => 'paid_searching_driver', // Fonds bloqués au coffre-fort
                'delivery_latitude' => $request->delivery_latitude,
                'delivery_longitude' => $request->delivery_longitude,
                'delivery_address_name' => $request->delivery_address_name,
                'audio_instruction_path' => $audioPath,
                'verification_code_collection' => 'COLL-' . strtoupper(Str::random(12)),
                'verification_code_delivery' => 'DELIV-' . strtoupper(Str::random(12)),
            ];

            // CORRECTION ICI : On passe bien les 3 arguments attendus par ton OrderRepository
            $order = $this->orderRepository->create($orderData, $buyerId, $globalCost);

            return response()->json([
                'success' => true,
                'message' => 'Commande validée et fonds sécurisés au séquestre. Recherche d’un transporteur...',
                'data' => new OrderResource($order)
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * ÉTAPE 5 : Tracking International Multizone (Bénin, Togo, Nigéria...)
     */
    public function getTracking(string $id): JsonResponse
    {
        $order = $this->orderRepository->find($id);
        $product = $order->product;

        // Optimisation de la requête grâce à l'index composite (order_id, created_at)
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
     * ÉTAPE 2 : Un chauffeur clique sur "ACCEPTER" sur son écran
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
     * ÉTAPE 3 : Changement de statut standard
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
     * ÉTAPE 4 : Envoi automatique des coordonnées GPS du téléphone (Tâche de fond)
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