<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\Trip\TripController;


Route::middleware('auth:api')->group(function () {

    // Gestion des Commandes et Logistique
    Route::get('/trips', [TripController::class, 'index']);
    Route::post('/trips', [TripController::class, 'store']);
});
