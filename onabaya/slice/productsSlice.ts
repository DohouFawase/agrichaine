// productsSlice.ts - Ajouter addProduct dans les reducers

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  storeProductAction,
  fetchProducts,
  fetchProductDetails,
  ProductResource,
} from "@/providers/producers/producersProviderAction";

interface ProductState {
  products: ProductResource[];
  currentProduct: ProductResource | null;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  views: Record<string, number>;
}

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  isLoading: false,
  isSuccess: false,
  error: null,
  views: {},
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    resetProductState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.error = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    incrementView: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.views[id] = (state.views[id] ?? 0) + 1;
    },

    // ✅ Nouveau : injecte un produit reçu via WebSocket (Reverb)
    addProduct: (state, action: PayloadAction<ProductResource>) => {
      const exists = state.products.some((p) => p.id === action.payload.id);
      if (!exists) {
        state.products.unshift(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchProductDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(storeProductAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isSuccess = false;
      })
      .addCase(storeProductAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.error = null;
        if (action.payload?.data) {
          // ✅ Évite le doublon si addProduct (WebSocket) a déjà inséré ce produit
          const exists = state.products.some(
            (p) => p.id === action.payload.data.id,
          );
          if (!exists) {
            state.products.unshift(action.payload.data);
          }
          state.currentProduct = action.payload.data;
        }
      })
      .addCase(storeProductAction.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  resetProductState,
  clearCurrentProduct,
  incrementView,
  addProduct,
} = productsSlice.actions;
export default productsSlice.reducer;
