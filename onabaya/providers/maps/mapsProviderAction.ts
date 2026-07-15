import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/api/axiosConfig';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface ProductLocation {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  location: string;          // "lat,lng" ex: "6.3654,2.4183"
  latitude: number;
  longitude: number;
  stock_proof_photo: string;
  producer: {
    id: string;
    name: string;
    last_name: string;
    phone: string;
    average_rating: string;
  };
}

// 🔧 CORRIGÉ : structure alignée sur ce que OrderResource renvoie réellement.
// Champs marqués (⚠️ backend requis) doivent être ajoutés à OrderResource/ProductResource
// avant que le tracking fonctionne — voir note après ce fichier.
export interface ActiveOrderTracking {
  id: string;
  status: 'paid_searching_driver' | 'assigned_to_driver' | 'collected' | 'delivered' | 'disputed';
  product: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    location: string;        // "lat,lng" — on le parse nous-mêmes, comme pour ProductLocation
    producer: {
      id: string;
      name: string;
      last_name: string;
      phone: string;
      average_rating: string;
    } | null;
  };
  transporter: {             // 🔧 CORRIGÉ : 'driver' → 'transporter' (nom réel renvoyé par OrderResource)
    id: string;
    name: string;
    last_name: string;
    phone: string;
    average_rating: string;
    // ⚠️ backend requis : dernière position connue du transporteur.
    // À ajouter dans OrderResource en joignant order.trackings()->latest()
    latitude: number | null;
    longitude: number | null;
  } | null;
  total_price: number;
  delivery_fees: number;     // 🔧 CORRIGÉ : 'delivery_price' → 'delivery_fees' (vraie colonne)
  delivery_latitude: number; // 🔧 CORRIGÉ : 'buyer_latitude' → 'delivery_latitude' (vraie colonne)
  delivery_longitude: number;// 🔧 CORRIGÉ : 'buyer_longitude' → 'delivery_longitude' (vraie colonne)
  created_at: string;
}

export interface CreateOrderPayload {
  product_id: string;
  quantity_ordered: number;
  total_price: number;
  delivery_price: number;
}

// ─────────────────────────────────────────────
// 1. CATALOGUE PRODUITS AVEC COORDONNÉES (pins sur la carte)
//    GET products
// ─────────────────────────────────────────────

export const fetchProductsForMap = createAsyncThunk<
  ProductLocation[],
  void,
  { rejectValue: string }
>(
  'maps/fetchProductsForMap',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('products');

      const products: ProductLocation[] = response.data.data.map((p: any) => {
        const [lat, lng] = (p.location ?? '0,0').split(',').map(Number);
        return {
          ...p,
          latitude: lat,
          longitude: lng,
        };
      });

      return products;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Impossible de charger les produits.'
      );
    }
  }
);

// ─────────────────────────────────────────────
// 2. DÉTAIL D'UN PRODUIT (bottom sheet quand on tape un pin)
//    GET products/:id
// ─────────────────────────────────────────────

export const fetchProductDetail = createAsyncThunk<
  ProductLocation,
  string,
  { rejectValue: string }
>(
  'maps/fetchProductDetail',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`products/${productId}`);
      const p = response.data.data;
      const [lat, lng] = (p.location ?? '0,0').split(',').map(Number);
      return { ...p, latitude: lat, longitude: lng };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Produit introuvable.'
      );
    }
  }
);

// ─────────────────────────────────────────────
// 3. CRÉER UNE COMMANDE (bouton "Commander" dans le bottom sheet)
//    POST orders
// ─────────────────────────────────────────────

export const createOrder = createAsyncThunk<
  { order_id: string; status: string; message: string },
  CreateOrderPayload,
  { rejectValue: string }
>(
  'maps/createOrder',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('orders', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Impossible de passer la commande.'
      );
    }
  }
);

// ─────────────────────────────────────────────
// 4. SUIVI DE LA COMMANDE ACTIVE (polling pour le trajet)
//    GET /v1/orders/:id
// 🔧 CORRIGÉ : parse product.location (comme pour ProductLocation) puisque
// le backend ne renvoie pas producer_latitude/producer_longitude séparément.
// ─────────────────────────────────────────────

export const fetchActiveOrderTracking = createAsyncThunk<
  ActiveOrderTracking,
  string,
  { rejectValue: string }
>(
  'maps/fetchActiveOrderTracking',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`orders/${orderId}`);
      return response.data.data as ActiveOrderTracking;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Impossible de récupérer le suivi.'
      );
    }
  }
);

// ─────────────────────────────────────────────
// 5. LISTE DE TOUTES LES COMMANDES EN COURS
//    GET orders
// ─────────────────────────────────────────────

export const fetchMyOrders = createAsyncThunk<
  ActiveOrderTracking[],
  void,
  { rejectValue: string }
>(
  'maps/fetchMyOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('orders');
      return response.data.data as ActiveOrderTracking[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Impossible de charger vos commandes.'
      );
    }
  }
);

// ─────────────────────────────────────────────
// 6. DÉCLARER UN LITIGE À LA LIVRAISON
//    POST orders/:id/dispute
// ─────────────────────────────────────────────

export const reportDispute = createAsyncThunk<
  { success: boolean; status: string; message: string },
  { orderId: string; reason: string; proof_photo: File },
  { rejectValue: string }
>(
  'maps/reportDispute',
  async ({ orderId, reason, proof_photo }, { rejectWithValue }) => {
    try {
      const form = new FormData();
      form.append('reason', reason);
      form.append('proof_photo', proof_photo);

      const response = await api.post(`orders/${orderId}/dispute`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Impossible de déclarer le litige.'
      );
    }
  }
);

// ─────────────────────────────────────────────
// 7. SOLDE PORTEFEUILLE (vérifier avant de commander)
//    GET balance
// ─────────────────────────────────────────────

export const fetchWalletBalance = createAsyncThunk<
  { balance: number; currency: string },
  void,
  { rejectValue: string }
>(
  'maps/fetchWalletBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('balance');
      const { balance, currency } = response.data.data;
      return { balance, currency };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? 'Impossible de récupérer le solde.'
      );
    }
  }
);