<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Product\ProductController;
use App\Http\Controllers\Api\V1\Product\CategoryController;
use App\Http\Controllers\Api\V1\Order\OrderCollectionController;

Route::middleware('auth:api')->group(function () {

    Route::get('/categories', [CategoryController::class, 'index']);

    // 1. Gestion des Produits
    // Cette route liste les produits du vendeur (s'il est producteur) OU le catalogue (s'il est acheteur)
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);

    // Route alternative si tu souhaites séparer explicitement l'espace vendeur
    Route::get('/producer/products', [ProductController::class, 'producerProducts']);
    Route::get('/favorites', [ProductController::class, 'favorites']);
    Route::delete('/products', [ProductController::class, 'destroyAll']);

    // Détails d'un produit (En bas pour ne pas bloquer le reste)
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::match(['put', 'patch'], '/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/{id}/restore', [ProductController::class, 'restore']);
    Route::post('/products/{id}/favorite', [ProductController::class, 'favorite']);
    Route::delete('/products/{id}/favorite', [ProductController::class, 'unfavorite']);
    Route::post('/products/{id}/reviews', [ProductController::class, 'review']);

    // 2. Commandes & Logistique
    Route::post('/orders/{id}/validate-collection', [OrderCollectionController::class, 'validateCollection']);
    // QR du transporteur pour valider la livraison finale
    Route::post('/orders/{id}/validate-delivery', [OrderCollectionController::class, 'validateDelivery']);

    Route::post('/orders/{id}/rate-producer', [OrderCollectionController::class, 'rateProducer']);
});
