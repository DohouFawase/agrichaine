<?php

namespace App\Http\Controllers\Api\V1\Order;

use App\Http\Controllers\Controller;
use App\Services\OrderCollectionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

use Exception;
use  App\Providers\OrderCollectionServiceProvider;


class OrderCollectionController extends Controller
{
    protected $collectionService;

    public function __construct(OrderCollectionService $collectionService)
    {
        $this->collectionService = $collectionService;
    }

    /**
     * Valide la collecte physique par le chauffeur (Scan du QR Code Producteur)
     * POST api/v1/orders/{id}/validate-collection
     */
    public function validateCollection(Request $request, string $id): JsonResponse
    {
        // Seul le chauffeur connecté peut appeler ceci
        $driverId = $request->user()->id;

        $request->validate([
            'scanned_code' => 'required|string', // Le token récupéré du QR Code du producteur
            'quantity_collected' => 'required|integer|min:0', // Le volume que le chauffeur valide avoir chargé
        ]);

        try {
            $order = $this->collectionService->validateCollection(
                $id,
                $driverId,
                $request->scanned_code,
                $request->quantity_collected
            );

            return response()->json([
                'success' => true,
                'status' => $order->status,
                'message' => 'Collecte validée avec succès. Marchandise en route vers Cotonou.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422); // Unprocessable Entity
        }
    }

    /**
     * Permet au chauffeur de noter le producteur après livraison finale
     * POST api/v1/orders/{id}/rate-producer
     */
    public function rateProducer(Request $request, string $id): JsonResponse
    {
        $driverId = $request->user()->id;

        $request->validate([
            'rating' => 'required|integer|min:1|max:5', // Note de 1 à 5
            'comment' => 'nullable|string|max:500',
        ]);

        try {
            $this->collectionService->rateProducer(
                $id,
                $driverId,
                $request->rating,
                $request->comment
            );

            return response()->json([
                'success' => true,
                'message' => 'Merci pour votre notation. Elle aide à sécuriser le réseau vivrier.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
