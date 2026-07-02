// ─── User ────────────────────────────────────────────────────────────────────

export interface UserResource {
  id: string;
  name: string;
  last_name: string;
  phone: string;
  role: 'buyer' | 'producer' | 'transporter';
  status: string;
  created_at: string;
}

export interface UserPayload extends UserResource {
  email: string;
  average_rating: string;
  identity_document_path: string | null;
  id_verified_at: string | null;
  email_verified_at: string | null;
  updated_at: string | null;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface ProductResource {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_estimated_value: number;
  location: string;
  status: string;
  producer?: UserResource;
  created_at: string;
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export interface TransactionResource {
  id: string;
  payment_reference: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  display_type: 'credit' | 'debit';
  reference: string;
  status: string;
  description: string | null;
  created_at: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export interface OrderResource {
  id: string;
  quantity_ordered: number;
  total_price: number;
  delivery_fees: number;
  status: OrderStatus;
  buyer?: UserResource;
  producer?: UserResource;
  transporter?: UserResource | null;
  product?: ProductResource;
  transaction?: TransactionResource | null;
  created_at: string;
}

export type OrderStatus =
  | 'searching'
  | 'assigned'
  | 'collected'
  | 'delivered'
  | 'disputed'
  | 'cancelled';

// ─── Trip ────────────────────────────────────────────────────────────────────

export interface TripResource {
  id: string;
  departure_city: string;
  destination_city: string;
  available_weight: number;
  departure_date: string;
  status: string;
  transporter?: UserResource;
  created_at: string;
}

// ─── Driver Status ────────────────────────────────────────────────────────────

export interface DriverStatusPayload {
  status: 'available' | 'busy' | 'offline';
  latitude: number | null;
  longitude: number | null;
  updated_at: string | null;
}

// ─── Escrow ──────────────────────────────────────────────────────────────────

export interface EscrowOrderItem {
  order_id: string;
  product_name: string;
  quantity: string;
  unit: string;
  status_label: 'En cours de transport' | 'Livraison en cours';
  display_amount: number;
}

export interface EscrowPayload {
  total_amount: number;
  active_orders: EscrowOrderItem[];
}

// ─── Wallets par rôle ────────────────────────────────────────────────────────

export interface BuyerWallet {
  balance: number;
  currency: string;
  escrow: EscrowPayload;
  recent_transactions: TransactionItem[];
}

export interface ProducerWallet {
  balance: number;
  currency: string;
  recent_transactions: TransactionItem[];
}

export interface TransporterWallet {
  balance: number;
  currency: string;
  recent_transactions: TransactionItem[];
}

// ─── Home Data par rôle ──────────────────────────────────────────────────────

export interface BuyerHomeData {
  user: UserPayload;
  wallet: BuyerWallet;
  active_orders: OrderResource[];
  available_products: ProductResource[];
}

export interface ProducerHomeData {
  user: UserPayload;
  wallet: ProducerWallet;
  my_products: ProductResource[];
  active_orders: OrderResource[];
}

export interface TransporterHomeData {
  user: UserPayload;
  driver_status: DriverStatusPayload;
  wallet: TransporterWallet;
  available_orders: OrderResource[];
  my_active_orders: OrderResource[];
  my_trips: TripResource[];
}

// ─── Response envelopes ──────────────────────────────────────────────────────

export interface BuyerHomeResponse {
  success: boolean;
  user_role: 'buyer';
  data: BuyerHomeData;
}

export interface ProducerHomeResponse {
  success: boolean;
  user_role: 'producer';
  data: ProducerHomeData;
}

export interface TransporterHomeResponse {
  success: boolean;
  user_role: 'transporter';
  data: TransporterHomeData;
}

export type HomeResponse =
  | BuyerHomeResponse
  | ProducerHomeResponse
  | TransporterHomeResponse;