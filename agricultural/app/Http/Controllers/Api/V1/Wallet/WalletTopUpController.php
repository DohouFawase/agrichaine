<?php

namespace App\Http\Controllers\Api\V1\Wallet;

use App\Http\Controllers\Controller;
use App\Services\MomoPaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class WalletTopUpController extends Controller
{
    //

    protected MomoPaymentService $momoPaymentService;
 
    public function __construct(MomoPaymentService $momoPaymentService)
    {
        $this->momoPaymentService = $momoPaymentService;
    }
 
    /**
     * Initie une recharge de wallet via MTN MoMo
     * POST api/v1/wallet/topup
     */
    public function initiate(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
 
        $request->validate([
            'phone'  => 'required|string',
            'amount' => 'required|integer|min:100', // seuil minimum arbitraire, à ajuster
        ]);
 
        try {
            $momoTransaction = $this->momoPaymentService->initiateTopUp(
                $userId,
                $request->phone,
                $request->amount
            );
 
            return response()->json([
                'success' => true,
                'reference' => $momoTransaction->external_reference,
                'message' => 'Demande de paiement envoyée. Validez sur votre téléphone.',
            ], 202);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
 
    /**
     * Vérifie le statut d'une recharge en cours (à appeler en polling par le frontend)
     * GET api/v1/wallet/topup/{reference}/status
     */
    public function status(Request $request, string $reference): JsonResponse
    {
        try {
            $momoTransaction = $this->momoPaymentService->confirmTopUp($reference);
 
            return response()->json([
                'success' => true,
                'status' => $momoTransaction->status, // pending | successful | failed
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

}
