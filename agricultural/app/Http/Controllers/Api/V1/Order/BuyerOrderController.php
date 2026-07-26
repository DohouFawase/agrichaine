<?php

namespace App\Http\Controllers\Api\V1\Order;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use App\Services\BuyerOrderService;
use Exception;

class BuyerOrderController extends Controller
{
    protected $buyerOrderService;

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
            // 🔧 NOTE : total_price / delivery_price ne sont plus requis/utilisés
            // pour le calcul — BuyerOrderService recalcule tout côté serveur à
            // partir du prix réel du produit. On les laisse acceptés en entrée
            // (nullable) uniquement pour ne pas casser un éventuel appel existant
            // du frontend, mais ils sont ignorés par le service.
            'total_price'      => 'nullable|numeric|min:0',
            'delivery_price'   => 'nullable|numeric|min:0',
        ]);

        try {
            $buyerId = $request->user()->id;
            $order = $this->buyerOrderService->createAndEscrowOrder($request->all(), $buyerId);

            return response()->json([
                'success'  => true,
                'order_id' => $order->id,
                'status'   => $order->status,
                'message'  => 'Fonds sécurisés avec succès au séquestre. Recherche de transporteur active.',
                // 🔧 AJOUT : le frontend (orderSlice::createOrder.fulfilled) attend
                // action.payload.data pour peupler state.currentOrder — absent
                // avant cette correction, ce qui aurait cassé l'écran de suivi
                // juste après la création de la commande.
                'data'     => new OrderResource($order->load(['buyer', 'product.producer', 'transporter'])),
            ], 201); // 🔧 CORRIGÉ : 211 n'est pas un code HTTP valide

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
            'proof_photo' => 'required|image|mimes:jpeg,png,jpg|max:5000',
        ]);

        try {
            $buyerId = $request->user()->id;
            $photoPath = '';

            if ($request->hasFile('proof_photo')) {
                $path = $request->file('proof_photo')->store('orders/disputes', 'public');
                $photoPath = Storage::url($path);
            }

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