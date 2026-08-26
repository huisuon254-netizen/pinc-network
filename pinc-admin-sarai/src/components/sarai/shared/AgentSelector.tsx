import { Users } from 'lucide-react';
import type { Agent, AgentBalance } from '../../../types/sarai';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useI18n } from '../../../i18n';

const formatAmount = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const P2P_COUNTRIES = [
  'US','GB','DE','FR','NG','KE','IN','PH','BR','MX','ID','PK','BD','TZ','UG','GH','ZA','AE','SA','TR','CN','JP','KR','VN','TH','MY','SG','AU','CA','ES','IT','RU',
];

export function completionPct(a: Agent): number {
  const total = Number(a.total_orders) || 0;
  const completed = Number(a.completed_orders) || 0;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

export function rankAgents(agents: Agent[]): Agent[] {
  return [...agents].sort((a, b) => {
    const pctDiff = completionPct(b) - completionPct(a);
    if (pctDiff !== 0) return pctDiff;
    return (Number(b.volume_24h) || 0) - (Number(a.volume_24h) || 0);
  });
}

export function AgentSelector({
  selectedAgent,
  onSelect,
  countryFilter,
  onCountryChange,
  agents,
  loading,
  onRetry,
}: {
  selectedAgent: Agent | null;
  onSelect: (a: Agent) => void;
  countryFilter: string;
  onCountryChange: (c: string) => void;
  agents: Agent[];
  loading: boolean;
  onRetry: () => void;
}) {
  const agentId = (a: Agent) => (a as any).id ?? (a as any).agent_id;
  const ranked = rankAgents(agents);
  const { t } = useI18n();

  return (
    <div>
      <select
        className="pinc-input"
        value={countryFilter}
        onChange={(e) => onCountryChange(e.target.value)}
        style={{ width: '100%', fontSize: '0.7rem', marginBottom: '0.5rem', cursor: 'pointer' }}
      >
        <option value="">{t('app.all_countries')}</option>
        {P2P_COUNTRIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {loading && (
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>{t('common.loading')}</div>
      )}

      {!loading && ranked.length === 0 ? (
        <div className="pinc-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            {t('app.no_agents')}
          </div>
          <button className="pinc-btn pinc-btn-primary" onClick={onRetry} style={{ fontSize: '0.7rem', padding: '0.45rem 1rem' }}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            <Users size={11} /> {ranked.length} {t('app.agent').toLowerCase()}{ranked.length === 1 ? '' : 's'} online · ranked by completion rate
          </div>
          {ranked.map((a) => {
            const pct = completionPct(a);
            const isSelected = selectedAgent && agentId(selectedAgent) === agentId(a);
            return (
              <div
                key={agentId(a)}
                className="pinc-card"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(a)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelect(a);
                }}
                style={{
                  padding: '0.75rem 1rem',
                  cursor: isSelected ? undefined : 'pointer',
                  transition: 'all 0.2s',
                  borderColor: isSelected ? 'var(--electric-blue)' : undefined,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--electric-blue)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = isSelected ? 'var(--electric-blue)' : 'var(--border)')}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'rgba(192,192,192,0.15)',
                      border: '1px solid rgba(192,192,192,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#C0C0C0',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {String((a as any).name || (a as any).username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {(a as any).name || (a as any).username}
                      </span>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: a.is_online ? 'var(--neon-green)' : 'rgba(74,85,104,0.8)',
                          flexShrink: 0,
                        }}
                        title={a.is_online ? 'Online' : 'Offline'}
                      />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{(a as any).country || a.country_iso2 || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--neon-green)' }}>
                      {Number(a.rating ?? 0).toFixed(1)}
                    </div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>rating</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <span>
                    Completion:{' '}
                    <span style={{ color: pct >= 80 ? 'var(--neon-green)' : pct >= 50 ? 'var(--neon-yellow)' : 'var(--neon-red)', fontWeight: 600 }}>
                      {pct}%
                    </span>{' '}
                    ({Number(a.completed_orders) || 0}/{Number(a.total_orders) || 0})
                  </span>
                  <span>
                    24h volume: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>${formatAmount(Number(a.volume_24h) || 0)}</span>
                  </span>
                  <span>
                    Commission:{' '}
                    <span style={{ color: 'var(--electric-blue)', fontWeight: 600 }}>{(Number(a.commission_rate) || 0).toFixed(1)}%</span>
                  </span>
                </div>
                <TokenBalances agentId={String(agentId(a))} compact />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TokenBalances({ agentId, refreshKey, compact = false }: { agentId: string; refreshKey?: number; compact?: boolean }) {
  const [balances, setBalances] = useState<AgentBalance[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!agentId) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await invoke<AgentBalance[]>('cmd_p2p_agent_list_balances', { agentId });
        if (!cancelled) {
          setBalances(list || []);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentId, refreshKey]);

  if (!loaded || balances.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
      {balances.slice(0, 5).map((b) => (
        <div
          key={`${b.agent_id}-${b.token_symbol}`}
          style={{
            padding: compact ? '0.2rem 0.45rem' : '0.35rem 0.6rem',
            borderRadius: '6px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            fontSize: compact ? '0.58rem' : '0.65rem',
            color: 'var(--text-secondary)',
            fontFamily: 'monospace',
          }}
        >
          <span style={{ color: 'var(--neon-cyan)', fontWeight: 700 }}>{b.token_symbol}</span>{' '}
          <span style={{ color: 'var(--neon-green)' }}>${formatAmount(b.balance)}</span>
          {b.escrow_locked > 0 && <span style={{ color: '#C0C0C0' }}> escrow ${formatAmount(b.escrow_locked)}</span>}
        </div>
      ))}
    </div>
  );
}

export default AgentSelector;
