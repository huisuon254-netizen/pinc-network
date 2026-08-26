import { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { MessageSquare, Users, Hash, Trash2, Star, Ban, Eye } from 'lucide-react';

export default function TreificAdminPage() {
  const { treificCommunities, treificTrafficStats, loadTreificData, toggleCommunityFeature, freezeCommunity, removeCommunity } = useAdminStore();
  const [tab, setTab] = useState<'communities' | 'traffic'>('communities');

  useEffect(() => {
    loadTreificData();
  }, []);

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>TREIFIC Admin Panel</h1>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Community management — no private chat access</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
        {(['communities', 'traffic'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.35rem 0.8rem', fontSize: '0.6rem', textTransform: 'uppercase',
            background: tab === t ? 'rgba(37,99,235,0.15)' : 'transparent',
            border: `1px solid ${tab === t ? 'var(--accent-blue)' : 'var(--border)'}`,
            borderRadius: 4, color: tab === t ? 'var(--accent-blue)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'communities' && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['COMMUNITY', 'MEMBERS', 'ACTIVITY', 'TYPE', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.55rem', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {treificCommunities.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Hash size={12} color="var(--accent-blue)" />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{c.members.toLocaleString()}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: '0.55rem', fontWeight: 600,
                      background: c.activity === 'high' ? 'rgba(16,185,129,0.12)' : c.activity === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.12)',
                      color: c.activity === 'high' ? 'var(--neon-green)' : c.activity === 'medium' ? 'var(--accent-yellow)' : 'var(--text-muted)',
                    }}>{c.activity.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: c.type === 'private' ? 'var(--accent-yellow)' : 'var(--text-muted)', fontSize: '0.6rem' }}>{c.type}</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button title="Feature" onClick={() => toggleCommunityFeature(c.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--accent-yellow)', cursor: 'pointer', padding: 3 }}><Star size={11} /></button>
                      <button title="Freeze" onClick={() => freezeCommunity(c.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--accent-blue)', cursor: 'pointer', padding: 3 }}><Ban size={11} /></button>
                      <button title="Remove" onClick={() => removeCommunity(c.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--accent-red)', cursor: 'pointer', padding: 3 }}><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'traffic' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
          {[
            { label: 'MESSAGES/MIN', value: treificTrafficStats.messages_per_minute.toLocaleString(), color: 'var(--neon-cyan)' },
            { label: 'VOICE ACTIVE', value: String(treificTrafficStats.voice_active), color: 'var(--neon-green)' },
            { label: 'VIDEO ACTIVE', value: String(treificTrafficStats.video_active), color: 'var(--accent-purple)' },
            { label: 'FILE TRANSFERS', value: String(treificTrafficStats.file_transfers_active), color: 'var(--accent-orange)' },
            { label: 'TOTAL DATA', value: `${treificTrafficStats.total_data_gb} GB`, color: 'var(--accent-yellow)' },
            { label: 'ACTIVE CHATS', value: String(treificTrafficStats.active_chats), color: 'var(--accent-blue)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
              padding: '0.75rem 0.85rem',
            }}>
              <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
