import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axiosConfig';

// 🔧 CORRIGÉ : structure alignée sur ce que WalletController::getWalletSummary
// renvoie réellement. L'ancienne interface (id, user_id, updated_at) ne
// correspondait à aucun champ du backend, et il manquait user_role, escrow,
// recent_transactions — pourtant bien calculés côté serveur mais jamais
// exploités côté app.
export interface WalletActiveOrder {
  order_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  status_label: string;
  display_amount: number;
}

export interface WalletTransactionItem {
  id: string;
  title: string;
  amount: number;
  display_type: 'credit' | 'debit' | 'pending';
  reference: string;
  description: string;
  created_at: string;
}

export interface WalletResponse {
  success: boolean;
  data: {
    balance: number;
    currency: string;
    user_role: string;
    escrow: {
      total_amount: number;
      active_orders: WalletActiveOrder[];
    };
    recent_transactions: WalletTransactionItem[];
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
      const response = await api.get<WalletResponse>('/balance');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Impossible de récupérer le solde du portefeuille.";
      return rejectWithValue(errorMessage);
    }
  }
);

// ==========================================
// 🔧 AJOUT : RECHARGE DU WALLET VIA MTN MOMO
// ==========================================

interface TopUpPayload {
  phone: string;
  amount: number;
}

interface TopUpInitiateResponse {
  success: boolean;
  reference: string;
  environment: 'sandbox' | 'production';
  message: string;
}

export const initiateWalletTopUp = createAsyncThunk<
  TopUpInitiateResponse,
  TopUpPayload,
  { rejectValue: string }
>(
  'wallet/initiateTopUp',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post<TopUpInitiateResponse>('/wallet/topup', payload);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Impossible d'initier la recharge.";
      return rejectWithValue(errorMessage);
    }
  }
);

interface TopUpStatusResponse {
  success: boolean;
  status: 'pending' | 'successful' | 'failed';
}

// À utiliser en polling (toutes les ~3-5s) après initiateWalletTopUp,
// jusqu'à obtenir 'successful' ou 'failed' — MoMo est asynchrone, la
// confirmation n'est jamais immédiate.
export const checkWalletTopUpStatus = createAsyncThunk<
  TopUpStatusResponse,
  string, // reference
  { rejectValue: string }
>(
  'wallet/checkTopUpStatus',
  async (reference, { rejectWithValue }) => {
    try {
      const response = await api.get<TopUpStatusResponse>(`/wallet/topup/${reference}/status`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Impossible de vérifier le statut de la recharge.";
      return rejectWithValue(errorMessage);
    }
  }
);

// ==========================================
// 🔧 AJOUT : RETRAIT DU WALLET VIA MTN MOMO
// ==========================================

interface WithdrawPayload {
  phone: string;
  amount: number;
}

interface WithdrawInitiateResponse {
  success: boolean;
  reference: string;
  environment: 'sandbox' | 'production';
  message: string;
}

export const initiateWalletWithdrawal = createAsyncThunk<
  WithdrawInitiateResponse,
  WithdrawPayload,
  { rejectValue: string }
>(
  'wallet/initiateWithdrawal',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post<WithdrawInitiateResponse>('/wallet/withdraw', payload);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Impossible d'initier le retrait.";
      return rejectWithValue(errorMessage);
    }
  }
);

interface WithdrawStatusResponse {
  success: boolean;
  status: 'pending' | 'successful' | 'failed';
}

export const checkWalletWithdrawalStatus = createAsyncThunk<
  WithdrawStatusResponse,
  string, // reference
  { rejectValue: string }
>(
  'wallet/checkWithdrawalStatus',
  async (reference, { rejectWithValue }) => {
    try {
      const response = await api.get<WithdrawStatusResponse>(`/wallet/withdraw/${reference}/status`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Impossible de vérifier le statut du retrait.";
      return rejectWithValue(errorMessage);
    }
  }
);

// ==========================================
// 🔧 AJOUT : HISTORIQUE COMPLET PAGINÉ
// ==========================================

interface TransactionsHistoryResponse {
  success: boolean;
  data: WalletTransactionItem[];
  meta: {
    current_page: number;
    last_page: number;
    has_more: boolean;
  };
}

export const fetchWalletTransactions = createAsyncThunk<
  TransactionsHistoryResponse,
  number, // page
  { rejectValue: string }
>(
  'wallet/fetchTransactions',
  async (page, { rejectWithValue }) => {
    try {
      const response = await api.get<TransactionsHistoryResponse>('/wallet/transactions', {
        params: { page },
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Impossible de charger l'historique.";
      return rejectWithValue(errorMessage);
    }
  }
);