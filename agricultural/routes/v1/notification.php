<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Notification\NotificationController;

Route::prefix('notifications')->middleware('auth:api')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
    Route::get('/products', [NotificationController::class, 'productsList']);
    Route::patch('/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::get('/{id}', [NotificationController::class, 'show']);
    Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/', [NotificationController::class, 'destroyAll']);
});