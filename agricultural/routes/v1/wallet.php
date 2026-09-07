<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\Wallet\WalletController;
use App\Http\Controllers\Api\V1\Wallet\WalletTopUpController;
use App\Http\Controllers\Api\V1\Wallet\WalletWithdrawController;

Route::middleware('auth:api')->group(function () {
    Route::get('/balance', [WalletController::class, 'getWalletSummary']);

    Route::middleware('throttle:momo')->group(function () {
        Route::post('/wallet/topup', [WalletTopUpController::class, 'initiate']);
        Route::get('/wallet/topup/{reference}/status', [WalletTopUpController::class, 'status']);

        Route::post('/wallet/withdraw', [WalletWithdrawController::class, 'initiate']);
        Route::get('/wallet/withdraw/{reference}/status', [WalletWithdrawController::class, 'status']);
    });

});
