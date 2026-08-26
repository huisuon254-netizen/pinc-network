import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wallet, RefreshCw, TrendingUp, Clock, ShieldCheck, Coins, Globe, Activity, ArrowRightLeft } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

// Multi-currency hold — wallet_balances_tokens (150 countries) + FX pricing algorithm
// Algorithm: fetch_rate_live (frankfurter/CoinGecko) polling 30s, CACHE, convert via amount * rate * 0.99 (1% lower) + 2.5% fee
// Invoke cmd_get_wallet_balances_tokens (list all balances) + cmd_get_fx_rate for conversion
// Shows grid per currency (USD 100, KES 12800, EUR 90 etc.) + total portfolio in USD + local currency

interface TokenBalance {
  token_symbol: string;
  symbol: string;
  name: string;
  token_type: 'stable' | 'fiat' | 'crypto' | string;
  decimals: number;
  balance: number;
  locked: number;
  available: number;
  updated_at: number;
}

interface FxQuote {
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

interface Converted {
  rawBalance: number;
  fx?: FxQuote | null;
  usdNet: number | null; // net USD after 1% + fee
  localNet: number | null;
  loading: boolean;
  error?: string;
}

const SUPPORTED_LOCAL_CURRENCIES = [
  'USD','EUR','KES','UGX','TZS','NGN','ZAR','GHS','EGP','MAD','XOF','XAF','ETB','RWF',
  'GBP','INR','PKR','BDT','IDR','MYR','THB','VND','PHP','CNY','JPY','KRW','SGD','AED','SAR','TRY','BRL','MXN','CAD','AUD','NZD','RUB','UAH','PLN','CHF',
] as const;

function formatAmount(n: number | null | undefined, decimals = 2) {
  if (n == null || !isFinite(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function currencyLabel(code: string): string {
  const map: Record<string, string> = {
    USD: '$', EUR: '€', KES: 'KSh', UGX: 'USh', TZS: 'TSh', NGN: '₦', ZAR: 'R', GHS: 'GH₵', EGP: 'ج.م', GBP: '£', JPY: '¥', CNY: '¥', INR: '₹', KRW: '₩',
    BTC: '₿', ETH: 'Ξ', USDT: '₮', USDC: '$',
  };
  return map[code] ?? code;
}

export default function WalletPage() {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [tokensList, setTokensList] = useState<string[]>([]);
  const [localCurrency, setLocalCurrency] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('sarai-wallet-local-ccy');
      if (saved) return saved.toUpperCase();
    } catch {}
    // try navigator language to guess? fallback KES as example in spec
    return 'KES';
  });
  const [converted, setConverted] = useState<Record<string, Converted>>({});
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [secsToRefresh, setSecsToRefresh] = useState(30);
  const [err, setErr] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // Persist localCurrency selection
  useEffect(() => {
    try { localStorage.setItem('sarai-wallet-local-ccy', localCurrency); } catch {}
  }, [localCurrency]);

  const fetchBalances = useCallback(async () => {
    setLoadingBalances(true);
    setErr(null);
    try {
      const res = await invoke<TokenBalance[]>('cmd_get_wallet_balances_tokens');
      // API returns array of balances
      const list = (res as any) ?? [];
      setBalances(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(String(e));
      setBalances([]);
    }
    // Also fetch tokens list for selector completeness
    try {
      const toks = await invoke<any[]>('cmd_list_tokens');
      if (Array.isArray(toks) && toks.length) {
        const symbols = toks.map((t: any) => String(t.symbol ?? t.token_symbol ?? '').toUpperCase()).filter(Boolean);
        setTokensList(symbols);
      }
    } catch {}
    setLoadingBalances(false);
  }, []);

  // Pricing algorithm: amount * rate * 0.99 (SARAI 1% lower) + fee (2.5%)
  // Uses cmd_get_fx_rate which internally does get_rate_sync -> CACHE + market*0.99 + fee
  // Polling 30s via fetch_rate_live (frankfurter/CoinGecko) is mimicked by re-invoking cmd_get_fx_rate / cmd_fetch_fx_rate_live every 30s
  const fetchFxForAll = useCallback(async (balancesToConvert: TokenBalance[], localCcy: string) => {
    if (!balancesToConvert.length) return;
    setRefreshing(true);
    const next: Record<string, Converted> = {};
    // Parallel fetches for USD + local conversion per token
    await Promise.all(balancesToConvert.map(async (b) => {
      const sym = b.symbol ?? b.token_symbol;
      const amt = b.balance;
      // Skip zero balances? Still show but conversion zero
      try {
        // Prefer live poll path: try cmd_fetch_fx_rate_live first, fallback to cmd_get_fx_rate
        let fxUsd: FxQuote | null = null;
        let fxLocal: FxQuote | null = null;
        // If already USD, fx is identity: market 1, sarai 0.99, but for portfolio USD total we want net = amt*0.99*0.975? spec says always 1% lower + fee
        // However for USD->USD we special-case to keep total sensible: treat as rate 1 but still show algorithm
        try {
          if (sym.toUpperCase() !== 'USD') {
            fxUsd = await invoke<FxQuote>('cmd_get_fx_rate', { from: sym, to: 'USD', amount: amt });
          } else {
            // USD -> USD identity through fx still yields 0.99 discount; we will handle display specially
            fxUsd = await invoke<FxQuote>('cmd_get_fx_rate', { from: sym, to: 'USD', amount: amt });
          }
        } catch {
          // fallback local compute if invoke fails (offline)
          const market = 1.0; // fallback identity
          const sarai = market * 0.99;
          fxUsd = { from: sym, to: 'USD', amount_in: amt, market_rate: market, sarai_rate: sarai, fee_percent: 2.5, net_out: amt * sarai * 0.975, shilys_before_fee: amt * sarai, source: 'local fallback', note: '1% lower + 2.5% fee' };
        }
        try {
          if (sym.toUpperCase() !== localCcy.toUpperCase()) {
            fxLocal = await invoke<FxQuote>('cmd_get_fx_rate', { from: sym, to: localCcy, amount: amt });
          } else {
            fxLocal = await invoke<FxQuote>('cmd_get_fx_rate', { from: sym, to: localCcy, amount: amt });
          }
        } catch {
          const market = sym.toUpperCase() === localCcy.toUpperCase() ? 1.0 : 1.0;
          const sarai = market * 0.99;
          fxLocal = { from: sym, to: localCcy, amount_in: amt, market_rate: market, sarai_rate: sarai, fee_percent: 2.5, net_out: amt * sarai * 0.975, shilys_before_fee: amt * sarai, source: 'local fallback' };
        }

        // Also try to warm live cache via cmd_fetch_fx_rate_live for top-of-market guarantee (best effort, non-blocking)
        // This ensures polling 30s hits frankfurter/CoinGecko and updates CACHE; we fire-and-forget
        if (sym.toUpperCase() !== 'USD') {
          invoke('cmd_fetch_fx_rate_live', { from: sym, to: 'USD' }).catch(() => {});
        }
        if (sym.toUpperCase() !== localCcy.toUpperCase()) {
          invoke('cmd_fetch_fx_rate_live', { from: sym, to: localCcy }).catch(() => {});
        }

        const usdNet = fxUsd ? fxUsd.net_out : null;
        const localNet = fxLocal ? fxLocal.net_out : null;
        next[sym] = { rawBalance: amt, fx: fxUsd, usdNet, localNet, loading: false };
        // Store both fx for tooltip but primary fx is USD path; we keep USD version in map; local net separately
        // To expose local fx too, we could store extra field — keep localFx in separate map or embed
        (next[sym] as any).fxLocal = fxLocal;
        (next[sym] as any).fxUsd = fxUsd;
      } catch (e) {
        next[sym] = { rawBalance: amt, fx: null, usdNet: null, localNet: null, loading: false, error: String(e) };
      }
    }));
    setConverted(next);
    setLastUpdated(Date.now());
    setSecsToRefresh(30);
    setRefreshing(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // When balances or localCurrency changes, fetch FX
  useEffect(() => {
    if (balances.length) {
      fetchFxForAll(balances, localCurrency);
    }
  }, [balances, localCurrency, fetchFxForAll]);

  // Polling 30s — ensures we are always updated and top of market via fetch_rate_live/cache
  useEffect(() => {
    if (!balances.length) return;
    timerRef.current = window.setInterval(() => {
      fetchFxForAll(balances, localCurrency);
    }, 30_000);
    countdownRef.current = window.setInterval(() => {
      setSecsToRefresh(s => (s <= 1 ? 30 : s - 1));
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (countdownRef.current) window.clearInterval(countdownRef.current);
    };
  }, [balances, localCurrency, fetchFxForAll]);

  const totalUsdNet = balances.reduce((sum, b) => {
    const sym = b.symbol ?? b.token_symbol;
    const c = converted[sym];
    if (!c || c.usdNet == null) {
      // fallback: if USD then raw balance discounted? For total, if no FX yet, use raw for USD otherwise 0
      if (sym.toUpperCase() === 'USD') return sum + b.balance; // optimistic before FX loads
      return sum;
    }
    // For USD holdings, fxUsd.net_out already includes 1% + fee discount; but for display of portfolio total we want actual value?
    // Keep algorithm result: net_out is discounted SARAI value (prevents arbitrage). That's what spec says to show.
    return sum + (c.usdNet ?? 0);
  }, 0);

  const totalUsdShilys = balances.reduce((sum, b) => {
    const sym = b.symbol ?? b.token_symbol;
    const c: any = converted[sym];
    const fxUsd: FxQuote | undefined = c?.fxUsd ?? c?.fx;
    if (!fxUsd) return sum + (sym.toUpperCase() === 'USD' ? b.balance * 0.99 : 0);
    return sum + (fxUsd.shilys_before_fee ?? 0);
  }, 0);

  const totalLocalNet = balances.reduce((sum, b) => {
    const sym = b.symbol ?? b.token_symbol;
    const c: any = converted[sym];
    if (!c || c.localNet == null) {
      if (sym.toUpperCase() === localCurrency.toUpperCase()) return sum + b.balance;
      return sum;
    }
    return sum + (c.localNet ?? 0);
  }, 0);

  // Available local currencies for selector = distinct tokens + hardcoded major
  const selectorOptions: string[] = (() => {
    const set = new Set<string>([...SUPPORTED_LOCAL_CURRENCIES, ...tokensList.map(s => s.toUpperCase()), ...balances.map(b => (b.symbol ?? b.token_symbol).toUpperCase())]);
    return Array.from(set).sort();
  })();

  if (loadingBalances) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading multi-currency wallet…</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header — total portfolio value */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={16} style={{ color: 'var(--neon-green)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--text-primary)' }}>WALLET — MULTI-CURRENCY HOLD</span>
            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '0.15rem 0.45rem', borderRadius: 999, background: 'var(--bg-secondary)' }}>
              150 COUNTRIES · {balances.length} CURRENCIES HELD
            </span>
            <span style={{ fontSize: '0.58rem', color: 'var(--neon-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Activity size={10} /> LIVE 30s POLL
            </span>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.5 }}>
            Hold any fiat/crypto from <code style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '0.05rem 0.3rem', borderRadius: 4 }}>tokens</code> + local currencies (KES, EUR, etc.) via FX · Pricing: <code style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '0.05rem 0.3rem', borderRadius: 4 }}>amount × rate × 0.99 (1% lower) + fee</code> · top-of-market via <code>frankfurter/CoinGecko</code> every 30s
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.6rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.35rem 0.6rem', borderRadius: 6 }}>
            <Clock size={11} /> {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'} · refresh in {secsToRefresh}s
          </div>
          <button onClick={() => fetchFxForAll(balances, localCurrency)} disabled={refreshing} className="pinc-btn" style={{ fontSize: '0.65rem', padding: '0.4rem 0.7rem', display: 'flex', alignItems: 'center', gap: 4, opacity: refreshing ? 0.6 : 1 }}>
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} /> Refresh now
          </button>
        </div>
      </div>

      {/* Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pinc-card" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(57,255,20,0.06), rgba(0,212,255,0.04))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: 700 }}>TOTAL PORTFOLIO — USD</div>
            <TrendingUp size={14} style={{ color: 'var(--neon-green)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--neon-green)', fontFamily: 'monospace', lineHeight: 1 }} className="glow-green">
            ${formatAmount(totalUsdNet, 2)}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontFamily: 'monospace' }}>
            SHILYS before fee: {formatAmount(totalUsdShilys, 2)} · net after 2.5% fee
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Sum of each holding converted via <code style={{ fontFamily: 'monospace' }}>amount × sarai_rate (market×0.99)</code> → net after fee
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, rgba(57,255,20,0.2), rgba(57,255,20,0.5), rgba(57,255,20,0.2))' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: 700 }}>TOTAL IN LOCAL CURRENCY</div>
            <Globe size={14} style={{ color: 'var(--electric-blue)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--electric-blue)', fontFamily: 'monospace' }}>
              {formatAmount(totalLocalNet, 2)} {localCurrency}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{currencyLabel(localCurrency)}</span>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: '0.25rem' }}>LOCAL CURRENCY (150 countries)</label>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <select value={localCurrency} onChange={e => setLocalCurrency(e.target.value.toUpperCase())} className="pinc-input" style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.7rem', padding: '0.35rem 0.5rem' }}>
                {selectorOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button onClick={() => fetchFxForAll(balances, localCurrency)} className="pinc-btn" style={{ fontSize: '0.65rem', padding: '0.35rem 0.6rem' }}>
                <RefreshCw size={12} /> Convert
              </button>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, rgba(0,212,255,0.2), rgba(0,212,255,0.5), rgba(0,212,255,0.2))' }} />
        </motion.div>
      </div>

      {/* Pricing note banner */}
      <div className="pinc-card" style={{ padding: '0.75rem 1rem', background: 'rgba(0,212,255,0.06)', borderColor: 'rgba(0,212,255,0.25)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.68rem', color: 'var(--electric-blue)', fontWeight: 700 }}>
          <ShieldCheck size={14} /> NO ARBITRAGE — SARAI 1% lower + 2–3% fee embedded
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Example: <span style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '0.1rem 0.35rem', borderRadius: 4, border: '1px solid var(--border)' }}>1 USD = 129 KES market → SARAI 128 SHILYS (market×0.99) → 128.5 SHILYS displayed</span> · polling <code>fetch_rate_live</code> (frankfurter/CoinGecko) every 30s → <code>CACHE</code> · convert <code>amount × sarai_rate × (1-fee)</code>
        </div>
      </div>

      {/* Grid of balances per currency */}
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Coins size={12} /> HOLDINGS — GRID PER CURRENCY ({balances.length})</span>
          <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 400 }}>Live rates per currency</span>
        </div>

        {balances.length === 0 ? (
          <div className="pinc-card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            No holdings yet. Your balances (USD, KES, EUR…) will appear after identity creation. Try refresh.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {balances.map((b) => {
              const sym = (b.symbol ?? b.token_symbol).toUpperCase();
              const c: any = converted[sym];
              const fxUsd: FxQuote | null | undefined = c?.fxUsd ?? c?.fx;
              const fxLocal: FxQuote | null | undefined = c?.fxLocal;
              const usdNet = c?.usdNet;
              const localNet = c?.localNet;
              const isCrypto = b.token_type === 'crypto';
              const isStable = b.token_type === 'stable';
              const accent = isCrypto ? 'var(--electric-blue)' : isStable ? 'var(--neon-green)' : 'var(--neon-yellow)';
              const bg = isCrypto ? 'rgba(0,212,255,0.06)' : isStable ? 'rgba(57,255,20,0.06)' : 'rgba(255,230,0,0.06)';
              return (
                <motion.div key={sym} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pinc-card" style={{ padding: '0.9rem', background: bg, borderColor: `${accent}22`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 28, height: 28, borderRadius: '50%', background: `${accent}15`, border: `1px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: accent, fontFamily: 'monospace' }}>
                          {sym.slice(0, 3)}
                        </span>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', lineHeight: 1 }}>{sym}</div>
                          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', lineHeight: 1 }}>{b.name}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{b.token_type.toUpperCase()}</div>
                      <div style={{ fontSize: '0.6rem', color: accent, fontFamily: 'monospace', fontWeight: 700 }}>{currencyLabel(sym)} · {b.decimals}dp</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: accent, fontFamily: 'monospace', lineHeight: 1 }}>
                      {formatAmount(b.balance, b.decimals > 6 ? 6 : 2)} <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{sym}</span>
                    </div>
                    {b.locked > 0 && (
                      <div style={{ fontSize: '0.6rem', color: 'var(--neon-yellow)', fontFamily: 'monospace' }}>Locked: {formatAmount(b.locked, 2)} · Available: {formatAmount(b.available, 2)}</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.62rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.15)', padding: '0.5rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>→ USD net</span>
                      <span style={{ color: 'var(--neon-green)', fontWeight: 700 }}>{usdNet != null ? `$${formatAmount(usdNet, 2)}` : '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>→ {localCurrency} net</span>
                      <span style={{ color: 'var(--electric-blue)', fontWeight: 700 }}>{localNet != null ? `${formatAmount(localNet, 2)} ${localCurrency}` : '—'}</span>
                    </div>
                    {fxUsd && (
                      <div style={{ fontSize: '0.56rem', color: 'var(--text-muted)', lineHeight: 1.4, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
                        market {formatAmount(fxUsd.market_rate, 4)} → SARAI {formatAmount(fxUsd.sarai_rate, 4)} · net {formatAmount(fxUsd.net_out, 2)} after {formatAmount(fxUsd.fee_percent, 1)}%
                      </div>
                    )}
                    {fxLocal && localCurrency !== 'USD' && fxLocal.to !== 'USD' && (
                      <div style={{ fontSize: '0.56rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        → {localCurrency}: market {formatAmount(fxLocal.market_rate, 4)} → SARAI {formatAmount(fxLocal.sarai_rate, 4)} · net {formatAmount(fxLocal.net_out, 2)}
                      </div>
                    )}
                    {c?.error && <div style={{ color: 'var(--neon-red)', fontSize: '0.6rem' }}>{c.error}</div>}
                  </div>

                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${accent}00, ${accent}66, ${accent}00)` }} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Algorithm footnote */}
      <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(192,192,192,0.07)', border: '1px solid rgba(192,192,192,0.18)', fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowRightLeft size={12} /> PRICING — always updated & top of market
        </div>
        Rates refresh every <strong>30s</strong>. SARAI prices sit 1% below market with a 2.5% conversion fee — no arbitrage. Example: KES market 129 → SARAI 127.71 → net 124.5 after fee. Totals are shown in USD and your selected local currency ({localCurrency}).
      </div>

      {err && <div style={{ fontSize: '0.7rem', color: 'var(--neon-red)', padding: '0.6rem 0.8rem', background: 'rgba(255,34,85,0.08)', border: '1px solid rgba(255,34,85,0.2)', borderRadius: 6 }}>{err}</div>}

      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem', borderTop: '1px solid var(--border)' }}>
        Multi-currency balances across 150 countries · Live FX rates refreshed every 30s · SARAI pricing always slightly below market · No arbitrage
      </div>
    </div>
  );
}
