<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Fidelity\LoyaltyController;


Route::middleware('auth:api')->group(function () {
  // Status & Activation
  Route::get('/loyalty/status/{producerId}', [LoyaltyController::class, 'status']);
  Route::post('/loyalty/recurring-purchases/enable', [LoyaltyController::class, 'enableRecurringPurchases']);
  Route::get('/loyalty/statuses', [LoyaltyController::class, 'allStatuses']); // 🔧 AJOUT
  Route::post('/loyalty/recurring-orders', [LoyaltyController::class, 'scheduleRecurringOrder']);
  Route::get('/loyalty/recurring-orders', [LoyaltyController::class, 'listRecurringOrders']);
  Route::delete('/loyalty/recurring-orders/{id}', [LoyaltyController::class, 'cancelRecurringOrder']);
});
