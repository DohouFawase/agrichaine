import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/stores';
import {
    AppNotification,
    fetchNotifications,
    fetchUnreadCount,
    fetchNotificationDetail,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '@/providers/notification/notificationsProvideraction';

interface NotificationsState {
    items: AppNotification[];
    currentPage: number;
    lastPage: number;
    total: number;
    unreadCount: number;
    selectedNotification: AppNotification | null;
    isLoading: boolean;
    isDetailLoading: boolean;
    error: string | null;
}

const initialState: NotificationsState = {
    items: [],
    currentPage: 1,
    lastPage: 1,
    total: 0,
    unreadCount: 0,
    selectedNotification: null,
    isLoading: false,
    isDetailLoading: false,
    error: null,
};

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        resetNotificationsState(state) {
            state.error = null;
            state.selectedNotification = null;
        },

        // ✅ Appelée depuis l'écoute WebSocket (Reverb) quand un événement
        // .product.created arrive en temps réel — ajoute la notif en tête
        // de liste et incrémente immédiatement le badge, sans attendre
        // un nouvel appel API.
        addRealtimeNotification(state, action: PayloadAction<AppNotification>) {
            state.items.unshift(action.payload);
            state.unreadCount += 1;
            state.total += 1;
        },
    },
    extraReducers: (builder) => {
        builder
            // ── fetchNotifications ──────────────────────────────
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.isLoading = false;
                const { data, current_page, last_page, total } = action.payload;
                state.items = current_page === 1 ? data : [...state.items, ...data];
                state.currentPage = current_page;
                state.lastPage = last_page;
                state.total = total;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // ── fetchUnreadCount ─────────────────────────────────
            .addCase(fetchUnreadCount.fulfilled, (state, action) => {
                state.unreadCount = action.payload;
            })

            // ── fetchNotificationDetail ──────────────────────────
            .addCase(fetchNotificationDetail.pending, (state) => {
                state.isDetailLoading = true;
                state.error = null;
            })
            .addCase(fetchNotificationDetail.fulfilled, (state, action) => {
                state.isDetailLoading = false;
                state.selectedNotification = action.payload;

                // Si elle était non lue, on la marque comme lue localement
                // (le backend l'a déjà fait au passage de la requête GET)
                const idx = state.items.findIndex((n) => n.id === action.payload.id);
                if (idx !== -1 && state.items[idx].read_at === null) {
                    state.items[idx].read_at = action.payload.read_at;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            .addCase(fetchNotificationDetail.rejected, (state, action) => {
                state.isDetailLoading = false;
                state.error = action.payload as string;
            })

            // ── markNotificationAsRead ───────────────────────────
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const id = action.payload;
                const idx = state.items.findIndex((n) => n.id === id);
                if (idx !== -1 && state.items[idx].read_at === null) {
                    state.items[idx].read_at = new Date().toISOString();
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })

            // ── markAllNotificationsAsRead ────────────────────────
            .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
                state.items = state.items.map((n) => ({
                    ...n,
                    read_at: n.read_at ?? new Date().toISOString(),
                }));
                state.unreadCount = 0;
            });
    },
});

export const { resetNotificationsState, addRealtimeNotification } = notificationsSlice.actions;

// ─────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────
export const selectNotifications = (state: RootState) => state.notifications.items;
export const selectNotificationsUnreadCount = (state: RootState) => state.notifications.unreadCount;
export const selectNotificationsLoading = (state: RootState) => state.notifications.isLoading;
export const selectNotificationsError = (state: RootState) => state.notifications.error;
export const selectSelectedNotification = (state: RootState) => state.notifications.selectedNotification;
export const selectNotificationDetailLoading = (state: RootState) => state.notifications.isDetailLoading;
export const selectNotificationsHasMore = (state: RootState) =>
    state.notifications.currentPage < state.notifications.lastPage;

export default notificationsSlice.reducer;