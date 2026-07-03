import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axiosConfig';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface NotificationProducer {
    id: number;
    name: string;
}

export interface NotificationData {
    type: string;
    title: string;
    message: string;
    product_id: number;
    quantity: number;
    price: number;
    stock_proof_photo_path: string | null;
    producer: NotificationProducer;
    product_created_at: string;
}

export interface AppNotification {
    id: string; // uuid
    type: string;
    price_per_unit: number | null;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

interface PaginatedNotifications {
    current_page: number;
    last_page: number;
    total: number;
    data: AppNotification[];
}

// ─────────────────────────────────────────────
// GET /v1/notifications — liste paginée (le "recap")
// ─────────────────────────────────────────────
export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (page: number = 1, { rejectWithValue }) => {
        try {
            const response = await api.get(`/notifications?page=${page}`);
            console.log('🟢 Notifications reçues via API :', response.data);
            return response.data.data as PaginatedNotifications;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ?? 'Impossible de charger les notifications.'
            );
        }
    }
);

// ─────────────────────────────────────────────
// GET /v1/notifications/unread-count — pour le badge de la cloche
// ─────────────────────────────────────────────
export const fetchUnreadCount = createAsyncThunk(
    'notifications/fetchUnreadCount',
    async (_: void, { rejectWithValue }) => {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data.unread_count as number;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ?? "Impossible de récupérer le compteur."
            );
        }
    }
);

// ─────────────────────────────────────────────
// GET /v1/notifications/{id} — détail (marque comme lue côté backend)
// ─────────────────────────────────────────────
export const fetchNotificationDetail = createAsyncThunk(
    'notifications/fetchNotificationDetail',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/notifications/${id}`);
            return response.data.data as AppNotification;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ?? 'Impossible de charger cette notification.'
            );
        }
    }
);

// ─────────────────────────────────────────────
// PATCH /v1/notifications/{id}/read — marquer une notification comme lue
// ─────────────────────────────────────────────
export const markNotificationAsRead = createAsyncThunk(
    'notifications/markNotificationAsRead',
    async (id: string, { rejectWithValue }) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            return id;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ?? 'Impossible de marquer comme lue.'
            );
        }
    }
);

// ─────────────────────────────────────────────
// PATCH /v1/notifications/read-all — tout marquer comme lu
// ─────────────────────────────────────────────
export const markAllNotificationsAsRead = createAsyncThunk(
    'notifications/markAllNotificationsAsRead',
    async (_: void, { rejectWithValue }) => {
        try {
            await api.patch('/notifications/read-all');
            return true;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ?? 'Impossible de tout marquer comme lu.'
            );
        }
    }
);

// ─────────────────────────────────────────────
// DELETE /v1/notifications/{id} — supprimer une seule notification
// DELETE /v1/notifications — supprimer plusieurs notifications (body: { ids })
//
// ⚠️ Hypothèse : ces deux routes n'existaient pas encore dans le fichier
// d'origine. Si ton backend Laravel expose une route différente (nom,
// méthode HTTP, format du body), dis-le moi et j'ajuste — le reste du
// code (slice, écran) n'a besoin d'aucun changement tant que ce thunk
// renvoie bien la liste des ids supprimés.
// ─────────────────────────────────────────────
export const deleteNotifications = createAsyncThunk(
    'notifications/deleteNotifications',
    async (ids: string[], { rejectWithValue }) => {
        try {
            if (ids.length === 1) {
                await api.delete(`/notifications/${ids[0]}`);
            } else {
                await api.delete('/notifications', { data: { ids } });
            }
            return ids;
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message ?? 'Impossible de supprimer la notification.'
            );
        }
    }
);