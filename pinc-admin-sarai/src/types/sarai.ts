/** Sarai frontend types mirroring backend Rust structs */

export type StableCoin = 'USDT' | 'USDC';

export const STABLE_COINS: StableCoin[] = ['USDT', 'USDC'];

// Internal ledger currencies — any fiat/crypto from tokens table via wallet_balances_tokens (150+ countries).
// USDT/USDC are deposit/withdraw only (watch-only via ADMIN); send/receive uses this broad set.
export type CurrencyCode = string;
export type TokenSymbol = CurrencyCode;

export interface QuoteResult {
  base_amount: number;
  fee_amount: number;
  total_amount: number;
  currency: string;
  agent_id: string;
  channel_id: string;
  commission_included: boolean;
}

export type DepositStatus =
  | 'PendingPayment'
  | 'EscrowHeld'
  | 'PaymentConfirmed'
  | 'Completed'
  | 'Cancelled'
  | 'Disputed';

export interface DepositOrder {
  id: string;
  agent_id: string;
  channel_id: string;
  buyer_node_id: string;
  amount: number;
  fee_amount: number;
  total_amount: number;
  currency: string;
  escrow_id: string | null;
  status: DepositStatus;
  payment_proof: string | null;
  created_at: number;
  confirmed_at: number | null;
  released_at: number | null;
  expires_at: number;
  disputed_at: number | null;
  dispute_reason: string | null;
  evidence_hash: string | null;
  complainant_node_id: string | null;
}

export interface AgentBalance {
  agent_id: string;
  token_symbol: string;
  balance: number;
  escrow_locked: number;
  updated_at: number;
}

export interface Agent {
  id: string;
  name: string;
  username?: string;
  country_iso2: string;
  country?: string;
  languages: string[];
  identity_verified: boolean;
  kyc_level: number;
  rating: number;
  commission_rate: number;
  volume_24h: number;
  created_at: number;
  node_id: string | null;
  is_online: boolean;
  last_seen: number;
  total_orders: number;
  completed_orders: number;
}

export interface PaymentChannel {
  id: string;
  agent_id: string;
  network: string;
  account_identifier: string;
  credentials_encrypted: string;
  currency: string;
  min_amount: number;
  max_amount: number;
  daily_limit: number;
  fee_percent: number;
  enabled: boolean;
}

export interface CheapestQuote {
  route: string;
  fee_rate: number;
  gas_cost: number;
  total_fee: number;
  profit_estimate: number;
}

export interface WalletBalanceView {
  balance: number;
  pending: number;
  total_earned: number;
  currency?: string;
  escrow_locked?: number;
  pending_deposits?: number;
  pending_withdrawals?: number;
}

export interface SaraiTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'earning';
  amount: number;
  currency?: string;
  status: string;
  from: string;
  to: string;
  timestamp: number;
  description: string;
  // compat with backend snake_case
  from_node?: string;
  to_node?: string;
  tx_type?: string;
  created_at?: number;
  peer_id?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  status: string;
  timestamp: number;
  sent_at?: number;
}

export interface InvoiceRequest {
  id: string;
  from_node: string;
  to_node: string;
  amount: number;
  currency: CurrencyCode;
  memo: string;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: number;
}
