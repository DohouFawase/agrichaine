import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axiosConfig';

interface WalletResponse {
  success: boolean;
  data: {
    id: string;
    user_id: string;
    balance: number;  
    currency: string; 
    updated_at: string;
  };
}

export const FetchWalletAction = createAsyncThunk<
  WalletResponse,
  void, 
  { rejectValue: string }
>(
  'wallet/fetchWalletAction',
  async (_, { rejectWithValue }) => {
    try {
      // Appel à l'endpoint de ton portefeuille
      const response = await api.get<WalletResponse>('/balance');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Impossible de récupérer le solde du portefeuille.";
      return rejectWithValue(errorMessage);
    }
  }
);