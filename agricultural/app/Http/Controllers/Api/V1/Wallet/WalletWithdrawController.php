<?php

namespace App\Http\Controllers\Api\V1\Wallet;

use App\Http\Controllers\Controller;
use App\Services\MomoPaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Exception;

class WalletWithdrawController extends Controller
{
    protected MomoPaymentService $momoPaymentService;

    public function __construct(MomoPaymentService $momoPaymentService)
    {
        $this->momoPaymentService = $momoPaymentService;
    }

    /**
     * Initie un retrait du wallet vers Mobile Money
     * POST api/v1/wallet/withdraw
     */
    public function initiate(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $request->validate([
            'phone'  => 'required|string',
            'amount' => 'required|integer|min:500', // seuil minimum arbitraire, à ajuster
        ]);

        try {
            $momoTransaction = $this->momoPaymentService->initiateWithdrawal(
                $userId,
                $request->phone,
                $request->amount
            );

            return response()->json([
                'success' => true,
                'reference' => $momoTransaction->external_reference,
                'environment' => config('services.mtn_momo.env', 'sandbox'),
                'message' => 'Retrait initié. Traitement en cours.',
            ], 202);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Vérifie le statut d'un retrait en cours (polling)
     * GET api/v1/wallet/withdraw/{reference}/status
     */
    public function status(Request $request, string $reference): JsonResponse
    {
        try {
            $momoTransaction = $this->momoPaymentService->confirmWithdrawal($reference);

            return response()->json([
                'success' => true,
                'status' => $momoTransaction->status, // pending | successful | failed
            ]);
        } catch (Exception $e) {
            Log::error('[Wallet Withdraw] Échec de confirmation', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}