import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wallet, CircleDollarSign, Clock, TrendingUp, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Coins, RefreshCw, Activity, ShieldCheck, Globe } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useI18n } from '../../../i18n';

const formatAmount = (n: number | null | undefined, decimals = 2) =>
  (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// Multi-currency balances for Dashboard — grid per currency (USD 100, KES 12800, EUR 90 etc.)
// Uses wallet_balances_tokens + fx polling 30s (fetch_rate_live cache), pricing amount*rate*0.99+fee
interface TokenBalance { token_symbol: string; symbol: string; name: string; token_type: string; decimals: number; balance: number; locked: number; available: number; updated_at: number; }
interface FxQuote { from: string; to: string; amount_in: number; market_rate: number; sarai_rate: number; fee_percent: number; net_out: number; shilys_before_fee: number; source?: string; }

function MultiCurrencyBalances({ compact = false }: { compact?: boolean }) {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [fx, setFx] = useState<Record<string, FxQuote | null>>({});
  const [localCcy, setLocalCcy] = useState<string>(() => {
    try { const s = localStorage.getItem('sarai-wallet-local-ccy'); if (s) return s.toUpperCase(); } catch {}
    return 'KES';
  });
  const [totalUsd, setTotalUsd] = useState<number>(0);
  const [totalLocal, setTotalLocal] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [secsToRefresh, setSecsToRefresh] = useState(30);
  const timerRef = useRef<number | null>(null);
  const cdRef = useRef<number | null>(null);

  const fetchBalances = useCallback(async () => {
    try {
      const res = await invoke<TokenBalance[]>('cmd_get_wallet_balances_tokens');
      const list = Array.isArray(res) ? res as TokenBalance[] : [];
      setBalances(list);
      return list;
    } catch { setBalances([]); return [] as TokenBalance[]; }
  }, []);

  const fetchFx = useCallback(async (list: TokenBalance[], local: string) => {
    const next: Record<string, FxQuote | null> = {};
    let usdSum = 0; let localSum = 0;
    await Promise.all(list.map(async (b) => {
      const sym = (b.symbol ?? b.token_symbol).toUpperCase();
      try {
        const qUsd = await invoke<FxQuote>('cmd_get_fx_rate', { from: sym, to: 'USD', amount: b.balance });
        next[sym] = qUsd;
        usdSum += qUsd.net_out;
        // also warm live cache every 30s poll
        invoke('cmd_fetch_fx_rate_live', { from: sym, to: 'USD' }).catch(() => {});
      } catch {
        const sarai = 1 * 0.99;
        const net = b.balance * sarai * 0.975;
        if (sym === 'USD') { next[sym] = { from: sym, to: 'USD', amount_in: b.balance, market_rate: 1, sarai_rate: sarai, fee_percent: 2.5, net_out: net, shilys_before_fee: b.balance * sarai }; usdSum += net; } else {
          // fallback stub for non-USD: approximate via market_rate_stub logic fallback handled above, keep zero
          next[sym] = null;
        }
      }
      // local total
      try {
        if (sym.toUpperCase() !== local.toUpperCase()) {
          const qLocal = await invoke<FxQuote>('cmd_get_fx_rate', { from: sym, to: local, amount: b.balance });
          localSum += qLocal.net_out;
          invoke('cmd_fetch_fx_rate_live', { from: sym, to: local }).catch(() => {});
        } else {
          const qLocal = await invoke<FxQuote>('cmd_get_fx_rate', { from: sym, to: local, amount: b.balance });
          localSum += qLocal.net_out;
        }
      } catch {
        if (sym.toUpperCase() === local.toUpperCase()) localSum += b.balance * 0.99 * 0.975;
      }
    }));
    setFx(next);
    setTotalUsd(usdSum);
    setTotalLocal(localSum);
    setLastUpdated(Date.now());
    setSecsToRefresh(30);
  }, []);

  useEffect(() => {
    (async () => {
      const list = await fetchBalances();
      if (list.length) fetchFx(list, localCcy);
    })();
  }, [fetchBalances, fetchFx, localCcy]);

  useEffect(() => {
    if (!balances.length) return;
    timerRef.current = window.setInterval(() => fetchFx(balances, localCcy), 30_000);
    cdRef.current = window.setInterval(() => setSecsToRefresh(s => (s <= 1 ? 30 : s - 1)), 1000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); if (cdRef.current) window.clearInterval(cdRef.current); };
  }, [balances, localCcy, fetchFx]);

  if (!balances.length) return null;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Coins size={12} style={{ color: 'var(--electric-blue)' }} /> MULTI-CURRENCY BALANCES
          <span style={{ fontSize: '0.55rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.1rem 0.4rem', borderRadius: 999, fontWeight: 400 }}>Live rates · auto-refresh 30s</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'} · refresh in {secsToRefresh}s</span>
          <button onClick={() => fetchFx(balances, localCcy)} className="pinc-btn" style={{ fontSize: '0.6rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={10} /> Refresh
          </button>
          <select value={localCcy} onChange={e => setLocalCcy(e.target.value.toUpperCase())} className="pinc-input" style={{ fontSize: '0.6rem', padding: '0.2rem 0.35rem', fontFamily: 'monospace' }}>
            {['USD','KES','EUR','GBP','JPY','UGX','NGN','ZAR','INR','BRL','MXN','AED'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Totals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div className="pinc-card" style={{ padding: '0.85rem', background: 'rgba(57,255,20,0.06)', borderColor: 'rgba(57,255,20,0.2)' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>TOTAL PORTFOLIO — USD</span><TrendingUp size={12} style={{ color: 'var(--neon-green)' }} />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--neon-green)', fontFamily: 'monospace' }}>${formatAmount(totalUsd)}</div>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Combined value of all holdings at live rates</div>
        </div>
        <div className="pinc-card" style={{ padding: '0.85rem', borderColor: 'rgba(0,212,255,0.2)' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>TOTAL IN {localCcy}</span><Globe size={12} style={{ color: 'var(--electric-blue)' }} />
          </div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--electric-blue)', fontFamily: 'monospace' }}>{formatAmount(totalLocal)} {localCcy}</div>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Converted at live SARAI rates</div>
        </div>
      </div>

      {/* Grid per currency */}
      <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(auto-fill, minmax(160px, 1fr))' : 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.6rem' }}>
        {balances.map(b => {
          const sym = (b.symbol ?? b.token_symbol).toUpperCase();
          const q = fx[sym];
          const isCrypto = b.token_type === 'crypto';
          const isStable = b.token_type === 'stable';
          const accent = isCrypto ? 'var(--electric-blue)' : isStable ? 'var(--neon-green)' : 'var(--neon-yellow)';
          return (
            <div key={sym} className="pinc-card" style={{ padding: '0.7rem', borderColor: `${accent}22`, background: `${accent}08`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: `${accent}14`, border: `1px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: accent, fontFamily: 'monospace' }}>{sym.slice(0, 2)}</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)', lineHeight: 1 }}>{sym}</div>
                    <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>{b.name}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.5rem', color: accent, fontFamily: 'monospace', background: `${accent}14`, border: `1px solid ${accent}22`, padding: '0.1rem 0.3rem', borderRadius: 4 }}>{b.token_type}</span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: accent, fontFamily: 'monospace' }}>{formatAmount(b.balance, b.decimals > 6 ? 4 : 2)} {sym}</div>
              {q ? (
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.3rem', lineHeight: 1.4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>→ USD net</span><span style={{ color: 'var(--neon-green)', fontWeight: 700 }}>${formatAmount(q.net_out, 2)}</span></div>
                  <div>market {formatAmount(q.market_rate, 4)} → SARAI {formatAmount(q.sarai_rate, 4)}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.52rem' }}>incl. {formatAmount(q.fee_percent, 1)}% conversion fee</div>
                </div>
              ) : (
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.3rem' }}>Fetching FX…</div>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${accent}00, ${accent}55, ${accent}00)` }} />
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: 6, background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <ShieldCheck size={12} style={{ color: 'var(--electric-blue)' }} />
        <span>Rates update automatically every 30 seconds · SARAI pricing is always slightly below market — no arbitrage</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--neon-green)', fontWeight: 600 }}><Activity size={10} /> LIVE</span>
      </div>
    </div>
  );
}

export default function DashboardPage({
  balance,
  transactions,
}: {
  balance: { balance: number; pending: number; total_earned: number } | null;
  transactions: any[];
}) {
  const deposits = transactions.filter((t) => t.type === 'deposit' || t.tx_type === 'Deposit').length;
  const withdrawals = transactions.filter((t) => t.type === 'withdrawal' || t.tx_type === 'Withdrawal').length;
  const transfers = transactions.filter((t) => t.type === 'transfer' || t.tx_type === 'Transfer').length;
  const earnings = transactions.filter((t) => t.type === 'earning' || t.tx_type === 'Reward').length;
  const { t } = useI18n();

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>{t('app.total_balance').toUpperCase()}</div>
            <Wallet size={14} style={{ color: 'var(--neon-green)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--neon-green)', fontFamily: 'monospace' }} className="glow-green">
            {balance ? `$${formatAmount(balance.balance + balance.pending)}` : '$0.00'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>All funds combined</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, rgba(57,255,20,0.2), rgba(57,255,20,0.5), rgba(57,255,20,0.2))' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>{t('app.available').toUpperCase()}</div>
            <CircleDollarSign size={14} style={{ color: 'var(--electric-blue)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--electric-blue)', fontFamily: 'monospace' }}>
            {balance ? `$${formatAmount(balance.balance)}` : '$0.00'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Ready to use · USDT/USDC</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, rgba(0,212,255,0.2), rgba(0,212,255,0.5), rgba(0,212,255,0.2))' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>{t('app.pending').toUpperCase()}</div>
            <Clock size={14} style={{ color: 'var(--neon-yellow)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--neon-yellow)', fontFamily: 'monospace' }}>
            {balance ? `$${formatAmount(balance.pending)}` : '$0.00'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>In escrow / processing</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, rgba(255,230,0,0.2), rgba(255,230,0,0.5), rgba(255,230,0,0.2))' }} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>{t('app.total_earned').toUpperCase()}</div>
            <TrendingUp size={14} style={{ color: 'var(--soft-purple)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--soft-purple)', fontFamily: 'monospace' }}>
            {balance ? `$${formatAmount(balance.total_earned)}` : '$0.00'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Lifetime earnings</div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, rgba(168,85,247,0.2), rgba(168,85,247,0.5), rgba(168,85,247,0.2))' }} />
        </motion.div>
      </div>

      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>{t('app.history').toUpperCase()}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: t('app.deposit'), count: deposits, icon: <ArrowDownToLine size={14} />, color: 'var(--neon-green)' },
          { label: t('app.withdraw'), count: withdrawals, icon: <ArrowUpFromLine size={14} />, color: 'var(--neon-red)' },
          { label: t('app.send'), count: transfers, icon: <ArrowRightLeft size={14} />, color: 'var(--electric-blue)' },
          { label: t('app.total_earned'), count: earnings, icon: <Coins size={14} />, color: 'var(--soft-purple)' },
        ].map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="pinc-card"
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: `${item.color}15`,
                border: `1px solid ${item.color}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color,
              }}
            >
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>{item.count}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{item.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(192,192,192,0.07)', border: '1px solid rgba(192,192,192,0.18)', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <span style={{ color: '#C0C0C0', fontWeight: 700 }}>{t('app.escrow_held')}</span> · {t('app.deposit')} / {t('app.withdraw')} · 30 min · <em>{t('app.i_have_sent')}</em> → {t('app.escrow_confirmed')} → {t('app.complain')}
      </div>

      {/* Multi-currency hold — expanded from wallet_balances_tokens + FX pricing */}
      <MultiCurrencyBalances />
    </div>
  );
}
