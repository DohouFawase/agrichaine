import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/stores';
import {
    AppNotification,
    fetchNotifications,
    fetchUnreadCount,
    fetchNotificationDetail,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotifications, // ⚠️ à ajouter dans notificationsProvideraction.ts (voir snippet fourni séparément)
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
    isDeleting: boolean;
    error: string | null;

    // ✅ Mode sélection multiple (écran NotificationListScreen)
    selectionMode: boolean;
    selectedIds: string[];
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
    isDeleting: false,
    error: null,
    selectionMode: false,
    selectedIds: [],
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
        // de liste ET incrémente le badge de façon optimiste, SANS refaire
        // d'appel réseau. Le backend reste la source de vérité au prochain
        // fetchUnreadCount() normal (ex: à l'ouverture du dropdown).
        addRealtimeNotification(state, action: PayloadAction<AppNotification>) {
            // Évite les doublons si jamais l'event arrive deux fois
            const alreadyExists = state.items.some((n) => n.id === action.payload.id);
            if (alreadyExists) return;

            state.items.unshift(action.payload);
            state.total += 1;

            // Le badge ne compte QUE les non-lues, donc on incrémente
            // uniquement si la notif reçue est effectivement non lue.
            if (action.payload.read_at === null) {
                state.unreadCount += 1;
            }
        },

        // ✅ Entre en mode sélection (déclenché par un appui long sur une
        // notif). Si un id est fourni, cette notif est pré-sélectionnée.
        enterSelectionMode(state, action: PayloadAction<string | undefined>) {
            state.selectionMode = true;
            if (action.payload && !state.selectedIds.includes(action.payload)) {
                state.selectedIds.push(action.payload);
            }
        },

        // ✅ Quitte le mode sélection et vide la sélection (bouton "Annuler")
        exitSelectionMode(state) {
            state.selectionMode = false;
            state.selectedIds = [];
        },

        // ✅ Coche/décoche une notif quand on est en mode sélection
        toggleSelectNotification(state, action: PayloadAction<string>) {
            const id = action.payload;
            const idx = state.selectedIds.indexOf(id);
            if (idx === -1) {
                state.selectedIds.push(id);
            } else {
                state.selectedIds.splice(idx, 1);
            }
        },

        // ✅ "Tout sélectionner" — ne sélectionne que les notifs déjà
        // chargées en mémoire (la pagination n'a pas forcément tout
        // récupéré depuis le backend).
        selectAllNotifications(state) {
            state.selectedIds = state.items.map((n) => n.id);
        },

        // ✅ Désélectionne tout sans quitter le mode sélection
        deselectAllNotifications(state) {
            state.selectedIds = [];
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
            // Reste la source de vérité "officielle" (appelée au chargement
            // de l'écran et à l'ouverture du dropdown), donc elle écrase
            // toujours l'estimation optimiste faite par addRealtimeNotification.
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
            })

            // ── deleteNotifications ───────────────────────────────
            .addCase(deleteNotifications.pending, (state) => {
                state.isDeleting = true;
                state.error = null;
            })
            .addCase(deleteNotifications.fulfilled, (state, action) => {
                state.isDeleting = false;
                const deletedIds = action.payload; // string[]

                // Combien parmi les supprimées étaient non lues, pour
                // corriger le badge correctement.
                const unreadDeletedCount = state.items.filter(
                    (n) => deletedIds.includes(n.id) && n.read_at === null
                ).length;

                state.items = state.items.filter((n) => !deletedIds.includes(n.id));
                state.total = Math.max(0, state.total - deletedIds.length);
                state.unreadCount = Math.max(0, state.unreadCount - unreadDeletedCount);
                state.selectedIds = state.selectedIds.filter((id) => !deletedIds.includes(id));

                // Si plus rien n'est sélectionné, on sort automatiquement
                // du mode sélection.
                if (state.selectedIds.length === 0) {
                    state.selectionMode = false;
                }
            })
            .addCase(deleteNotifications.rejected, (state, action) => {
                state.isDeleting = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    resetNotificationsState,
    addRealtimeNotification,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelectNotification,
    selectAllNotifications,
    deselectAllNotifications,
} = notificationsSlice.actions;

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
export const selectNotificationsCurrentPage = (state: RootState) => state.notifications.currentPage;

// ✅ Nouveau selector : nombre réel de non-lues dans la liste actuellement
// chargée en mémoire (utile pour debug / cohérence UI si besoin).
export const selectUnreadInLoadedItems = (state: RootState) =>
    state.notifications.items.filter((n) => n.read_at === null).length;

// ✅ Selectors du mode sélection multiple
export const selectSelectionMode = (state: RootState) => state.notifications.selectionMode;
export const selectSelectedIds = (state: RootState) => state.notifications.selectedIds;
export const selectIsDeleting = (state: RootState) => state.notifications.isDeleting;

export default notificationsSlice.reducer;