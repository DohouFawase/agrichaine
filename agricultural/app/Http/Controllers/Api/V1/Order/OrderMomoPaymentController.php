<?php

namespace App\Http\Controllers\Api\V1\Order;

use App\Http\Controllers\Controller;
use App\Services\MomoPaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class OrderMomoPaymentController extends Controller
{
    protected MomoPaymentService $momoPaymentService;

    public function __construct(MomoPaymentService $momoPaymentService)
    {
        $this->momoPaymentService = $momoPaymentService;
    }

    /**
     * Crée une commande en attente et initie le paiement direct via MoMo
     * (alternative à la commande payée par wallet — voir BuyerOrderController::store)
     * POST api/v1/orders/pay-with-momo
     */
    public function initiate(Request $request): JsonResponse
    {
        $buyerId = $request->user()->id;

        // 🔧 CORRIGÉ : total_price/delivery_fees retirés de la validation —
        // ils ne sont plus jamais acceptés depuis le client, calculés
        // exclusivement côté serveur dans MomoPaymentService::initiateOrderPayment.
        $request->validate([
            'product_id'         => 'required|uuid|exists:products,id',
            'quantity_ordered'   => 'required|numeric|min:0.01',
            'phone'              => 'required|string',
            'delivery_latitude'  => 'required|numeric',
            'delivery_longitude' => 'required|numeric',
        ]);

        try {
            $result = $this->momoPaymentService->initiateOrderPayment(
                $request->only([
                    'product_id', 'quantity_ordered',
                    'delivery_latitude', 'delivery_longitude',
                ]) + ['buyer_id' => $buyerId],
                $buyerId,
                $request->phone
            );

            return response()->json([
                'success' => true,
                'order_id' => $result['order']->id,
                'amount' => $result['momo_transaction']->amount, // 🔧 AJOUT : le montant réel calculé, à afficher au client
                'reference' => $result['momo_transaction']->external_reference,
                'message' => 'Commande créée. Validez le paiement sur votre téléphone.',
            ], 202);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Vérifie le statut d'un paiement de commande en cours (polling)
     * GET api/v1/orders/pay-with-momo/{reference}/status
     */
    public function status(Request $request, string $reference): JsonResponse
    {
        try {
            $momoTransaction = $this->momoPaymentService->confirmOrderPayment($reference);

            return response()->json([
                'success' => true,
                'status' => $momoTransaction->status, // pending | successful | failed
                'order_id' => $momoTransaction->order_id,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}