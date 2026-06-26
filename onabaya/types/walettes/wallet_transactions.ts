export type WalletTransactionTypeEnum =
  | "deposit"
  | "withdraw"
  | "escrow_lock"
  | "escrow_unlock"
  | "escrow_refund";

export type WalletTransactionType = {
  id: string;
  wallet_id: string;
  amount: number;
  type: WalletTransactionTypeEnum;
  reference: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
};
