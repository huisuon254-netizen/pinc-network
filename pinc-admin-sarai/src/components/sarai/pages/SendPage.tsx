import { useEffect, useState, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Send, AlertCircle, CheckCircle2, Coins, Search } from 'lucide-react';
import { useI18n } from '../../../i18n';

const PINC_RE = /^PINC-\d{4}-\d{3}$/;

interface TokenBalance {
  token_symbol: string;
  symbol: string;
  name: string;
  token_type: string;
  decimals: number;
  balance: number;
  locked: number;
  available: number;
  updated_at: number;
}

interface TokenInfo {
  symbol: string;
  name: string;
  token_type: string;
  decimals: number;
  enabled: boolean;
}

function formatAmount(n: number | null | undefined, decimals = 2) {
  if (n == null || !isFinite(n)) return '—';
  const d = decimals > 6 ? 6 : decimals;
  return n.toLocaleString('en-US', { minimumFractionDigits: Math.min(d, 2), maximumFractionDigits: d });
}

export default function SendPage() {
  const { t } = useI18n();
  const [toNode, setToNode] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('USD');
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const pincValid = PINC_RE.test(toNode.trim().toUpperCase());
  const amountNum = parseFloat(amount) || 0;

  const loadAll = async () => {
    setLoadingBalances(true);
    try {
      const [bals, toks] = await Promise.all([
        invoke<TokenBalance[]>('cmd_get_wallet_balances_tokens').catch(() => []),
        invoke<TokenInfo[]>('cmd_list_tokens').catch(() => []),
      ]);
      const balArr = Array.isArray(bals) ? bals : [];
      const tokArr = Array.isArray(toks) ? toks : [];
      setBalances(balArr);
      setTokens(tokArr.filter((x) => x.enabled !== false));
      // Default selection: first held currency with balance >0 else first token
      if (balArr.length > 0) {
        const dominant = balArr.reduce((a, b) => (b.available ?? b.balance) > (a.available ?? a.balance) ? b : a, balArr[0]);
        const sym = (dominant.symbol ?? dominant.token_symbol ?? '').toUpperCase();
        if (sym) setSelectedSymbol(sym);
      } else if (tokArr.length > 0) {
        const first = tokArr.find((x) => x.symbol.toUpperCase() === 'USD') ?? tokArr[0];
        if (first) setSelectedSymbol(first.symbol.toUpperCase());
      }
    } catch (e) {
      setErr(String(e));
    }
    setLoadingBalances(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const selectedBalance = useMemo(() => {
    const up = selectedSymbol.toUpperCase();
    return balances.find((b) => (b.symbol ?? b.token_symbol).toUpperCase() === up) ?? null;
  }, [balances, selectedSymbol]);

  const available = useMemo(() => {
    if (!selectedBalance) return 0;
    const av = selectedBalance.available ?? selectedBalance.balance - (selectedBalance.locked ?? 0);
    return Number.isFinite(av) ? av : selectedBalance.balance ?? 0;
  }, [selectedBalance]);

  const overBalance = amountNum > available + 1e-9;

  // Combined selector options: held + all tokens (dedupe)
  const selectorOptions = useMemo(() => {
    const map = new Map<string, { symbol: string; name: string; type: string; held?: TokenBalance }>();
    for (const b of balances) {
      const sym = (b.symbol ?? b.token_symbol).toUpperCase();
      if (!map.has(sym)) map.set(sym, { symbol: sym, name: b.name, type: b.token_type, held: b });
    }
    for (const tok of tokens) {
      const sym = tok.symbol.toUpperCase();
      if (!map.has(sym)) map.set(sym, { symbol: sym, name: tok.name, type: tok.token_type });
      else {
        // enrich name/type if missing
        const cur = map.get(sym)!;
        if (!cur.name || cur.name === sym) cur.name = tok.name;
        if (!cur.type) cur.type = tok.token_type;
      }
    }
    // sort: held first by balance desc, then alphabetically
    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      const aHeld = a.held ? 1 : 0;
      const bHeld = b.held ? 1 : 0;
      if (aHeld !== bHeld) return bHeld - aHeld;
      if (a.held && b.held) return (b.held.balance ?? 0) - (a.held.balance ?? 0);
      return a.symbol.localeCompare(b.symbol);
    });
    if (filter.trim()) {
      const q = filter.toLowerCase();
      return arr.filter((o) => o.symbol.toLowerCase().includes(q) || o.name.toLowerCase().includes(q) || o.type.toLowerCase().includes(q));
    }
    return arr;
  }, [balances, tokens, filter]);

  const handleSend = async () => {
    setErr(null);
    setOk(null);
    const to = toNode.trim().toUpperCase();
    if (!PINC_RE.test(to)) {
      setErr('Invalid PINC ID. Expected format PINC-0000-000');
      return;
    }
    if (!selectedSymbol) {
      setErr('Select a currency');
      return;
    }
    if (!(amountNum > 0)) {
      setErr('Amount must be >0');
      return;
    }
    if (overBalance) {
      setErr(`Insufficient ${selectedSymbol} balance: available ${formatAmount(available, selectedBalance?.decimals ?? 2)} ${selectedSymbol}, need ${amountNum}`);
      return;
    }
    setLoading(true);
    try {
      const res: unknown = await invoke('cmd_transfer_wallet_tokens', {
        toNode: to,
        tokenSymbol: selectedSymbol.toUpperCase(),
        amount: amountNum,
        memo: memo?.trim() ? memo.trim() : null,
      });
      // Best-effort peer message for history linking across devices (does not hold funds)
      try {
        await invoke('cmd_send_message', {
          peerId: to,
          content: `[SEND ${selectedSymbol.toUpperCase()} ${amountNum}] ${memo}`.trim(),
        });
      } catch {}
      const txId = (res as { transaction_id?: string; transactionId?: string })?.transaction_id ?? (res as { transactionId?: string })?.transactionId ?? 'completed';
      setOk(`Sent ${amountNum} ${selectedSymbol.toUpperCase()} to ${to} — ${txId}`);
      setToNode('');
      setAmount('');
      setMemo('');
      await loadAll();
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  const setMax = () => {
    if (selectedBalance) {
      // keep precision per decimals
      const dec = selectedBalance.decimals ?? 2;
      const v = available;
      setAmount(v.toFixed(Math.min(dec, 6)).replace(/\.?0+$/, ''));
    }
  };

  if (loadingBalances) {
    return <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '1rem' }}>Loading wallet balances…</div>;
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.25rem' }}>{t('app.send').toUpperCase()} — P2P TRANSFER · INTERNAL LEDGER</div>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
        Transfer any internal currency (USD, KES, EUR, BTC, ETH… via <code style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '0.05rem 0.3rem', borderRadius: 4 }}>wallet_balances_tokens</code>). USDT/USDC are <strong>deposit/withdraw only</strong> — use Deposit page watch-only address to bring funds in, not Send.
      </div>

      <div className="pinc-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>TO NODE (PINC ID)</label>
          <input
            className="pinc-input"
            value={toNode}
            onChange={(e) => setToNode(e.target.value.toUpperCase())}
            placeholder="PINC-0000-000"
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9rem', borderColor: toNode && !pincValid ? 'var(--neon-red)' : undefined }}
          />
          <div style={{ fontSize: '0.6rem', color: pincValid ? 'var(--neon-green)' : 'var(--text-muted)', marginTop: '0.25rem' }}>
            {toNode ? (pincValid ? '✓ Valid PINC ID' : 'Expected PINC-0000-000 (digits only)') : 'Enter recipient PINC ID'}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>
            CURRENCY · 150 countries + crypto (holdings via wallet_balances_tokens)
          </label>
          <div style={{ position: 'relative', marginBottom: '0.4rem' }}>
            <Search size={12} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="pinc-input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter currencies (e.g., USD, KES, EUR, BTC)…"
              style={{ width: '100%', paddingLeft: '1.8rem', fontSize: '0.7rem' }}
            />
          </div>
          <select
            className="pinc-input"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem', padding: '0.55rem' }}
          >
            {selectorOptions.map((o) => {
              const held = o.held;
              const balTxt = held ? ` · ${formatAmount(held.available ?? held.balance, held.decimals)} avail` : '';
              const lockTxt = held && (held.locked ?? 0) > 0 ? ` (locked ${formatAmount(held.locked, held.decimals)})` : '';
              return (
                <option key={o.symbol} value={o.symbol}>
                  {o.symbol} — {o.name} [{o.type}]{balTxt}{lockTxt}
                </option>
              );
            })}
          </select>
          {selectedBalance ? (
            <div style={{ fontSize: '0.65rem', color: overBalance ? 'var(--neon-red)' : 'var(--neon-green)', marginTop: '0.35rem', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
              <span>
                Available: {formatAmount(available, selectedBalance.decimals)} {selectedSymbol.toUpperCase()} {selectedBalance.locked > 0 ? `(locked ${formatAmount(selectedBalance.locked, selectedBalance.decimals)})` : ''} · Balance: {formatAmount(selectedBalance.balance, selectedBalance.decimals)}
              </span>
              <button onClick={setMax} style={{ background: 'none', border: 'none', color: 'var(--electric-blue)', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700 }}>MAX</button>
            </div>
          ) : (
            <div style={{ fontSize: '0.6rem', color: 'var(--neon-yellow)', marginTop: '0.35rem' }}>No holding for {selectedSymbol} — you can still receive, but not send until you hold some. Deposit via USDT/USDC to obtain {selectedSymbol}.</div>
          )}
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>via <code style={{ fontFamily: 'monospace' }}>cmd_list_tokens</code> + <code>cmd_get_wallet_balances_tokens</code> · internal ledger <code>(node_id, token_symbol)</code></div>
        </div>

        <div>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>{t('app.amount').toUpperCase()} ({selectedSymbol.toUpperCase()})</label>
          <input
            className="pinc-input"
            type="number"
            min="0"
            step={selectedBalance && selectedBalance.decimals > 2 ? '0.000001' : '0.01'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '1rem', borderColor: overBalance ? 'var(--neon-red)' : undefined }}
          />
          {overBalance && <div style={{ fontSize: '0.6rem', color: 'var(--neon-red)', marginTop: '0.25rem' }}>Exceeds available {formatAmount(available, selectedBalance?.decimals ?? 2)} {selectedSymbol.toUpperCase()}</div>}
        </div>

        <div>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>MEMO (optional)</label>
          <input
            className="pinc-input"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Note for recipient"
            style={{ width: '100%', fontSize: '0.75rem' }}
          />
        </div>

        {err && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '6px', background: 'rgba(255,34,85,0.08)', border: '1px solid rgba(255,34,85,0.2)', color: 'var(--neon-red)', fontSize: '0.75rem' }}>
            <AlertCircle size={14} /> {err}
          </div>
        )}
        {ok && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '6px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)', color: 'var(--neon-green)', fontSize: '0.75rem' }}>
            <CheckCircle2 size={14} /> {ok}
          </div>
        )}

        <button
          className="pinc-btn pinc-btn-primary"
          onClick={handleSend}
          disabled={loading || !pincValid || !(amountNum > 0) || overBalance || !selectedSymbol}
          style={{ width: '100%', fontSize: '0.85rem', padding: '0.7rem', opacity: pincValid && amountNum > 0 && !overBalance ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Send size={14} /> {t('app.send')} {amountNum ? `${amountNum} ${selectedSymbol.toUpperCase()}` : selectedSymbol.toUpperCase()} <Coins size={12} />
        </button>

        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Internal transfer via <code>cmd_transfer_wallet_tokens</code> on <code>wallet_balances_tokens(node_id, token_symbol)</code> + peer message for history. PINC-ID validation kept. Watch-only deposit (USDT/USDC) is separate — not used here.
        </div>
      </div>
    </div>
  );
}
