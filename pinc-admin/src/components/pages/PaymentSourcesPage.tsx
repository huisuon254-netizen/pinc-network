import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { RefreshCw, Plus, Globe, Link2, CheckCircle2, XCircle, Settings2, DollarSign } from 'lucide-react';

export default function PaymentSourcesPage() {
  const { paymentSources, loadPaymentSources, addPaymentSource, updatePaymentSource } = useAdminStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => { loadPaymentSources(); }, []);

  const totalProvidersEnabled = paymentSources.filter(s => s.enabled).length;

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Payment Sources</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{paymentSources.length} providers · {totalProvidersEnabled} active</p>
        </div>
        <button onClick={() => loadPaymentSources()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: 'var(--neon-green)', cursor: 'pointer', fontSize: '0.65rem' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'TOTAL PROVIDERS', value: paymentSources.length, color: 'var(--neon-cyan)' },
          { label: 'ACTIVE', value: totalProvidersEnabled, color: 'var(--neon-green)' },
          { label: 'INACTIVE', value: paymentSources.length - totalProvidersEnabled, color: 'var(--accent-red)' },
          { label: 'AVG FEE', value: paymentSources.length ? `${(paymentSources.reduce((a, s) => a + s.fee_percent, 0) / paymentSources.length).toFixed(2)}%` : '0%', color: 'var(--accent-yellow)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.7rem 0.85rem' }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Payment Sources Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.6rem' }}>
        {paymentSources.map(source => {
          const isEditing = editing === source.id;
          return (
            <div key={source.id} style={{
              background: 'var(--bg-card)', border: `1px solid ${source.enabled ? 'var(--border)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 8, padding: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{source.name}</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 1 }}>{source.provider} · {source.base_url}</div>
                </div>
                {source.enabled ? <CheckCircle2 size={16} color="var(--neon-green)" /> : <XCircle size={16} color="var(--accent-red)" />}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', marginBottom: '0.6rem' }}>
                {[
                  { label: 'API Key', value: source.api_key || '---', type: 'password' },
                  { label: 'Webhook URL', value: source.webhook_url || 'Not set', type: 'text' },
                  { label: 'Fee', value: `${source.fee_percent}%`, type: 'text' },
                  { label: 'Limits', value: `$${source.min_amount} - $${source.max_amount}`, type: 'text' },
                ].map(field => (
                  <div key={field.label} style={{ background: 'var(--bg-tertiary)', borderRadius: 4, padding: '0.35rem 0.5rem' }}>
                    <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginBottom: 1 }}>{field.label}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-primary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{field.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {source.supported_currencies.map(c => (
                  <span key={c} style={{ fontSize: '0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 3, padding: '0.1rem 0.3rem', color: 'var(--neon-green)' }}>{c}</span>
                ))}
                {source.supported_countries.slice(0, 6).map(c => (
                  <span key={c} style={{ fontSize: '0.5rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 3, padding: '0.1rem 0.3rem', color: 'var(--accent-blue)' }}><Globe size={8} style={{ display: 'inline', marginRight: 2 }} />{c}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => updatePaymentSource(source.id, { enabled: !source.enabled })} style={{ flex: 1, padding: '0.3rem', background: source.enabled ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${source.enabled ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: 4, color: source.enabled ? 'var(--accent-red)' : 'var(--neon-green)', cursor: 'pointer', fontSize: '0.55rem' }}>
                  {source.enabled ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => setEditing(editing === source.id ? null : source.id)} style={{ flex: 1, padding: '0.3rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 4, color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <Settings2 size={10} /> {editing === source.id ? 'Cancel' : 'Config'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
