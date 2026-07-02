import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { fetchHome } from '@/providers/users/homeProviderAction';
import type {
  BuyerHomeData,
  ProducerHomeData,
  TransporterHomeData,
  HomeResponse,
} from '@/types/home/homeType';
import type { RootState } from '@/stores/index';


// ─── State ───────────────────────────────────────────────────────────────────

export type HomeData = BuyerHomeData | ProducerHomeData | TransporterHomeData;
export type UserRole = 'buyer' | 'producer' | 'transporter';

interface HomeState {
  loading: boolean;
  error: string | null;
  userRole: UserRole | null;
  data: HomeData | null;
}

const initialState: HomeState = {
  loading: false,
  error: null,
  userRole: null,
  data: null,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    // Réinitialise le home (ex: logout)
    resetHome: () => initialState,

    // Mise à jour partielle manuelle si besoin (ex: GPS update local)
    patchHome: (state, action: PayloadAction<Partial<HomeData>>) => {
      if (state.data) {
        state.data = { ...state.data, ...action.payload } as HomeData;
      }
    },
  },
  extraReducers: (builder) => {
    builder

      // ── pending ─────────────────────────────────────────────────────────────
      .addCase(fetchHome.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })

      // ── fulfilled ───────────────────────────────────────────────────────────
      .addCase(fetchHome.fulfilled, (state, action: PayloadAction<HomeResponse>) => {
        state.loading  = false;
        state.error    = null;
        state.userRole = action.payload.user_role;
        state.data     = action.payload.data;
      })

      // ── rejected ────────────────────────────────────────────────────────────
      .addCase(fetchHome.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload ?? 'Une erreur est survenue.';
      });
  },
});

// ─── Actions ─────────────────────────────────────────────────────────────────

export const { resetHome, patchHome } = homeSlice.actions;





// ─── Selectors ───────────────────────────────────────────────────────────────


export const selectHomeLoading  = (state: RootState) => state.home.loading;
export const selectHomeError    = (state: RootState) => state.home.error;
export const selectUserRole     = (state: RootState) => state.home.userRole;
export const selectHomeData     = (state: RootState) => state.home.data;

// Selectors typés par rôle (cast sûr après vérification du rôle dans le composant)
export const selectBuyerHome      = (state: RootState) =>
  state.home.userRole === 'buyer'       ? (state.home.data as BuyerHomeData)       : null;

export const selectProducerHome   = (state: RootState) =>
  state.home.userRole === 'producer'    ? (state.home.data as ProducerHomeData)    : null;

export const selectTransporterHome = (state: RootState) =>
  state.home.userRole === 'transporter' ? (state.home.data as TransporterHomeData) : null;

// ─── Reducer ─────────────────────────────────────────────────────────────────

export default homeSlice.reducer;

