import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Swords,
  Trophy,
  Briefcase,
  Globe,
  Server,
  ShieldCheck,
  Bell,
  CheckCheck,
  ChevronDown,
  Loader2,
} from 'lucide-react';

type NotificationCategory = 'wallet' | 'games' | 'challenges' | 'jobs' | 'network' | 'server' | 'security' | 'platform';

interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

type FilterType = 'all' | NotificationCategory;

const CATEGORY_CONFIG: Record<NotificationCategory, { icon: typeof Bell; color: string }> = {
  wallet:     { icon: Wallet,      color: '#22c55e' },
  games:      { icon: Swords,      color: '#ef4444' },
  challenges: { icon: Trophy,      color: '#eab308' },
  jobs:       { icon: Briefcase,   color: '#3b82f6' },
  network:    { icon: Globe,       color: '#06b6d4' },
  server:     { icon: Server,      color: '#a855f7' },
  security:   { icon: ShieldCheck, color: '#22c55e' },
  platform:   { icon: Bell,        color: '#9ca3af' },
};

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All',        value: 'all' },
  { label: 'Wallet',     value: 'wallet' },
  { label: 'Games',      value: 'games' },
  { label: 'Challenges', value: 'challenges' },
  { label: 'Jobs',       value: 'jobs' },
  { label: 'Network',    value: 'network' },
  { label: 'Server',     value: 'server' },
  { label: 'Security',   value: 'security' },
  { label: 'Platform',   value: 'platform' },
];

const PLACEHOLDER_NOTIFICATIONS: Notification[] = [
  { id: '1', category: 'wallet',     title: 'Deposit Received',   message: '0.5 PINC deposited to your wallet',       timestamp: Date.now() / 1000 - 3600,  read: false },
  { id: '2', category: 'games',      title: 'Wager Won',          message: 'You won 10 PINC in a chess wager',         timestamp: Date.now() / 1000 - 7200,  read: false },
  { id: '3', category: 'security',   title: 'New Device Login',   message: 'A new device accessed your account',       timestamp: Date.now() / 1000 - 86400, read: true },
  { id: '4', category: 'challenges', title: 'Challenge Complete', message: 'You completed the coding challenge',       timestamp: Date.now() / 1000 - 43200, read: true },
  { id: '5', category: 'jobs',       title: 'Job Application',    message: 'Your application was viewed',              timestamp: Date.now() / 1000 - 172800, read: true },
  { id: '6', category: 'network',    title: 'Peer Connected',     message: '3 new peers joined your network',          timestamp: Date.now() / 1000 - 259200, read: true },
  { id: '7', category: 'server',     title: 'Node Updated',       message: 'Server node updated to v2.1.0',           timestamp: Date.now() / 1000 - 600,    read: false },
  { id: '8', category: 'platform',   title: 'System Maintenance', message: 'Scheduled maintenance in 24 hours',        timestamp: Date.now() / 1000 - 345600, read: true },
];

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 0) return 'just now';
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: '12px',
  padding: '1rem 1.25rem',
  border: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1rem',
  cursor: 'pointer',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const unreadDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: 'var(--neon-blue, #3b82f6)',
  flexShrink: 0,
  marginTop: 6,
};

const filterChip = (active: boolean): React.CSSProperties => ({
  padding: '0.35rem 0.85rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  border: active ? '1px solid var(--neon-blue, #3b82f6)' : '1px solid var(--border)',
  background: active ? 'var(--neon-blue, #3b82f6)' : 'transparent',
  color: active ? '#fff' : 'var(--text-secondary)',
  cursor: 'pointer',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap',
});

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke<Notification[]>('cmd_get_app_notifications');
      setNotifications(data && data.length > 0 ? data : PLACEHOLDER_NOTIFICATIONS);
    } catch {
      setNotifications(PLACEHOLDER_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await invoke('cmd_mark_all_notifications_read'); } catch {}
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.category === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const currentFilterLabel = FILTER_OPTIONS.find(f => f.value === filter)?.label ?? 'All';

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>CENTRALIZED HUB</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</div>
          <span className="badge badge-info">{unreadCount} unread</span>
          <button
            onClick={markAllRead}
            style={{
              marginLeft: 'auto',
              padding: '0.4rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--neon-blue, #3b82f6)'; e.currentTarget.style.color = 'var(--neon-blue, #3b82f6)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <CheckCheck size={14} />
            Mark All Read
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {FILTER_OPTIONS.map(f => (
          <button
            key={f.value}
            style={filterChip(filter === f.value)}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="pinc-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Loader2 size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.3, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading notifications...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="pinc-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Bell size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--text-muted)', opacity: 0.3 }} />
          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No notifications</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filter === 'all'
              ? 'You\'re all caught up. New activity will appear here.'
              : `No ${currentFilterLabel.toLowerCase()} notifications.`}
          </div>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {filtered.map((n, i) => {
            const cat = CATEGORY_CONFIG[n.category];
            const Icon = cat.icon;
            return (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  ...cardStyle,
                  opacity: n.read ? 0.7 : 1,
                  marginBottom: '0.75rem',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.boxShadow = `0 0 12px ${cat.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                onClick={() => markRead(n.id)}
              >
                {/* Icon */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: `${cat.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={18} style={{ color: cat.color }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{n.title}</span>
                    {!n.read && <div style={unreadDot} />}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>{timeAgo(n.timestamp)}</div>
                </div>

                {/* Category label */}
                <span className="badge" style={{
                  alignSelf: 'flex-start',
                  flexShrink: 0,
                  fontSize: '0.65rem',
                  color: cat.color,
                  background: `${cat.color}15`,
                  border: `1px solid ${cat.color}30`,
                  textTransform: 'capitalize',
                }}>
                  {n.category}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
