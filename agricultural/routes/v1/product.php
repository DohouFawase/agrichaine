<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Product\ProductController;
use App\Http\Controllers\Api\V1\Order\OrderCollectionController;



Route::middleware('auth:api')->group(function () {
  
    // Gestion des Produits
    Route::get('/products', [ProductController::class, 'index']);     
    Route::post('/products', [ProductController::class, 'store']);     
    Route::get('/products/{id}', [ProductController::class, 'show']);  

    Route::post('/orders/{id}/validate-collection', [OrderCollectionController::class, 'validateCollection']);

    // 3. Routes de Réputation (Chauffeur après livraison à Cotonou)
    // POST api/v1/orders/{id}/rate-producer
    Route::post('/orders/{id}/rate-producer', [OrderCollectionController::class, 'rateProducer']);

});