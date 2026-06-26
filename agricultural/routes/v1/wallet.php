<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\V1\Wallet\WalletController;


Route::middleware('auth:api')->group(function () {
    Route::get('/balance', [WalletController::class, 'getWalletSummary']);
    Route::post('/deposit', [WalletController::class, 'deposit']);
});
