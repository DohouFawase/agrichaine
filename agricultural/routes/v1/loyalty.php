<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Fidelity\LoyaltyController;


Route::middleware('auth:api')->group(function () {
  // Status & Activation
    Route::get('/status/{producerId}', [LoyaltyController::class, 'status']);
    Route::post('/recurring-purchases/enable', [LoyaltyController::class, 'enableRecurringPurchases']);

    Route::prefix('recurring-orders')->group(function () {
        Route::get('/', [LoyaltyController::class, 'listRecurringOrders']);
        Route::post('/', [LoyaltyController::class, 'scheduleRecurringOrder']);
        Route::delete('/{id}', [LoyaltyController::class, 'cancelRecurringOrder']);
    });
});