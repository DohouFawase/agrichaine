<?php

namespace App\Http\Controllers\Api\V1\Notification;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /api/v1/notifications
     * Liste paginée des notifications de l'utilisateur connecté (le "recap").
     */
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

    /**
     * GET /api/v1/notifications/unread-count
     * Nombre de notifications non lues (pour le badge de la cloche).
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * GET /api/v1/notifications/{id}
     * Détail d'une notification — la marque automatiquement comme lue.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);

        if (is_null($notification->read_at)) {
            $notification->markAsRead();
        }

        return response()->json([
            'success' => true,
            'data' => $notification,
        ]);
    }

    /**
     * PATCH /api/v1/notifications/{id}/read
     * Marque une notification précise comme lue (sans forcément l'ouvrir en détail).
     */


    /**
     * PATCH /api/v1/notifications/read-all
     * Marque toutes les notifications comme lues (ex: quand on ouvre la liste).
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications ont été marquées comme lues.',
        ]);
    }

    /**
     * DELETE /api/v1/notifications/{id}
     * Supprime une notification précise du buyer connecté.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification supprimée.',
        ]);
    }

    /**
     * DELETE /api/v1/notifications
     * Supprime TOUTES les notifications du buyer connecté.
     */
    public function destroyAll(Request $request): JsonResponse
    {
        $request->user()->notifications()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Toutes les notifications ont été supprimées.',
        ]);
    }
}
