<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Product\ProductController;
use App\Http\Controllers\Api\V1\Order\OrderCollectionController;

Route::middleware('auth:api')->group(function () {

    // 1. Gestion des Produits
    // Cette route liste les produits du vendeur (s'il est producteur) OU le catalogue (s'il est acheteur)
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);

    // Route alternative si tu souhaites séparer explicitement l'espace vendeur
    Route::get('/producer/products', [ProductController::class, 'producerProducts']);

    // Détails d'un produit (En bas pour ne pas bloquer le reste)
    Route::get('/products/{id}', [ProductController::class, 'show']);

    // 2. Commandes & Logistique
    Route::post('/orders/{id}/validate-collection', [OrderCollectionController::class, 'validateCollection']);
    // QR du transporteur pour valider la livraison finale
    Route::post('/orders/{id}/validate-delivery', [OrderCollectionController::class, 'validateDelivery']);

    Route::post('/orders/{id}/rate-producer', [OrderCollectionController::class, 'rateProducer']);
});
