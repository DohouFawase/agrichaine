import { createSlice } from '@reduxjs/toolkit';
import {
  fetchLoyaltyStatuses,
  fetchRecurringOrders,
  scheduleRecurringOrder,
  cancelRecurringOrder,
  enableRecurringPurchases,
  LoyaltyStatus,
  RecurringOrder,
} from '@/providers/loyalyty/loyaltyprovideraction';

interface LoyaltyState {
  statuses: LoyaltyStatus[];
  isLoadingStatuses: boolean;
  statusesError: string | null;

  recurringOrders: RecurringOrder[];
  isLoadingRecurringOrders: boolean;
  recurringOrdersError: string | null;

  isActionLoading: boolean;
  actionError: string | null;
  actionSuccessMessage: string | null;
}

const initialState: LoyaltyState = {
  statuses: [],
  isLoadingStatuses: false,
  statusesError: null,

  recurringOrders: [],
  isLoadingRecurringOrders: false,
  recurringOrdersError: null,

  isActionLoading: false,
  actionError: null,
  actionSuccessMessage: null,
};

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    clearLoyaltyActionStrings: (state) => {
      state.actionError = null;
      state.actionSuccessMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Statuts de fidélité ──────────────────────────────────────────
      .addCase(fetchLoyaltyStatuses.pending, (state) => {
        state.isLoadingStatuses = true;
        state.statusesError = null;
      })
      .addCase(fetchLoyaltyStatuses.fulfilled, (state, action) => {
        state.isLoadingStatuses = false;
        state.statuses = action.payload.data;
      })
      .addCase(fetchLoyaltyStatuses.rejected, (state, action) => {
        state.isLoadingStatuses = false;
        state.statusesError = action.payload as string;
      })

      // ── Activation programmation d'achats ────────────────────────────
      .addCase(enableRecurringPurchases.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
        state.actionSuccessMessage = null;
      })
      .addCase(enableRecurringPurchases.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.actionSuccessMessage = action.payload.message;
        // Met à jour localement le statut concerné sans refetch complet
        state.statuses = state.statuses.map((s) =>
          s.recurring_purchases_enabled === false
            ? { ...s, recurring_purchases_enabled: action.payload.data.recurring_purchases_enabled }
            : s
        );
      })
      .addCase(enableRecurringPurchases.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload as string;
      })

      // ── Liste des commandes programmées ──────────────────────────────
      .addCase(fetchRecurringOrders.pending, (state) => {
        state.isLoadingRecurringOrders = true;
        state.recurringOrdersError = null;
      })
      .addCase(fetchRecurringOrders.fulfilled, (state, action) => {
        state.isLoadingRecurringOrders = false;
        state.recurringOrders = action.payload.data;
      })
      .addCase(fetchRecurringOrders.rejected, (state, action) => {
        state.isLoadingRecurringOrders = false;
        state.recurringOrdersError = action.payload as string;
      })

      // ── Programmation d'une nouvelle commande ────────────────────────
      .addCase(scheduleRecurringOrder.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
        state.actionSuccessMessage = null;
      })
      .addCase(scheduleRecurringOrder.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.actionSuccessMessage = action.payload.message;
        state.recurringOrders = [action.payload.data, ...state.recurringOrders];
      })
      .addCase(scheduleRecurringOrder.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload as string;
      })

      // ── Annulation d'une commande programmée ─────────────────────────
      .addCase(cancelRecurringOrder.pending, (state) => {
        state.isActionLoading = true;
        state.actionError = null;
      })
      .addCase(cancelRecurringOrder.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.actionSuccessMessage = action.payload.message;
        // action.meta.arg = l'id passé au thunk
        state.recurringOrders = state.recurringOrders.map((o) =>
          o.id === action.meta.arg ? { ...o, status: 'cancelled' } : o
        );
      })
      .addCase(cancelRecurringOrder.rejected, (state, action) => {
        state.isActionLoading = false;
        state.actionError = action.payload as string;
      });
  },
});

export const { clearLoyaltyActionStrings } = loyaltySlice.actions;
export default loyaltySlice.reducer;