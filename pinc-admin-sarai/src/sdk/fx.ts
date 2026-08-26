// FX SDK for 150 countries — arbitrage-prevented curve
// Wraps Tauri cmd_get_fx_rate / cmd_convert_currency + local fallback
import { invoke } from '@tauri-apps/api/core';

export interface FxQuote {
  from: string;
  to: string;
  amount_in: number;
  market_rate: number;
  sarai_rate: number;
  fee_percent: number;
  net_out: number;
  shilys_before_fee: number;
  source?: string;
  note?: string;
}

export async function getFxRate(from: string, to: string, amount: number): Promise<FxQuote> {
  try {
    const q = await invoke<FxQuote>('cmd_get_fx_rate', { from, to, amount });
    return q;
  } catch {
    // fallback local 1% + 2.5% mock for offline (USD->KES 129 example)
    const market = from === 'USD' && to === 'KES' ? 129 : 1.0;
    const sarai = market * 0.99;
    return {
      from, to, amount_in: amount,
      market_rate: market, sarai_rate: sarai, fee_percent: 2.5,
      net_out: amount * sarai * 0.975, shilys_before_fee: amount * sarai,
      source: 'local fallback', note: '1% lower + 2.5% fee'
    };
  }
}

export async function convertCurrency(from: string, to: string, amount: number): Promise<FxQuote> {
  return getFxRate(from, to, amount);
}

// For react usage
export function formatFx(q: FxQuote): string {
  return `${q.amount_in} ${q.from} → ${q.net_out.toFixed(2)} ${q.to} @ SARAI ${q.sarai_rate.toFixed(4)} (market ${q.market_rate.toFixed(4)}) net after ${q.fee_percent}% fee`;
}

// Live polling — ensures top-of-market via frankfurter/CoinGecko every 30s, stores in CACHE
// Mirrors src-tauri/src/core/regions/fx.rs:95 fetch_rate_live polling 30s
export async function fetchRateLive(from: string, to: string): Promise<FxQuote> {
  try {
    const live = await invoke<FxQuote>('cmd_fetch_fx_rate_live', { from, to });
    return live as FxQuote;
  } catch {
    return getFxRate(from, to, 1);
  }
}

export function startFxPolling(from: string, to: string, onUpdate: (q: FxQuote) => void, intervalMs = 30_000): () => void {
  let cancelled = false;
  const tick = async () => {
    const q = await fetchRateLive(from, to);
    if (!cancelled) onUpdate(q);
  };
  tick();
  const id = setInterval(tick, intervalMs);
  return () => { cancelled = true; clearInterval(id); };
}

// Pricing algorithm — amount * rate * 0.99 (1% lower, no arbitrage) * (1 - fee)
// Used by WalletPage & DashboardPage for total portfolio value
export function saraiConvert(amount: number, marketRate: number, feePercent = 2.5): { saraiRate: number; shilys: number; net: number } {
  const saraiRate = marketRate * 0.99;
  const shilys = amount * saraiRate;
  const net = shilys * (1 - feePercent / 100);
  return { saraiRate, shilys, net };
}

// Token balances SDK — wraps cmd_get_wallet_balances_tokens
export interface TokenBalance {
  token_symbol: string;
  symbol: string;
  name: string;
  token_type: string;
  decimals: number;
  balance: number;
  locked?: number;
  available?: number;
  updated_at?: number;
}
export async function getWalletBalancesTokens(): Promise<TokenBalance[]> {
  return invoke<TokenBalance[]>('cmd_get_wallet_balances_tokens');
}
export async function getAllTokens(): Promise<{ symbol: string; name: string; token_type: string; decimals: number; enabled: boolean }[]> {
  try { return await invoke('cmd_list_tokens'); } catch { return []; }
}
