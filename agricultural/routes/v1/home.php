<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\Trip\TripController;
use App\Http\Controllers\Api\V1\Home\HomeController;


Route::middleware('auth:api')->group(function () {

    // Gestion des Commandes et Logistique
    Route::get('/home', HomeController::class);
});
