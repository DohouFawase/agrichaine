import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axiosConfig';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface NextTierProgress {
  name: string;
  volume_remaining: number;
  orders_remaining: number;
}

export interface LoyaltyStatus {
  producer_id: string;
  producer_name: string;
  tier_name: string;
  badge_slug: string;
  rolling_volume: number;
  rolling_orders_count: number;
  recurring_purchases_enabled: boolean;
  can_enable_recurring_purchases: boolean;
  next_tier: NextTierProgress | null; 
}

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly';
export type RecurringStatus = 'active' | 'paused' | 'cancelled';

export interface RecurringOrder {
  id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  frequency: RecurringFrequency;
  next_run_at: string;
  status: RecurringStatus;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_address_name: string | null;
  last_executed_at: string | null;
  last_order_id: string | null;
  product?: {
    id: string;
    name: string;
    unit: string;
    price_per_unit: number;
  };
}

// ─────────────────────────────────────────────
// 1. STATUTS DE FIDÉLITÉ (tous producteurs confondus)
//    GET /loyalty/statuses
// ─────────────────────────────────────────────

interface LoyaltyStatusesResponse {
  success: boolean;
  data: LoyaltyStatus[];
}

export const fetchLoyaltyStatuses = createAsyncThunk<
  LoyaltyStatusesResponse,
  void,
  { rejectValue: string }
>('loyalty/fetchStatuses', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<LoyaltyStatusesResponse>('/loyalty/statuses');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ?? 'Impossible de charger votre statut de fidélité.'
    );
  }
});

// ─────────────────────────────────────────────
// 2. ACTIVER LA PROGRAMMATION D'ACHATS (clic sur notif "Meilleur Client")
//    POST /loyalty/recurring-purchases/enable
// ─────────────────────────────────────────────

interface EnableRecurringResponse {
  success: boolean;
  message: string;
  data: { recurring_purchases_enabled: boolean };
}

export const enableRecurringPurchases = createAsyncThunk<
  EnableRecurringResponse,
  { producer_id: string },
  { rejectValue: string }
>('loyalty/enableRecurring', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post<EnableRecurringResponse>(
      '/loyalty/recurring-purchases/enable',
      payload
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ?? "Impossible d'activer la programmation d'achats."
    );
  }
});

// ─────────────────────────────────────────────
// 3. PROGRAMMER UNE COMMANDE RÉCURRENTE
//    POST /loyalty/recurring-orders
// ─────────────────────────────────────────────

interface ScheduleRecurringOrderPayload {
  product_id: string;
  quantity: number;
  frequency: RecurringFrequency;
  scheduled_at: string; // ISO 8601 — date/heure précise choisie par l'acheteur
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_address_name?: string;
}

interface ScheduleRecurringOrderResponse {
  success: boolean;
  message: string;
  data: RecurringOrder;
}

export const scheduleRecurringOrder = createAsyncThunk<
  ScheduleRecurringOrderResponse,
  ScheduleRecurringOrderPayload,
  { rejectValue: string }
>('loyalty/scheduleRecurringOrder', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post<ScheduleRecurringOrderResponse>(
      '/loyalty/recurring-orders',
      payload
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ?? 'Impossible de programmer cette commande.'
    );
  }
});

// ─────────────────────────────────────────────
// 4. LISTE DES COMMANDES PROGRAMMÉES
//    GET /loyalty/recurring-orders
// ─────────────────────────────────────────────

interface RecurringOrdersListResponse {
  success: boolean;
  data: RecurringOrder[];
}

export const fetchRecurringOrders = createAsyncThunk<
  RecurringOrdersListResponse,
  void,
  { rejectValue: string }
>('loyalty/fetchRecurringOrders', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<RecurringOrdersListResponse>('/loyalty/recurring-orders');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ?? 'Impossible de charger vos commandes programmées.'
    );
  }
});

// ─────────────────────────────────────────────
// 5. ANNULER UNE COMMANDE PROGRAMMÉE
//    DELETE /loyalty/recurring-orders/{id}
// ─────────────────────────────────────────────

interface CancelRecurringOrderResponse {
  success: boolean;
  message: string;
}

export const cancelRecurringOrder = createAsyncThunk<
  CancelRecurringOrderResponse,
  string, // recurring order id
  { rejectValue: string }
>('loyalty/cancelRecurringOrder', async (id, { rejectWithValue }) => {
  try {
    const response = await api.delete<CancelRecurringOrderResponse>(`/loyalty/recurring-orders/${id}`);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ?? "Impossible d'annuler cette commande programmée."
    );
  }
});