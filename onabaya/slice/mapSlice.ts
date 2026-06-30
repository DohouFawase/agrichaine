import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchProductsForMap,
  fetchProductDetail,
  createOrder,
  fetchActiveOrderTracking,
  fetchMyOrders,
  fetchWalletBalance,
  reportDispute,
  ProductLocation,
  ActiveOrderTracking,
} from '@/providers/maps/mapsProviderAction';

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────

interface MapsState {
  // Pins produits sur la carte
  products: ProductLocation[];
  productsLoading: boolean;
  productsError: string | null;

  // Bottom sheet produit sélectionné
  selectedProduct: ProductLocation | null;
  selectedProductLoading: boolean;

  // Commande active en cours de suivi
  activeOrder: ActiveOrderTracking | null;
  activeOrderLoading: boolean;
  activeOrderError: string | null;
  activeOrderId: string | null;    // persisté pour relancer le polling

  // Création commande
  orderCreating: boolean;
  orderCreateError: string | null;

  // Solde portefeuille
  walletBalance: number | null;
  walletCurrency: string;

  // Litige
  disputeLoading: boolean;
  disputeError: string | null;
  disputeSuccess: boolean;
}

const initialState: MapsState = {
  products: [],
  productsLoading: false,
  productsError: null,

  selectedProduct: null,
  selectedProductLoading: false,

  activeOrder: null,
  activeOrderLoading: false,
  activeOrderError: null,
  activeOrderId: null,

  orderCreating: false,
  orderCreateError: null,

  walletBalance: null,
  walletCurrency: 'FCFA',

  disputeLoading: false,
  disputeError: null,
  disputeSuccess: false,
};

// ─────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────

const mapsSlice = createSlice({
  name: 'maps',
  initialState,
  reducers: {
    selectProduct(state, action: PayloadAction<ProductLocation | null>) {
      state.selectedProduct = action.payload;
    },
    setActiveOrderId(state, action: PayloadAction<string | null>) {
      state.activeOrderId = action.payload;
    },
    clearOrderError(state) {
      state.orderCreateError = null;
    },
    clearDisputeState(state) {
      state.disputeError = null;
      state.disputeSuccess = false;
    },
    // Met à jour uniquement les coordonnées du chauffeur sans recharger tout
    updateDriverCoords(
      state,
      action: PayloadAction<{ latitude: number; longitude: number }>
    ) {
      if (state.activeOrder?.driver) {
        state.activeOrder.driver.latitude = action.payload.latitude;
        state.activeOrder.driver.longitude = action.payload.longitude;
      }
    },
  },
  extraReducers: (builder) => {

    // ── Produits ──
    builder
      .addCase(fetchProductsForMap.pending, (state) => {
        state.productsLoading = true;
        state.productsError = null;
      })
      .addCase(fetchProductsForMap.fulfilled, (state, action) => {
        state.productsLoading = false;
        state.products = action.payload;
      })
      .addCase(fetchProductsForMap.rejected, (state, action) => {
        state.productsLoading = false;
        state.productsError = action.payload ?? 'Erreur inconnue';
      });

    // ── Détail produit ──
    builder
      .addCase(fetchProductDetail.pending, (state) => {
        state.selectedProductLoading = true;
      })
      .addCase(fetchProductDetail.fulfilled, (state, action) => {
        state.selectedProductLoading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductDetail.rejected, (state) => {
        state.selectedProductLoading = false;
      });

    // ── Créer commande ──
    builder
      .addCase(createOrder.pending, (state) => {
        state.orderCreating = true;
        state.orderCreateError = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orderCreating = false;
        state.activeOrderId = action.payload.order_id;
        state.selectedProduct = null; // ferme le bottom sheet
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.orderCreating = false;
        state.orderCreateError = action.payload ?? 'Erreur inconnue';
      });

    // ── Suivi commande active ──
    builder
      .addCase(fetchActiveOrderTracking.pending, (state) => {
        state.activeOrderLoading = true;
        state.activeOrderError = null;
      })
      .addCase(fetchActiveOrderTracking.fulfilled, (state, action) => {
        state.activeOrderLoading = false;
        state.activeOrder = action.payload;
      })
      .addCase(fetchActiveOrderTracking.rejected, (state, action) => {
        state.activeOrderLoading = false;
        state.activeOrderError = action.payload ?? 'Erreur inconnue';
      });

    // ── Mes commandes ──
    builder.addCase(fetchMyOrders.fulfilled, (state, action) => {
      const active = action.payload.find(
        (o) => !['delivered', 'disputed'].includes(o.status)
      );
      if (active) {
        state.activeOrderId = active.id;
        state.activeOrder = active;
      }
    });

    // ── Solde ──
    builder.addCase(fetchWalletBalance.fulfilled, (state, action) => {
      state.walletBalance = action.payload.balance;
      state.walletCurrency = action.payload.currency;
    });

    // ── Litige ──
    builder
      .addCase(reportDispute.pending, (state) => {
        state.disputeLoading = true;
        state.disputeError = null;
        state.disputeSuccess = false;
      })
      .addCase(reportDispute.fulfilled, (state) => {
        state.disputeLoading = false;
        state.disputeSuccess = true;
      })
      .addCase(reportDispute.rejected, (state, action) => {
        state.disputeLoading = false;
        state.disputeError = action.payload ?? 'Erreur inconnue';
      });
  },
});

export const {
  selectProduct,
  setActiveOrderId,
  clearOrderError,
  clearDisputeState,
  updateDriverCoords,
} = mapsSlice.actions;

export default mapsSlice.reducer;