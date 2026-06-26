<?php

namespace App\Http\Controllers\Api\V1\Trip;

use App\Http\Controllers\Controller;
use App\Http\Requests\Trip\StoreTripRequest;
use App\Http\Resources\TripResource;
use App\Repositories\Contracts\TripRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class TripController extends Controller
{
    protected $tripRepository;

    public function __construct(TripRepositoryInterface $tripRepository)
    {
        $this->tripRepository = $tripRepository;
    }

    /**
     * Liste des trajets enregistrés par le chauffeur connecté
     */
    public function index(): JsonResponse
    {
        $transporterId = Auth::guard('api')->id();
        $trips = $this->tripRepository->getByTransporter($transporterId);

        return response()->json([
            'success' => true,
            'data' => TripResource::collection($trips)
        ]);
    }

    /**
     * Enregistrer un nouveau trajet de retour à vide
     */
    public function store(StoreTripRequest $request): JsonResponse
    {
        $data = array_merge($request->validated(), [
            'transporter_id' => Auth::guard('api')->id()
        ]);

        $trip = $this->tripRepository->create($data);

        return response()->json([
            'success' => true,
            'message' => 'Trajet de retour enregistré avec succès.',
            'data' => new TripResource($trip)
        ], 201);
    }
}