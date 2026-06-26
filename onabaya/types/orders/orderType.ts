export type OrderStatus =
  | "pending_payment"
  | "paid_searching_driver"
  | "assigned_to_driver"
  | "collected"
  | "delivered"
  | "disputed";

export type OrderType = {
  id: string;
  buyer_id: string;
  product_id: string;
  transporter_id: string | null;
  quantity_ordered: number;
  quantity_collected: number | null;
  total_price: number;
  delivery_fees: number;
  status: OrderStatus;

  audio_instruction_path: string | null;
  verification_code_collection: string | null;
  verification_code_delivery: string | null;

  origin_country_code: string;
  destination_country_code: string;
  currency: string;

  created_at?: string;
  updated_at?: string;

  delivery_latitude: number | null;
  delivery_longitude: number | null;
  delivery_address_name: string | null;

  escrowed_at: string | null;
};

export type OrderTrackingType = {
  id: string;
  order_id: string;
  latitude: number;
  longitude: number;
  current_city: string | null;
  created_at?: string;
  updated_at?: string;
};
