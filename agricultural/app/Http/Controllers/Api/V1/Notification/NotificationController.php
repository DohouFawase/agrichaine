<?php

namespace App\Http\Controllers\Api\V1\Notification;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; // Import du Logger

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $userId = $request->user()->id;
        Log::info("Onabaya-Notification: [SHOW] User #{$userId} cherche la notification ID: {$id}");

        // Utilisation de whereRaw pour sécuriser la recherche par UUID (String)
        $notification = $request->user()
            ->notifications()
            ->whereRaw('id = ?', [(string)$id])
            ->first();

        if (!$notification) {
            Log::error("Onabaya-Notification: [404 NOT FOUND] Notification {$id} introuvable pour l'User #{$userId}");
            return response()->json([
                'success' => false,
                'message' => 'Notification introuvable',
            ], 404);
        }

        if (!$notification->read_at) {
            $notification->markAsRead();
            Log::info("Onabaya-Notification: Notification {$id} marquée comme lue de manière automatique.");
        }

        return response()->json([
            'success' => true,
            'data' => $notification,
        ]);
    }

    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $userId = $request->user()->id;
        Log::info("Onabaya-Notification: [READ] User #{$userId} tente de lire la notification ID: {$id}");

        $notification = $request->user()
            ->notifications()
            ->whereRaw('id = ?', [(string)$id])
            ->first();

        if (!$notification) {
            Log::error("Onabaya-Notification: [404 NOT FOUND] Impossible de lire la notification {$id} pour l'User #{$userId}");
            return response()->json([
                'success' => false,
                'message' => 'Notification introuvable',
            ], 404);
        }

        $notification->markAsRead();
        Log::info("Onabaya-Notification: Notification {$id} lue avec succès par l'User #{$userId}");

        return response()->json([
            'success' => true,
            'message' => 'Notification marquée comme lue',
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $request->user()
            ->unreadNotifications()
            ->update(['read_at' => now()]);

        Log::info("Onabaya-Notification: Toutes les notifications de l'User #{$userId} ont été marquées comme lues.");

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications sont lues',
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $userId = $request->user()->id;
        Log::info("Onabaya-Notification: [DELETE] User #{$userId} tente de supprimer la notification ID: {$id}");

        $notification = $request->user()
            ->notifications()
            ->whereRaw('id = ?', [(string)$id])
            ->first();

        if (!$notification) {
            Log::error("Onabaya-Notification: [404 NOT FOUND] Impossible de supprimer la notification {$id} (User #{$userId})");
            return response()->json([
                'success' => false,
                'message' => 'Notification introuvable',
            ], 404);
        }

        $notification->delete();
        Log::info("Onabaya-Notification: Notification {$id} supprimée avec succès par l'User #{$userId}");

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée',
        ]);
    }

    public function destroyAll(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $request->user()->notifications()->delete();
        
        Log::info("Onabaya-Notification: Toutes les notifications de l'User #{$userId} ont été supprimées.");

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications supprimées',
        ]);
    }
}