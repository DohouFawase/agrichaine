import { createSlice } from "@reduxjs/toolkit";
import { FetchWalletAction } from "@/providers/users/walletProviderAction";

// 📝 Typage d'une commande en séquestre (Maquette Wallet.png)
interface EscrowOrder {
  order_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  status_label: string;
  display_amount: number;
}

// 📝 Typage de l'objet global séquestre
interface EscrowState {
  total_amount: number;
  active_orders: EscrowOrder[];
}

// 📝 Typage d'une transaction financière de l'historique
interface WalletTransaction {
  id: string;
  title: string;
  amount: number;
  display_type: "credit" | "debit" | "pending";
  reference: string;
  description: string;
  created_at: string;
}

interface WalletState {
  balance: number;
  currency: string;
  userRole: string | null;
  escrow: EscrowState;
  recent_transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: 0,
  currency: "XOF",
  userRole: null,
  escrow: {
    total_amount: 0,
    active_orders: [],
  },
  recent_transactions: [],
  isLoading: false,
  error: null,
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    resetWalletStore: () => initialState, // 🧹 Pratique lors d'un logout
  },
  extraReducers: (builder) => {
    builder
      .addCase(FetchWalletAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(FetchWalletAction.fulfilled, (state, action) => {
        state.isLoading = false;

        const payloadData = (action.payload as any)?.data;

        if (payloadData) {
          state.balance = payloadData.balance ?? 0;
          state.currency = payloadData.currency ?? "XOF";
          state.userRole = payloadData.user_role ?? null;

          // 🎯 CORRECTION : Remplacement des "=" par des ":" ici 👇
          state.escrow = {
            total_amount: payloadData.escrow?.total_amount ?? 0,
            active_orders: payloadData.escrow?.active_orders ?? [],
          };

          state.recent_transactions = payloadData.recent_transactions ?? [];
        } else if (action.payload) {
          state.balance = (action.payload as any).balance ?? 0;
          state.currency = (action.payload as any).currency ?? "XOF";
        }
      })
      .addCase(FetchWalletAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as string) ??
          "Une erreur est survenue lors du chargement du portefeuille.";
      });
  },
});

export const { resetWalletStore } = walletSlice.actions;
export default walletSlice.reducer;
