import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEscrowCountdown } from '../hooks/useEscrowCountdown';
import { useI18n } from '../../../i18n';
import type { DepositOrder } from '../../../types/sarai';

export const statusBadgeMap: Record<string, { bg: string; fg: string; border: string }> = {
  completed: { bg: 'rgba(57,255,20,0.1)', fg: 'var(--neon-green)', border: 'rgba(57,255,20,0.3)' },
  pending: { bg: 'rgba(255,230,0,0.1)', fg: 'var(--neon-yellow)', border: 'rgba(255,230,0,0.3)' },
  failed: { bg: 'rgba(255,34,85,0.1)', fg: 'var(--neon-red)', border: 'rgba(255,34,85,0.3)' },
  EscrowHeld: { bg: 'rgba(192,192,192,0.15)', fg: '#C0C0C0', border: 'rgba(192,192,192,0.4)' },
  PaymentConfirmed: { bg: 'rgba(192,192,192,0.15)', fg: '#C0C0C0', border: 'rgba(192,192,192,0.4)' },
  Disputed: { bg: 'rgba(255,34,85,0.15)', fg: 'var(--neon-red)', border: 'rgba(255,34,85,0.5)' },
  Cancelled: { bg: 'rgba(74,85,104,0.15)', fg: 'var(--text-muted)', border: 'rgba(74,85,104,0.3)' },
  Completed: { bg: 'rgba(57,255,20,0.1)', fg: 'var(--neon-green)', border: 'rgba(57,255,20,0.3)' },
  PendingPayment: { bg: 'rgba(255,230,0,0.1)', fg: 'var(--neon-yellow)', border: 'rgba(255,230,0,0.3)' },
};

const formatAmount = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function EscrowInline({
  order,
  agentName,
  onConfirm,
  onRelease,
  onComplain,
  loading = false,
  showComplain = true,
}: {
  order: DepositOrder;
  agentName?: string;
  onConfirm?: () => void;
  onRelease?: () => void;
  onComplain?: (reason: string) => void;
  loading?: boolean;
  showComplain?: boolean;
}) {
  const { countdown, expired } = useEscrowCountdown(order.expires_at);
  const { t } = useI18n();
  const st = statusBadgeMap[order.status] || statusBadgeMap.pending;
  const canConfirm = order.status === 'EscrowHeld' && !expired;
  const canRelease = order.status === 'PaymentConfirmed';
  const canComplain = expired || order.status === 'Disputed';
  const statusLabel =
    order.status === 'EscrowHeld' ? t('app.escrow_held')
    : order.status === 'PaymentConfirmed' ? t('app.escrow_confirmed')
    : String(order.status).replace(/([a-z])([A-Z])/g, '$1 $2');

  return (
    <div className="pinc-card" style={{ padding: '1rem', borderColor: st.border }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
        {t('app.escrow_held').toUpperCase()} — 30MIN TIMEOUT
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
        {[
          { label: t('app.agent'), value: agentName || order.agent_id, color: 'var(--text-primary)' },
          { label: t('app.amount'), value: `$${formatAmount(order.total_amount ?? order.amount)}`, color: 'var(--neon-green)' },
          { label: 'Reference', value: String(order.id), color: 'var(--electric-blue)' },
          { label: 'Expires in', value: expired ? 'Expired' : countdown, color: expired ? 'var(--neon-red)' : 'var(--neon-yellow)' },
        ].map((row) => (
          <div
            key={row.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.4rem 0.6rem',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
              fontSize: '0.7rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{row.label}</span>
            <span
              style={{
                color: row.color,
                fontWeight: 600,
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <span
          style={{
            padding: '0.15rem 0.6rem',
            borderRadius: '3px',
            fontSize: '0.7rem',
            fontWeight: 700,
            background: st.bg,
            color: st.fg,
            border: `1px solid ${st.border}`,
          }}
        >
          {statusLabel}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canConfirm && onConfirm && (
            <button
              className="pinc-btn pinc-btn-primary"
              disabled={loading}
              onClick={onConfirm}
              style={{ fontSize: '0.7rem', padding: '0.45rem 0.9rem' }}
            >
              <CheckCircle2 size={12} /> {t('app.i_have_sent')}
            </button>
          )}
          {canRelease && onRelease && (
            <button
              className="pinc-btn pinc-btn-primary"
              disabled={loading}
              onClick={onRelease}
              style={{ fontSize: '0.7rem', padding: '0.45rem 0.9rem' }}
            >
              <CheckCircle2 size={12} /> {t('common.confirm')}
            </button>
          )}
        </div>
      </div>

      {showComplain && canComplain && onComplain && <ComplainBox order={order} onComplain={onComplain} loading={loading} />}
      {expired && order.status !== 'PaymentConfirmed' && order.status !== 'Disputed' && order.status !== 'Completed' && (
        <div style={{ fontSize: '0.65rem', color: 'var(--neon-red)', marginTop: '0.5rem' }}>
          Deposit window elapsed. If you sent funds, submit a complaint with evidence.
        </div>
      )}
    </div>
  );
}

function ComplainBox({
  order,
  onComplain,
  loading,
}: {
  order: DepositOrder;
  onComplain: (reason: string) => void;
  loading?: boolean;
}) {
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const { t } = useI18n();
  const alreadyDisputed = order.status === 'Disputed';
  if (alreadyDisputed) {
    return (
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontSize: '0.7rem', color: 'var(--neon-red)' }}>
        Disputed: {order.dispute_reason || '—'} {order.evidence_hash ? `· evidence ${order.evidence_hash.slice(0, 12)}…` : ''}
      </div>
    );
  }
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
      <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>
        {t('app.complain').toUpperCase()} — EVIDENCE
      </label>
      <textarea
        className="pinc-input"
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Describe what happened and paste any evidence (tx id, screenshot reference)..."
        style={{ width: '100%', fontSize: '0.7rem', fontFamily: 'inherit', resize: 'vertical', marginBottom: '0.5rem' }}
      />
      <input
        className="pinc-input"
        value={evidence}
        onChange={(e) => setEvidence(e.target.value)}
        placeholder="Evidence hash / tx id (optional)"
        style={{ width: '100%', fontSize: '0.7rem', fontFamily: 'monospace', marginBottom: '0.5rem' }}
      />
      <button
        className="pinc-btn"
        onClick={() => {
          const payload = evidence.trim() ? `${reason.trim()} | evidence:${evidence.trim()}` : reason.trim();
          onComplain(payload);
        }}
        disabled={loading || !reason.trim()}
        style={{
          width: '100%',
          fontSize: '0.75rem',
          padding: '0.55rem',
          color: 'var(--neon-red)',
          borderColor: 'var(--neon-red)',
          opacity: reason.trim() ? 1 : 0.5,
        }}
      >
        <AlertCircle size={14} /> {t('app.complain')}
      </button>
    </div>
  );
}

export default EscrowInline;
