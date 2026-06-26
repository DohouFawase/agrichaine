<?php

namespace App\Http\Controllers\Api\V1\Trip;

use App\Http\Controllers\Controller;
use App\Models\DriverProfile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class DriverController extends Controller
{
    /**
     *📡 PING CHAUFFEUR : Mise en ligne ou actualisation GPS globale
     */
    public function ping(Request $request): JsonResponse
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'status' => 'required|in:available,busy,offline'
        ]);

        $userId = Auth::guard('api')->id();

        // Met à jour ou crée le profil radar du chauffeur
        $profile = DriverProfile::updateOrCreate(
            ['user_id' => $userId],
            [
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'status' => $request->status,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Radar mis à jour (Statut: ' . $request->status . ').',
            'data' => [
                'driver_id' => $profile->user_id,
                'current_coordinates' => [
                    'latitude' => (float) $profile->latitude,
                    'longitude' => (float) $profile->longitude,
                ],
                'updated_at' => $profile->updated_at
            ]
        ]);
    }
}