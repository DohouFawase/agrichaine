import { createSlice } from '@reduxjs/toolkit';
import { 
  StoreProductAction, 
  fetchProducts, 
  fetchProductDetails, 
  ProductResource 
} from '@/providers/producers/producersProviderAction'; // Ajuste le chemin d'import si nécessaire

// 1. Définition de l'interface pour l'état des produits avec des types précis
interface ProductState {
  products: ProductResource[];          // Liste typée des produits pour le catalogue
  currentProduct: ProductResource | null; // Détails du produit sélectionné
  isLoading: boolean;                   // État de chargement global pour les listes/détails
  isSuccess: boolean;                   // Vrai quand une récolte est publiée avec succès
  error: string | null;                 // Message d'erreur
}

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  isLoading: false,
  isSuccess: false,
  error: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    resetProductState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.error = null;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // =========================================================
      // --- 1. CHARGEMENT DE TOUS LES PRODUITS (fetchProducts) ---
      // =========================================================
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload; // action.payload contient directement ProductResource[]
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // ==============================================================
      // --- 2. DETAILS D'UN PRODUIT SPECIFIQUE (fetchProductDetails) -
      // ==============================================================
      .addCase(fetchProductDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload; // action.payload contient l'objet ProductResource
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // =========================================================
      // --- 3. PUBLICATION D'UNE RÉCOLTE (StoreProductAction) ---
      // =========================================================
      .addCase(StoreProductAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isSuccess = false;
      })
      .addCase(StoreProductAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.error = null;
        
        // On ajoute le nouveau produit au début du catalogue local pour un affichage instantané
        if (action.payload?.data) {
          state.products.unshift(action.payload.data);
          state.currentProduct = action.payload.data;
        }
      })
      .addCase(StoreProductAction.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.error = action.payload as string;
      });
  },
});

// Export des actions synchrones
export const { resetProductState, clearCurrentProduct } = productsSlice.actions;

// Export du reducer principal
export default productsSlice.reducer;