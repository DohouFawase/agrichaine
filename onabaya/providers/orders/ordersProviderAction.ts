import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axiosConfig';

// --- INTERFACES DU MODÈLE COMMANDE ---
export interface OrderResource {
  id: string;
  buyer_id: string;
  product_id: string;
  transporter_id: string | null;
  quantity_ordered: number;
  total_price: number;
  delivery_fees: number;
  status: string;
  audio_instruction_path: string | null;
  verification_code_collection: string | null;
  verification_code_delivery: string | null;
  origin_country_code: string;
  destination_country_code: string;
  currency: string;
  created_at: string;
  updated_at: string;
  
  // Relations imbriquées incluses par le backend
  buyer?: {
    id: string;
    name: string;
    phone: string;
  };
  product?: {
    id: string;
    name: string;
    unit: string;
    price_per_unit: number;
    location: string;
  };
  transporter?: {
    id: string;
    name: string;
  } | null;
}

// --- PAYLOADS & RESPONSES DES ENDPOINTS ---
interface OrdersListResponse {
  success: boolean;
  user_role: string;
  count: number;
  data: OrderResource[];
}

interface OrderDetailsResponse {
  success: boolean;
  data: OrderResource;
}

interface ValidateCollectionPayload {
  orderId: string;
  scanned_code: string;
  quantity_collected: number;
}

interface ValidateCollectionResponse {
  success: boolean;
  status: string;
  message: string;
}

interface AssignOrderResponse {
  success: boolean;
  message: string;
  data: OrderResource;
}

interface CreateOrderPayload {
  product_id: string;
  quantity_ordered: number;
  total_price: number;
  delivery_price: number;
}

interface CreateOrderResponse {
  success: boolean;
  message: string;
  order_id: string;
  data: OrderResource;
}


// ==========================================
// 🔥 1. ACTION POUR LISTER LES COMMANDES EN COURS (Selon le rôle détecté)
// EndPoint: GET /orders
// ==========================================
export const fetchOrdersAction = createAsyncThunk<
  OrdersListResponse,
  void,
  { rejectValue: string }
>('orders/fetchOrders', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<OrdersListResponse>('/orders');
    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || "Erreur lors de la récupération des commandes.";
    return rejectWithValue(msg);
  }
});

// ==========================================
// 📦 2. ACTION POUR LES DÉTAILS D'UNE COMMANDE
// EndPoint: GET /orders/{id}
// ==========================================
export const fetchOrderDetails = createAsyncThunk<
  OrderResource,
  string,
  { rejectValue: string }
>('orders/fetchDetails', async (orderId, { rejectWithValue }) => {
  try {
    const response = await api.get<OrderDetailsResponse>(`/orders/${orderId}`);
    return response.data.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || "Impossible de charger la commande.";
    return rejectWithValue(msg);
  }
});

// ==========================================
// 🖨️ 3. ACTION POUR VALIDER LA COLLECTE (Scan QR Code)
// EndPoint: POST /orders/{id}/validate-collection
// ==========================================
export const validateOrderCollection = createAsyncThunk<
  ValidateCollectionResponse,
  ValidateCollectionPayload,
  { rejectValue: string }
>('orders/validateCollection', async ({ orderId, scanned_code, quantity_collected }, { rejectWithValue }) => {
  try {
    const response = await api.post<ValidateCollectionResponse>(
      `/orders/${orderId}/validate-collection`,
      { scanned_code, quantity_collected }
    );
    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || "Échec de la validation de la collecte.";
    return rejectWithValue(msg);
  }
});


// ==========================================
// 🚚 4. ACTION POUR ACCEPTER UNE COURSE (Chauffeur clique "Accepter")
// EndPoint: POST /orders/assign
// ==========================================
export const assignOrder = createAsyncThunk<
  OrderResource,
  string, // order_id
  { rejectValue: string }
>('orders/assignOrder', async (orderId, { rejectWithValue }) => {
  try {
    const response = await api.post<AssignOrderResponse>('/orders/assign', {
      order_id: orderId,
    });
    return response.data.data;
  } catch (error: any) {
    // 400 = "Cette course a déjà été prise par un autre chauffeur."
    const msg =
      error.response?.data?.message || "Impossible d'accepter cette course.";
    return rejectWithValue(msg);
  }
});
 


// ==========================================
// 🚚 4. ACTION POUR ACCEPTER UNE COURSE (Chauffeur clique "Accepter")
// EndPoint: POST /orders/assign
// ==========================================
export const createOrder = createAsyncThunk<
 CreateOrderResponse,
  CreateOrderPayload,
  { rejectValue: string }
>('orders/createOrder', async (payload, { rejectWithValue }) => {
   console.log('🌐 [createOrder thunk] Appel API POST /orders avec:', payload);
  try {
   const response = await api.post<CreateOrderResponse>('/orders', payload);
    console.log('🌐 [createOrder thunk] Réponse API reçue:', response.data);
    return response.data;
  } catch (error: any) {
    // 400 = "Cette course a déjà été prise par un autre chauffeur."
    console.error('🌐 [createOrder thunk] Erreur API:', error.response?.data || error.message);
    const msg =
      error.response?.data?.message || "Impossible de créer la commande.";
    return rejectWithValue(msg);
  }
});
