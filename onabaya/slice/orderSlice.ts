import { createSlice } from "@reduxjs/toolkit";
import {
  fetchOrdersAction,
  fetchOrderDetails,
  validateOrderCollection,
  OrderResource,
  createOrder,
} from "@/providers/orders/ordersProviderAction";
import { UserRole } from "@/types/users/userType";

interface OrderState {
  orders: OrderResource[];
  userRole: UserRole | null;
  currentOrder: OrderResource | null;
  isLoading: boolean;
  isActionLoading: boolean; // Pour le bouton de validation QR ou autre action
  error: string | null;
  successMessage: string | null;
  lastCreatedOrderId: string | null; //
}

const initialState: OrderState = {
  orders: [],
  userRole: null,
  currentOrder: null,
  isLoading: false,
  isActionLoading: false,
  lastCreatedOrderId: null,
  error: null,
  successMessage: null,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearOrderStrings: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    resetOrdersStore: () => initialState, // 🧹 À appeler lors d'un logout
  },
  extraReducers: (builder) => {
    builder
      // ==========================================
      // 📊 1. LISTE DES COMMANDES (Selon le rôle)
      // ==========================================
      .addCase(fetchOrdersAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrdersAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data; // Stocke le tableau de commandes
        state.userRole = action.payload.user_role; // Stocke le rôle de l'utilisateur connecté
      })
      .addCase(fetchOrdersAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ==========================================
      // 📦 2. DÉTAILS D'UNE COMMANDE
      // ==========================================
      .addCase(fetchOrderDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ==========================================
      // 🖨️ 3. VALIDATION DE LA COLLECTE (QR Code)
      // ==========================================
      .addCase(validateOrderCollection.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(validateOrderCollection.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.successMessage = action.payload.message;

        // Met à jour le statut dans le détail si c'est la commande actuellement ouverte
        if (state.currentOrder) {
          state.currentOrder.status = action.payload.status;
        }

        // Met également à jour le statut dans la liste globale automatiquement
        state.orders = state.orders.map((order) =>
          order.id === state.currentOrder?.id
            ? { ...order, status: action.payload.status }
            : order,
        );
      })
      .addCase(validateOrderCollection.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload as string;
      })

      .addCase(createOrder.pending, (state) => {
        state.isActionLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isActionLoading = false;
        state.successMessage = action.payload.message;
        state.lastCreatedOrderId = action.payload.order_id;
        state.currentOrder = action.payload.data;
        // ajoute la nouvelle commande en tête de liste
        state.orders = [action.payload.data, ...state.orders];
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isActionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearOrderStrings, clearCurrentOrder, resetOrdersStore } =
  orderSlice.actions;
export default orderSlice.reducer;
