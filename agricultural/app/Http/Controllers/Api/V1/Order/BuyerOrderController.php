<?php

namespace App\Http\Controllers\Api\V1\Order;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use App\Services\BuyerOrderService; // ✅ Le seul import nécessaire pour ton service métier
use Exception;

class BuyerOrderController extends Controller
{
    protected $buyerOrderService;

    /**
     * Injection automatique du service métier par le conteneur de Laravel
     */
    public function __construct(BuyerOrderService $buyerOrderService)
    {
        $this->buyerOrderService = $buyerOrderService;
    }

    /**
     * Initier une commande vivrière avec blocage des fonds automatique
     * POST api/v1/buyer/orders
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'product_id'       => 'required|uuid',
            'quantity_ordered' => 'required|integer|min:1',
            'total_price'      => 'required|numeric|min:0',
            'delivery_price'   => 'required|numeric|min:0',
        ]);

        try {
            $buyerId = $request->user()->id;
            
            // Exécution sécurisée (Vérification des stocks, verrous de wallets et écriture DB)
            $order = $this->buyerOrderService->createAndEscrowOrder($request->all(), $buyerId);

            return response()->json([
                'success'  => true,
                'order_id' => $order->id,
                'status'   => $order->status,
                'message'  => 'Fonds sécurisés avec succès au séquestre. Recherche de transporteur active.'
            ], 211);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Déclarer un litige à l'arrivée (Tomates pourries, sacs manquants, etc.)
     * POST api/v1/buyer/orders/{id}/dispute
     */
    public function dispute(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'reason'      => 'required|string|min:10|max:1000',
            'proof_photo' => 'required|image|mimes:jpeg,png,jpg|max:5000', // Preuve photo obligatoire sur le terrain
        ]);

        try {
            $buyerId = $request->user()->id;
            $photoPath = '';

            // Upload sécurisé de la preuve visuelle de l'état de la marchandise
            if ($request->hasFile('proof_photo')) {
                $path = $request->file('proof_photo')->store('orders/disputes', 'public');
                $photoPath = Storage::url($path);
            }

            // Déclenchement du verrou atomique (Cache::lock) et passage en statut 'dispute'
            $order = $this->buyerOrderService->triggerBuyerDispute($id, $buyerId, $request->reason, $photoPath);

            return response()->json([
                'success' => true,
                'status'  => $order->status,
                'message' => 'Litige enregistré. Les fonds restent gelés jusqu’à résolution par notre équipe.'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}