import { createSlice } from '@reduxjs/toolkit';
import { LoginUserAction } from '@/providers/auth/loginProviderAction';
import { CreateUserAction } from '@/providers/auth/registerProviderAction';
import { fetchCurrentUserAction, UserResource } from '@/providers/auth/authProviderAction';

interface AuthState {
  user: UserResource | null; // Typage propre du profil utilisateur
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isSuccess: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutAction: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.isSuccess = false;
    },
    clearAuthErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- LOGIN ---
      .addCase(LoginUserAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(LoginUserAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.data.user;
        state.token = action.payload.data.access_token;
      })
      .addCase(LoginUserAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // --- REGISTER ---
      .addCase(CreateUserAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(CreateUserAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.data.user;
        state.token = action.payload.data.access_token as string;
      })
      .addCase(CreateUserAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // --- FETCH CURRENT USER (/v1/user) ---
      .addCase(fetchCurrentUserAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUserAction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload; // Stocke les données rafraîchies du profil
      })
      .addCase(fetchCurrentUserAction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logoutAction, clearAuthErrors } = authSlice.actions;
export default authSlice.reducer;