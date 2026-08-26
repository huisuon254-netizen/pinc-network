import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Receipt, Shield, Bitcoin, Users, ArrowUpFromLine, CheckCircle2, XCircle } from 'lucide-react';
import { AgentSelector } from '../shared/AgentSelector';
import { EscrowInline } from '../shared/EscrowInline';
import { openBecomeAgent } from '../shared/becomeAgent';
import { useI18n } from '../../../i18n';
import type { Agent, QuoteResult, DepositOrder, StableCoin, PaymentChannel } from '../../../types/sarai';

const formatAmount = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// User-facing network fee estimates for direct crypto payouts (estimates only)
const NETWORK_FEES: { chain: string; fee: number }[] = [
  { chain: 'Ethereum (ERC-20)', fee: 1.5 },
  { chain: 'Tron (TRC-20)', fee: 1.0 },
  { chain: 'Polygon', fee: 0.05 },
  { chain: 'Base', fee: 0.02 },
  { chain: 'Arbitrum', fee: 0.08 },
  { chain: 'Solana', fee: 0.01 },
];

type Mode = 'direct' | 'agent';

export default function WithdrawPage() {
  const [mode, setMode] = useState<Mode>('direct');
  const { t } = useI18n();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
          {t('app.withdraw').toUpperCase()} — USDT / USDC ONLY
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
          {(
            [
              { id: 'direct' as Mode, label: t('app.direct_crypto'), icon: <Bitcoin size={12} /> },
              { id: 'agent' as Mode, label: t('app.via_agent'), icon: <Users size={12} /> },
            ]
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 700,
                background: mode === m.id ? 'var(--neon-red)' : 'transparent',
                color: mode === m.id ? '#fff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'direct' ? <DirectWithdraw /> : <AgentWithdraw />}
    </div>
  );
}

function DirectWithdraw() {
  const { t } = useI18n();
  const [stable, setStable] = useState<StableCoin>('USDT');
  const [chainIdx, setChainIdx] = useState(1); // TRC-20 default
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const baseAmount = parseFloat(amount) || 0;
  const chain = NETWORK_FEES[chainIdx];
  const receive = Math.max(0, baseAmount - chain.fee);

  // cmd_internal_withdraw is backend-only: we render success/failure only — never engine internals
  const doWithdraw = async () => {
    if (!baseAmount || destination.trim().length < 8) return;
    setSubmitting(true);
    setResult(null);
    try {
      await invoke('cmd_internal_withdraw', { stable, amount: baseAmount });
      setResult({ ok: true, msg: `Withdrawal of ${stable} $${formatAmount(baseAmount)} to ${destination.trim()} submitted.` });
      setAmount('');
    } catch (e) {
      setResult({ ok: false, msg: String(e) });
    }
    setSubmitting(false);
  };

  return (
    <div className="pinc-card" style={{ padding: '1rem', maxWidth: 640 }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>
          TOKEN (Stable 2 only)
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['USDT', 'USDC'] as StableCoin[]).map((s) => (
            <button
              key={s}
              onClick={() => setStable(s)}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: stable === s ? 'rgba(255,34,85,0.12)' : 'transparent',
                color: stable === s ? 'var(--neon-red)' : 'var(--text-muted)',
                border: stable === s ? '1px solid rgba(255,34,85,0.4)' : '1px solid var(--border)',
                fontFamily: 'monospace',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>
          NETWORK
        </label>
        <select
          className="pinc-input"
          value={chainIdx}
          onChange={(e) => setChainIdx(Number(e.target.value))}
          style={{ width: '100%', fontSize: '0.7rem' }}
        >
          {NETWORK_FEES.map((c, i) => (
            <option key={c.chain} value={i}>
              {c.chain}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>
          DESTINATION ADDRESS ({stable})
        </label>
        <input
          className="pinc-input"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={`Your ${stable} ${chain.chain} address`}
          style={{ width: '100%', fontSize: '0.75rem', fontFamily: 'monospace' }}
        />
        <div style={{ fontSize: '0.62rem', color: 'var(--neon-yellow)', marginTop: '0.35rem' }}>
          Double-check the address and network — crypto withdrawals are irreversible.
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>
          {t('app.amount').toUpperCase()} (USD)
        </label>
        <input
          className="pinc-input"
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          style={{ width: '100%', fontSize: '0.9rem', fontFamily: 'monospace' }}
        />
      </div>

      <div style={{ padding: '0.5rem 0.75rem', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '0.7rem', marginBottom: '0.75rem' }}>
        Network fee:{' '}
        <span style={{ color: 'var(--neon-cyan)', fontWeight: 600, fontFamily: 'monospace' }}>${formatAmount(chain.fee)}</span>
        {' · '}You receive:{' '}
        <span style={{ color: 'var(--neon-green)', fontWeight: 600, fontFamily: 'monospace' }}>${formatAmount(receive)}</span>{' '}
        {stable} on {chain.chain} <span style={{ color: 'var(--text-muted)' }}>(estimate)</span>
      </div>

      {result && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.7rem',
            marginBottom: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '4px',
            color: result.ok ? 'var(--neon-green)' : 'var(--neon-red)',
            background: result.ok ? 'rgba(57,255,20,0.07)' : 'rgba(255,34,85,0.07)',
            border: `1px solid ${result.ok ? 'rgba(57,255,20,0.25)' : 'rgba(255,34,85,0.25)'}`,
          }}
        >
          {result.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />} {result.msg}
        </div>
      )}

      <button
        className="pinc-btn pinc-btn-primary"
        onClick={doWithdraw}
        disabled={submitting || !baseAmount || destination.trim().length < 8}
        style={{
          width: '100%',
          fontSize: '0.75rem',
          padding: '0.55rem',
          opacity: baseAmount && destination.trim().length >= 8 ? 1 : 0.5,
          background: 'var(--neon-red)',
          borderColor: 'var(--neon-red)',
          color: '#fff',
        }}
      >
        <ArrowUpFromLine size={13} /> Withdraw {stable}
      </button>
    </div>
  );
}

function AgentWithdraw() {
  const { t } = useI18n();
  const [countryFilter, setCountryFilter] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [channels, setChannels] = useState<PaymentChannel[]>([]);
  const [channelId, setChannelId] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [order, setOrder] = useState<DepositOrder | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const baseAmount = parseFloat(amount) || 0;

  const loadAgents = useCallback(async (country: string) => {
    setLoading(true);
    setErr(null);
    try {
      const list = await invoke<Agent[]>('cmd_p2p_agent_list', {
        countryIso2: country || null,
        network: null,
        onlineOnly: true,
      });
      setAgents(list || []);
    } catch (e) {
      setAgents([]);
      setErr(String(e));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAgents(countryFilter);
  }, [countryFilter, loadAgents]);

  useEffect(() => {
    setQuote(null);
    setOrder(null);
    setErr(null);
    if (!selectedAgent) {
      setChannels([]);
      setChannelId('');
      return;
    }
    const id = String((selectedAgent as any).id ?? (selectedAgent as any).agent_id);
    (async () => {
      try {
        const chs = await invoke<PaymentChannel[]>('cmd_p2p_agent_list_channels', { agentId: id });
        const enabled = (chs || []).filter((c) => c.enabled);
        setChannels(enabled);
        setChannelId(enabled.length === 1 ? enabled[0].id : '');
        if (enabled.length === 0) {
          setErr('This agent has no payment method available yet. Pick another agent.');
        }
      } catch (e) {
        setChannels([]);
        setChannelId('');
        setErr(String(e));
      }
    })();
  }, [selectedAgent]);

  const calcQuote = async () => {
    if (!selectedAgent || !baseAmount || !channelId) return;
    setLoading(true);
    setErr(null);
    try {
      const q = await invoke<QuoteResult>('cmd_p2p_agent_calc_quote', {
        agentId: String((selectedAgent as any).id ?? (selectedAgent as any).agent_id),
        channelId,
        baseAmount,
      });
      setQuote(q);
    } catch (e) {
      setQuote(null);
      setErr(String(e));
    }
    setLoading(false);
  };

  // Withdraw via agent is the deposit flow reversed:
  // your stables are locked in escrow → agent pays fiat to your account → you confirm & release.
  const initiateWithdraw = async () => {
    if (!selectedAgent || !baseAmount || !channelId) return;
    setLoading(true);
    setErr(null);
    try {
      const o = await invoke<DepositOrder>('cmd_p2p_agent_initiate_deposit', {
        agentId: String((selectedAgent as any).id ?? (selectedAgent as any).agent_id),
        channelId,
        baseAmount,
      });
      setOrder(o);
      setQuote(null);
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  const confirmReceipt = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const updated = await invoke<DepositOrder>('cmd_p2p_agent_confirm_payment', {
        orderId: order.id,
        paymentProof: `withdraw-received-${Date.now()}`,
      });
      if (updated && (updated as any).id) setOrder(updated);
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  const releaseEscrow = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const updated = await invoke<DepositOrder>('cmd_p2p_agent_release_escrow', { orderId: order.id });
      if (updated && (updated as any).id) setOrder(updated);
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  const complain = async (reason: string) => {
    if (!order) return;
    setLoading(true);
    try {
      const evidenceHash = btoa(reason).slice(0, 32);
      const updated = await invoke<DepositOrder>('cmd_p2p_agent_complain', {
        orderId: order.id,
        disputeReason: reason,
        evidenceHash,
      });
      if (updated && (updated as any).id) setOrder(updated);
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  const selectedChannel = channels.find((c) => c.id === channelId);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
      <div>
        <AgentSelector
          selectedAgent={selectedAgent}
          onSelect={(a) => setSelectedAgent(a)}
          countryFilter={countryFilter}
          onCountryChange={setCountryFilter}
          agents={agents}
          loading={loading}
          onRetry={() => loadAgents(countryFilter)}
        />

        <div style={{ marginTop: '0.75rem', fontSize: '0.65rem' }}>
          <a
            href="#p2p-agent"
            onClick={(e) => {
              e.preventDefault();
              openBecomeAgent();
            }}
            style={{ color: 'var(--neon-yellow)', textDecoration: 'underline', textUnderlineOffset: 3 }}
          >
            Want to earn? Become an Agent →
          </a>
        </div>

        {selectedAgent && (
          <div className="pinc-card" style={{ marginTop: '1rem' }}>
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {(selectedAgent as any).name || (selectedAgent as any).username} — {t('app.withdraw')}
                </div>
                <button
                  onClick={() => {
                    setSelectedAgent(null);
                    setQuote(null);
                    setOrder(null);
                    setErr(null);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.25rem' }}
                >
                  ×
                </button>
              </div>

              {channels.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>
                    RECEIVE FIAT VIA (agent payout method)
                  </label>
                  <select
                    className="pinc-input"
                    value={channelId}
                    onChange={(e) => {
                      setChannelId(e.target.value);
                      setQuote(null);
                    }}
                    style={{ width: '100%', fontSize: '0.7rem' }}
                  >
                    <option value="">Select payout method…</option>
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.network} · {c.account_identifier} · {c.currency} · fee {Number(c.fee_percent).toFixed(1)}%
                      </option>
                    ))}
                  </select>
                  {selectedChannel && (
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      The agent will pay out to the account you provide after escrow is locked · currency{' '}
                      <span style={{ color: 'var(--neon-cyan)' }}>{selectedChannel.currency}</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>
                  {t('app.amount').toUpperCase()} (USD) — NO WITHDRAW CAP
                </label>
                <input
                  className="pinc-input"
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', fontSize: '0.9rem', fontFamily: 'monospace' }}
                />
              </div>

              {quote && (
                <div style={{ padding: '0.5rem 0.75rem', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '0.7rem', marginBottom: '0.75rem' }}>
                  Fee: <span style={{ color: 'var(--neon-cyan)', fontWeight: 600, fontFamily: 'monospace' }}>${formatAmount(quote.fee_amount)}</span>
                  {' · '}Escrow locked:{' '}
                  <span style={{ color: 'var(--neon-green)', fontWeight: 600, fontFamily: 'monospace' }}>${formatAmount(quote.total_amount)}</span>
                  {' · '}You receive in {(quote.currency || '').toUpperCase()}:{' '}
                  <span style={{ color: 'var(--electric-blue)', fontWeight: 600, fontFamily: 'monospace' }}>${formatAmount(quote.base_amount)}</span>
                </div>
              )}

              {err && <div style={{ fontSize: '0.65rem', color: 'var(--neon-red)', marginBottom: '0.5rem' }}>{err}</div>}

              <button
                className="pinc-btn pinc-btn-primary"
                onClick={calcQuote}
                disabled={loading || !baseAmount || !channelId}
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.55rem', marginBottom: '0.5rem', opacity: baseAmount && channelId ? 1 : 0.5 }}
              >
                <Receipt size={13} /> Get Quote
              </button>
              <button
                className="pinc-btn pinc-btn-primary"
                onClick={initiateWithdraw}
                disabled={loading || !baseAmount || !channelId || !quote}
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.55rem', opacity: baseAmount && channelId && quote ? 1 : 0.5, background: 'var(--neon-red)', borderColor: 'var(--neon-red)', color: '#fff' }}
              >
                <Shield size={13} /> Lock Silver Escrow (30 min)
              </button>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.6rem', lineHeight: 1.5 }}>
                Your stables are held in silver escrow for 30 minutes while the agent sends fiat to your account.
                Confirm receipt, then release — or complain with evidence after expiry.
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>{t('app.escrow_held').toUpperCase()}</div>
        {order ? (
          <EscrowInline
            order={order}
            agentName={(selectedAgent as any)?.name || (selectedAgent as any)?.username}
            onConfirm={confirmReceipt}
            onRelease={releaseEscrow}
            onComplain={complain}
            loading={loading}
          />
        ) : (
          <div className="pinc-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>No active withdrawal</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Select your country → pick an agent → amount → quote → lock escrow → receive fiat → release.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
