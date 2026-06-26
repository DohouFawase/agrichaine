<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Order\BuyerOrderController;


Route::middleware('auth:api')->group(function () {
    Route::post('/orders', [BuyerOrderController::class, 'store']);
    Route::post('/orders/{id}/dispute', [BuyerOrderController::class, 'dispute']);
});