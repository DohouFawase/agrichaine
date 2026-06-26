<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Order\OrderController;
use App\Http\Controllers\Api\V1\Trip\DriverController;


Route::middleware('auth:api')->group(function () {
    Route::post('/driver/ping', [DriverController::class, 'ping']);
    Route::get('/orders', [OrderController::class, 'index']);
    // Gestion des Commandes et Logistique
    Route::post('/orders', [OrderController::class, 'store']);                      // Étape 1 : Acheter (Séquestre)
    Route::post('/orders/assign', [OrderController::class, 'assignDriver']);        // Étape 2 : Chauffeur prend la course
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);  // Étape 3 : Changement d'état (Livré/Collecté)
    Route::get('/orders/{id}', [OrderController::class, 'show']);                  // Détails commande
    
});