import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Receipt, Shield, Bitcoin, Users } from 'lucide-react';
import { AgentSelector } from '../shared/AgentSelector';
import { EscrowInline } from '../shared/EscrowInline';
import WatchOnlyAddress from '../shared/WatchOnlyAddress';
import { openBecomeAgent } from '../shared/becomeAgent';
import { useI18n } from '../../../i18n';
import type { Agent, QuoteResult, DepositOrder, StableCoin, PaymentChannel } from '../../../types/sarai';

const formatAmount = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DEPOSIT_MAX = 1000; // agent deposit limit max $1000 per spec
const DEPOSIT_MIN_DIRECT = 10;

type Mode = 'direct' | 'agent';

export default function DepositPage() {
  const [mode, setMode] = useState<Mode>('direct');
  const { t } = useI18n();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
          {t('app.deposit').toUpperCase()} — USDT / USDC ONLY
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
                background: mode === m.id ? 'var(--electric-blue)' : 'transparent',
                color: mode === m.id ? 'var(--bg-primary)' : 'var(--text-muted)',
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

      {mode === 'direct' ? <DirectDeposit /> : <AgentDeposit />}
    </div>
  );
}

function DirectDeposit() {
  const [stable, setStable] = useState<StableCoin>('USDT');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
      <div>
        <div className="pinc-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>
            SELECT STABLECOIN
          </div>
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
                  background: stable === s ? 'rgba(0,212,255,0.12)' : 'transparent',
                  color: stable === s ? 'var(--electric-blue)' : 'var(--text-muted)',
                  border: stable === s ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--border)',
                  fontFamily: 'monospace',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <WatchOnlyAddress coin={stable} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="pinc-card" style={{ padding: '1rem', borderColor: 'rgba(255,230,0,0.35)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--neon-yellow)', marginBottom: '0.5rem' }}>NETWORK WARNING</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Send <strong>only USDT or USDC</strong> on a supported chain (Ethereum ERC-20, Tron TRC-20, Polygon, Base, Arbitrum, Solana).
            Any other asset or network will result in permanent loss of funds.
          </div>
        </div>
        <div className="pinc-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', padding: '0.3rem 0' }}>
            <span style={{ color: 'var(--text-muted)' }}>Minimum deposit</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>${DEPOSIT_MIN_DIRECT}.00</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', padding: '0.3rem 0' }}>
            <span style={{ color: 'var(--text-muted)' }}>Confirmations required</span>
            <span style={{ color: 'var(--neon-green)', fontWeight: 600, fontFamily: 'monospace' }}>12</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', padding: '0.3rem 0' }}>
            <span style={{ color: 'var(--text-muted)' }}>Credited to balance</span>
            <span style={{ color: 'var(--electric-blue)', fontWeight: 600 }}>after 12 confirmations</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentDeposit() {
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
  const overLimit = baseAmount > DEPOSIT_MAX;

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

  // Load the selected agent's REAL payment channels (account identifiers visible to clients)
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

  const initiateDeposit = async () => {
    if (!selectedAgent || !baseAmount || !channelId) return;
    setLoading(true);
    setErr(null);
    try {
      const o = await invoke<DepositOrder>('cmd_p2p_agent_initiate_deposit', {
        agentId: String((selectedAgent as any).id ?? (selectedAgent as any).agent_id),
        channelId,
        baseAmount,
      });
      setOrder(o); // real escrow order — backend holds silver escrow for 30 minutes
      setQuote(null);
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  const confirmPayment = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const updated = await invoke<DepositOrder>('cmd_p2p_agent_confirm_payment', {
        orderId: order.id,
        paymentProof: `sent-${Date.now()}`,
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
                  {(selectedAgent as any).name || (selectedAgent as any).username} — {t('app.deposit')}
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
                    PAYMENT METHOD (agent account)
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
                    <option value="">Select payment method…</option>
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.network} · {c.account_identifier} · {c.currency} · fee {Number(c.fee_percent).toFixed(1)}%
                      </option>
                    ))}
                  </select>
                  {selectedChannel && (
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Send fiat to <span style={{ color: 'var(--neon-cyan)', fontFamily: 'monospace' }}>{selectedChannel.account_identifier}</span>{' '}
                      ({selectedChannel.network}) · limits ${formatAmount(selectedChannel.min_amount)}–${formatAmount(selectedChannel.max_amount)}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>
                  {t('app.amount').toUpperCase()} (USD) — MAX ${DEPOSIT_MAX} VIA AGENT
                </label>
                <input
                  className="pinc-input"
                  type="number"
                  min="0"
                  max={DEPOSIT_MAX}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', fontSize: '0.9rem', fontFamily: 'monospace' }}
                />
                {overLimit && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--neon-red)', marginTop: '0.35rem' }}>
                    Agent deposits are capped at ${DEPOSIT_MAX}. Use Direct Crypto for larger amounts.
                  </div>
                )}
              </div>

              {quote && (
                <div style={{ padding: '0.5rem 0.75rem', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '0.7rem', marginBottom: '0.75rem' }}>
                  Fee: <span style={{ color: 'var(--neon-cyan)', fontWeight: 600, fontFamily: 'monospace' }}>${formatAmount(quote.fee_amount)}</span>
                  {' · '}You deposit:{' '}
                  <span style={{ color: 'var(--neon-green)', fontWeight: 600, fontFamily: 'monospace' }}>${formatAmount(quote.total_amount)}</span>
                  {' · '}You receive:{' '}
                  <span style={{ color: 'var(--electric-blue)', fontWeight: 600, fontFamily: 'monospace' }}>${formatAmount(quote.base_amount)}</span>{' '}
                  {(quote.currency || '').toUpperCase()}
                </div>
              )}

              {err && <div style={{ fontSize: '0.65rem', color: 'var(--neon-red)', marginBottom: '0.5rem' }}>{err}</div>}

              <button
                className="pinc-btn pinc-btn-primary"
                onClick={calcQuote}
                disabled={loading || !baseAmount || overLimit || !channelId}
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.55rem', marginBottom: '0.5rem', opacity: baseAmount && channelId && !overLimit ? 1 : 0.5 }}
              >
                <Receipt size={13} /> Get Quote
              </button>
              <button
                className="pinc-btn pinc-btn-primary"
                onClick={initiateDeposit}
                disabled={loading || !baseAmount || overLimit || !channelId || !quote}
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.55rem', opacity: baseAmount && channelId && quote && !overLimit ? 1 : 0.5 }}
              >
                <Shield size={13} /> Lock Silver Escrow (30 min)
              </button>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.6rem', lineHeight: 1.5 }}>
                Funds are held in silver escrow for 30 minutes. Pay the agent, tap I HAVE SENT — the agent confirms and releases.
                If something goes wrong after expiry you can file a complaint with evidence.
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
            onConfirm={confirmPayment}
            onRelease={releaseEscrow}
            onComplain={complain}
            loading={loading}
          />
        ) : (
          <div className="pinc-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>No active deposit</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Select your country → pick an agent ranked by completion rate (green dot = online) → amount → quote → lock escrow.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
