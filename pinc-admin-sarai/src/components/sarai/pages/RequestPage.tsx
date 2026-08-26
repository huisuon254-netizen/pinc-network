import { useEffect, useState, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Inbox, Send, AlertCircle, CheckCircle2, Clock, Coins, Search } from 'lucide-react';
import { useI18n } from '../../../i18n';
import { usePolling } from '../hooks/usePolling';

const PINC_RE = /^PINC-\d{4}-\d{3}$/;

interface LocalInvoice {
  id: string;
  from_node: string;
  to_node: string;
  amount: number;
  currency: string;
  memo: string;
  status: string;
  created_at: number;
}

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

export default function RequestPage() {
  const { t } = useI18n();
  const [toNode, setToNode] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('USD');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<LocalInvoice[]>([]);
  const [myRequests, setMyRequests] = useState<LocalInvoice[]>([]);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [filter, setFilter] = useState('');

  const pincValid = PINC_RE.test(toNode.trim().toUpperCase());
  const amountNum = parseFloat(amount) || 0;

  const loadTokensAndBalances = async () => {
    try {
      const [bals, toks] = await Promise.all([
        invoke<TokenBalance[]>('cmd_get_wallet_balances_tokens').catch(() => []),
        invoke<TokenInfo[]>('cmd_list_tokens').catch(() => []),
      ]);
      const balArr = Array.isArray(bals) ? bals : [];
      const tokArr = Array.isArray(toks) ? toks : [];
      setBalances(balArr);
      setTokens(tokArr.filter((x) => x.enabled !== false));
      if (balArr.length > 0 && !selectedSymbol) {
        const dominant = balArr.reduce((a, b) => (b.available ?? b.balance) > (a.available ?? a.balance) ? b : a, balArr[0]);
        const sym = (dominant.symbol ?? dominant.token_symbol ?? '').toUpperCase();
        if (sym) setSelectedSymbol(sym);
      } else if (tokArr.length > 0 && !selectedSymbol) {
        const first = tokArr.find((x) => x.symbol.toUpperCase() === 'USD') ?? tokArr[0];
        if (first) setSelectedSymbol(first.symbol.toUpperCase());
      }
    } catch {}
  };

  useEffect(() => {
    loadTokensAndBalances();
  }, []);

  const selectorOptions = useMemo(() => {
    const map = new Map<string, { symbol: string; name: string; type: string; held?: TokenBalance }>();
    for (const b of balances) {
      const sym = (b.symbol ?? b.token_symbol).toUpperCase();
      if (!map.has(sym)) map.set(sym, { symbol: sym, name: b.name, type: b.token_type, held: b });
    }
    for (const tok of tokens) {
      const sym = tok.symbol.toUpperCase();
      if (!map.has(sym)) map.set(sym, { symbol: sym, name: tok.name, type: tok.token_type });
    }
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
      return arr.filter((o) => o.symbol.toLowerCase().includes(q) || o.name.toLowerCase().includes(q));
    }
    return arr;
  }, [balances, tokens, filter]);

  const createRequest = async () => {
    setErr(null);
    setOk(null);
    const to = toNode.trim().toUpperCase();
    if (!PINC_RE.test(to)) {
      setErr('Invalid PINC ID. Expected PINC-0000-000');
      return;
    }
    if (!(amountNum > 0)) {
      setErr('Amount must be >0');
      return;
    }
    if (!selectedSymbol) {
      setErr('Select a currency');
      return;
    }
    setLoading(true);
    try {
      const payload = JSON.stringify({
        type: 'invoice',
        amount: amountNum,
        currency: selectedSymbol.toUpperCase(),
        memo,
        created_at: Math.floor(Date.now() / 1000),
      });
      await invoke('cmd_send_message', { peerId: to, content: `INVOICE:${payload}` });
      setOk(`Invoice for ${amountNum} ${selectedSymbol.toUpperCase()} sent to ${to}`);
      setToNode('');
      setAmount('');
      setMemo('');
      await refresh();
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  const refresh = async () => {
    try {
      const list = await invoke<unknown[]>('cmd_list_invoices').catch(() => null);
      if (Array.isArray(list)) {
        const mapped: LocalInvoice[] = (list as Array<Record<string, unknown>>).map((r) => ({
          id: String((r.id as string) ?? (r.invoice_id as string) ?? Date.now()),
          from_node: String((r.from_node as string) ?? (r.sender_id as string) ?? 'unknown'),
          to_node: String((r.to_node as string) ?? (r.recipient_id as string) ?? 'self'),
          amount: Number(r.amount) || 0,
          currency: String((r.currency as string) ?? 'USD').toUpperCase(),
          memo: String((r.memo as string) ?? (r.content as string) ?? ''),
          status: String((r.status as string) ?? 'pending'),
          created_at: Number(r.created_at ?? r.sent_at ?? Date.now() / 1000),
        }));
        setIncoming(mapped);
        setMyRequests(mapped);
        return;
      }
    } catch {}
    try {
      const msgs = await invoke<unknown[]>('cmd_get_messages', { peerId: '' }).catch(() => []);
      const invoices: LocalInvoice[] = (Array.isArray(msgs) ? (msgs as Array<Record<string, unknown>>) : [])
        .filter((m) => typeof m.content === 'string' && (m.content as string).startsWith('INVOICE:'))
        .map((m) => {
          try {
            const content = m.content as string;
            const j = JSON.parse(content.slice('INVOICE:'.length)) as Record<string, unknown>;
            return {
              id: String(m.id as string),
              from_node: String(m.sender_id as string),
              to_node: String(m.recipient_id as string),
              amount: Number(j.amount) || 0,
              currency: String((j.currency as string) ?? 'USD').toUpperCase(),
              memo: String((j.memo as string) ?? ''),
              status: 'pending',
              created_at: Number((m.timestamp as number) ?? (m.sent_at as number) ?? (j.created_at as number) ?? Date.now() / 1000),
            } as LocalInvoice;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as LocalInvoice[];
      setIncoming(invoices);
      setMyRequests(invoices);
    } catch {}
    try {
      const txs = await invoke<unknown[]>('cmd_get_transactions').catch(() => []);
      void txs;
    } catch {}
  };

  useEffect(() => {
    refresh();
  }, []);

  usePolling(refresh, 5000, true, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '1.5rem', alignItems: 'start' }}>
      <div className="pinc-card" style={{ padding: '1.25rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.25rem' }}>{t('app.request').toUpperCase()} — CREATE INVOICE · INTERNAL CURRENCIES</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
          Request any internal currency (USD, KES, EUR, BTC… via <code style={{ fontFamily: 'monospace' }}>wallet_balances_tokens</code>). USDT/USDC deposit only — not for request.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>TO (PINC ID) — who should pay</label>
            <input
              className="pinc-input"
              value={toNode}
              onChange={(e) => setToNode(e.target.value.toUpperCase())}
              placeholder="PINC-0000-000"
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9rem', borderColor: toNode && !pincValid ? 'var(--neon-red)' : undefined }}
            />
            <div style={{ fontSize: '0.6rem', color: pincValid ? 'var(--neon-green)' : 'var(--text-muted)', marginTop: '0.25rem' }}>
              {toNode ? (pincValid ? '✓ Valid PINC ID' : 'Expected PINC-0000-000') : 'Enter payer PINC ID'}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>
              CURRENCY (150 countries + crypto) <Coins size={10} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
            </label>
            <div style={{ position: 'relative', marginBottom: '0.4rem' }}>
              <Search size={12} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="pinc-input"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter currencies…"
                style={{ width: '100%', paddingLeft: '1.8rem', fontSize: '0.7rem' }}
              />
            </div>
            <select
              className="pinc-input"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem', padding: '0.5rem' }}
            >
              {selectorOptions.map((o) => (
                <option key={o.symbol} value={o.symbol}>
                  {o.symbol} — {o.name} [{o.type}]{o.held ? ` · ${o.held.balance} held` : ''}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              via <code>cmd_list_tokens</code> + <code>cmd_get_wallet_balances_tokens</code> · any fiat/crypto
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>
              {t('app.amount').toUpperCase()} ({selectedSymbol.toUpperCase()})
            </label>
            <input className="pinc-input" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', fontFamily: 'monospace' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>MEMO</label>
            <input className="pinc-input" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="What is this for?" style={{ width: '100%', fontSize: '0.75rem' }} />
          </div>

          {err && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(255,34,85,0.08)', border: '1px solid rgba(255,34,85,0.2)', color: 'var(--neon-red)', fontSize: '0.7rem' }}>
              <AlertCircle size={14} /> {err}
            </div>
          )}
          {ok && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)', color: 'var(--neon-green)', fontSize: '0.7rem' }}>
              <CheckCircle2 size={14} /> {ok}
            </div>
          )}

          <button
            className="pinc-btn pinc-btn-primary"
            onClick={createRequest}
            disabled={loading || !pincValid || !(amountNum > 0)}
            style={{ width: '100%', fontSize: '0.8rem', padding: '0.65rem', opacity: pincValid && amountNum > 0 ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Send size={14} /> {t('app.request')} {amountNum ? `${amountNum} ${selectedSymbol.toUpperCase()}` : selectedSymbol.toUpperCase()}
          </button>

          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
            Invoice is sent peer-to-peer via <code>cmd_send_message</code> with INVOICE payload (currency any token). Recipient sees it in Messages & here. No watch address used.
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>INCOMING REQUESTS · INVOICES</div>
        {incoming.length === 0 ? (
          <div className="pinc-card" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <Inbox size={28} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No requests</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Peer invoices sent to you will appear here (real DB, no demo). Currency can be any token (USD, KES, EUR, BTC…). </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {incoming.map((r) => (
              <div key={r.id} className="pinc-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--electric-blue)' }}>
                  <Clock size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                    {r.amount} {r.currency}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    From {r.from_node} · {r.memo || '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{new Date(r.created_at * 1000).toLocaleString()}</div>
                  <div style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '3px', background: 'rgba(255,230,0,0.12)', color: 'var(--neon-yellow)', border: '1px solid rgba(255,230,0,0.3)', display: 'inline-block', marginTop: '0.25rem' }}>pending</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {myRequests.length > 0 && (
          <>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', margin: '1rem 0 0.5rem' }}>RECENT</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{myRequests.length} invoice(s) tracked</div>
          </>
        )}
      </div>
    </div>
  );
}
