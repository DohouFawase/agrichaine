<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Order\OrderController;
use App\Http\Controllers\Api\V1\Order\OrderCollectionController;
use App\Http\Controllers\Api\V1\Order\OrderMomoPaymentController;
use App\Http\Controllers\Api\V1\Trip\DriverController;

Route::middleware('auth:api')->group(function () {
    Route::post('/driver/ping', [DriverController::class, 'ping']);

    Route::get('/orders', [OrderController::class, 'index']);

    // 🔧 RETIRÉ : Route::post('/orders', [OrderController::class, 'store']);
    // Cette ligne référençait une méthode supprimée (doublon de
    // BuyerOrderController::store) ET entrait en conflit avec la route
    // identique définie dans routes/v1/buyer.php, qu'elle empêchait
    // d'être jamais atteinte. C'est désormais buyer.php qui gère POST /orders.

    Route::post('/orders/assign', [OrderController::class, 'assignDriver']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    // 🔧 AJOUT : ces routes existaient dans le controller mais n'étaient
    // câblées nulle part — utilisées par MapsScreen (tracking GPS acheteur)
    // et par le transporteur (envoi position + sync batch mode déconnecté).
    Route::get('/orders/{id}/tracking', [OrderController::class, 'getTracking']);
    Route::post('/orders/{id}/tracking', [OrderController::class, 'updateTracking']);
    Route::post('/orders/{id}/tracking/batch', [OrderController::class, 'syncTrackingBatch']);

    // 🔧 AJOUT : routes du flux QR Code (collecte + livraison), jamais câblées
    // nulle part malgré tout le travail effectué sur OrderCollectionService.
    Route::post('/orders/{id}/validate-collection', [OrderCollectionController::class, 'validateCollection']);
    Route::post('/orders/{id}/validate-delivery', [OrderCollectionController::class, 'validateDelivery']);
    Route::post('/orders/{id}/rate-producer', [OrderCollectionController::class, 'rateProducer']);

    // 🔧 AJOUT : paiement direct MoMo à la commande (alternative au wallet)
    Route::post('/orders/pay-with-momo', [OrderMomoPaymentController::class, 'initiate']);
    Route::get('/orders/pay-with-momo/{reference}/status', [OrderMomoPaymentController::class, 'status']);
});