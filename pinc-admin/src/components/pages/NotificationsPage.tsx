import { useState, useEffect } from 'react';
import { Bell, Send, Users, Crown, Server, Wifi, Plus } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export default function NotificationsPage() {
  const notificationHistory = useAdminStore(s => s.notificationHistory);
  const loadNotificationHistory = useAdminStore(s => s.loadNotificationHistory);
  const sendNotification = useAdminStore(s => s.sendNotification);

  useEffect(() => { loadNotificationHistory(); }, [loadNotificationHistory]);

  const [showCompose, setShowCompose] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', target: 'all' });

  const targetOptions = [
    { value: 'all', label: 'All Users', icon: <Users size={12} /> },
    { value: 'premium', label: 'Premium Users', icon: <Crown size={12} /> },
    { value: 'hosts', label: 'RENTBIT Hosts', icon: <Server size={12} /> },
    { value: 'providers', label: 'STARTERAN Providers', icon: <Wifi size={12} /> },
  ];

  const handleSend = async () => {
    if (!newNotif.title || !newNotif.message) return;
    await sendNotification(newNotif.title, newNotif.message, newNotif.target);
    setNewNotif({ title: '', message: '', target: 'all' });
    setShowCompose(false);
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Notification Center</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Send global and targeted notifications</p>
        </div>
        <button onClick={() => setShowCompose(!showCompose)} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem',
          background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)',
          borderRadius: 6, color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.65rem',
        }}>
          <Plus size={12} /> Compose
        </button>
      </div>

      {/* Compose Form */}
      {showCompose && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--accent-blue)', borderRadius: 8,
          padding: '1rem', marginBottom: '1rem',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>NEW NOTIFICATION</div>
          <input placeholder="Title" value={newNotif.title} onChange={e => setNewNotif(p => ({ ...p, title: e.target.value }))} style={{
            width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.7rem', marginBottom: '0.5rem',
          }} />
          <textarea placeholder="Message..." value={newNotif.message} onChange={e => setNewNotif(p => ({ ...p, message: e.target.value }))} style={{
            width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.7rem', height: 60, resize: 'vertical',
            marginBottom: '0.5rem',
          }} />
          <div style={{ display: 'flex', gap: 6, marginBottom: '0.5rem' }}>
            {targetOptions.map(t => (
              <button key={t.value} onClick={() => setNewNotif(p => ({ ...p, target: t.value }))} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '0.3rem 0.6rem',
                background: newNotif.target === t.value ? 'rgba(37,99,235,0.15)' : 'transparent',
                border: `1px solid ${newNotif.target === t.value ? 'var(--accent-blue)' : 'var(--border)'}`,
                borderRadius: 4, color: newNotif.target === t.value ? 'var(--accent-blue)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.55rem',
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <button onClick={handleSend} style={{
            padding: '0.4rem 1rem', background: 'var(--accent-blue)', border: 'none',
            borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Send size={12} /> Send Notification
          </button>
        </div>
      )}

      {/* Sent History */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          SENT NOTIFICATIONS
        </div>
        {notificationHistory.map(n => (
          <div key={n.id} style={{
            padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</div>
              <span style={{
                padding: '2px 8px', borderRadius: 10, fontSize: '0.5rem',
                background: 'rgba(16,185,129,0.12)', color: 'var(--neon-green)',
              }}>{n.status}</span>
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: 2 }}>{n.message}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: '0.5rem', color: 'var(--text-muted)' }}>
              <span>Target: {n.target}</span>
              <span>Sent: {n.sent_at}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
