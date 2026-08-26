import { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Swords, Trophy, Briefcase, Globe, Server, ShieldCheck,
  Bell, CheckCheck, Loader2, Search, Trash2, X, Settings, SortAsc,
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

const CATEGORY_CONFIG: Record<NotificationCategory, { icon: any; color: string }> = {
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
  { label: 'All', value: 'all' }, { label: 'Wallet', value: 'wallet' }, { label: 'Games', value: 'games' },
  { label: 'Challenges', value: 'challenges' }, { label: 'Jobs', value: 'jobs' }, { label: 'Network', value: 'network' },
  { label: 'Server', value: 'server' }, { label: 'Security', value: 'security' }, { label: 'Platform', value: 'platform' },
];

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke<Notification[]>('cmd_get_app_notifications');
      setNotifications(Array.isArray(data) && data.length > 0 ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await invoke('cmd_mark_all_notifications_read'); } catch {}
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const filtered = useMemo(() => {
    let result = filter === 'all' ? notifications : notifications.filter(n => n.category === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => sortNewest ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);
    return result;
  }, [notifications, filter, searchQuery, sortNewest]);

  const displayed = filtered.slice(0, visibleCount);
  const unreadCount = notifications.filter(n => !n.read).length;
  const hasMore = visibleCount < filtered.length;

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>NOTIFICATION CENTER</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</div>
          <span className="badge badge-info">{unreadCount} unread</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { setSortNewest(s => !s); setVisibleCount(20); }}
              style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <SortAsc size={13} /> {sortNewest ? 'Newest' : 'Oldest'}
            </button>
            <button onClick={markAllRead}
              style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCheck size={13} /> Mark Read
            </button>
            <button onClick={clearAll}
              style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(239,68,68,0.1)', color: 'var(--neon-red)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Trash2 size={13} /> Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="pinc-input" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setVisibleCount(20); }}
            placeholder="Search notifications..." style={{ paddingLeft: '2rem', width: '100%', boxSizing: 'border-box' }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.5rem' }}>
        {FILTER_OPTIONS.map(f => (
          <button key={f.value} onClick={() => { setFilter(f.value); setVisibleCount(20); }} style={{
            padding: '0.3rem 0.75rem', borderRadius: 9999, fontSize: '0.68rem', fontWeight: 600, whiteSpace: 'nowrap',
            border: filter === f.value ? '1px solid var(--electric-blue)' : '1px solid var(--border)',
            background: filter === f.value ? 'rgba(0,212,255,0.1)' : 'transparent',
            color: filter === f.value ? 'var(--electric-blue)' : 'var(--text-secondary)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {f.label} · {filter === f.value ? (filter === 'all' ? notifications.filter(n => !n.read).length : notifications.filter(n => n.category === f.value && !n.read).length) : ''}{filter === f.value ? ' unread' : ''}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="pinc-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Loader2 size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.3, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading notifications...</div>
        </div>
      ) : displayed.length === 0 ? (
        <div className="pinc-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Bell size={48} style={{ margin: '0 auto 1.5rem', color: 'var(--text-muted)', opacity: 0.3 }} />
          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {searchQuery ? 'No results found' : 'No notifications'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {searchQuery ? 'Try a different search term' : "You're all caught up."}
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Showing {displayed.length} of {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
          </div>
          <AnimatePresence mode="popLayout">
            {displayed.map((n, i) => {
              const cat = CATEGORY_CONFIG[n.category];
              const Icon = cat.icon;
              return (
                <motion.div key={n.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.025 }}
                  style={{
                    marginBottom: '0.5rem', padding: '0.875rem 1.125rem', borderRadius: 10,
                    background: 'var(--bg-card)', border: `1px solid ${n.read ? 'var(--border)' : cat.color}40`,
                    display: 'flex', alignItems: 'flex-start', gap: '0.875rem', cursor: 'pointer',
                    opacity: n.read ? 0.65 : 1, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.boxShadow = `0 0 10px ${cat.color}18`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = n.read ? 'var(--border)' : `${cat.color}40`; e.currentTarget.style.boxShadow = 'none'; }}
                  onClick={() => markRead(n.id)}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} style={{ color: cat.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{n.title}</span>
                      {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span>{timeAgo(n.timestamp)}</span>
                      <span style={{ textTransform: 'capitalize', color: cat.color }}>{n.category}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, opacity: 0.5, flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--neon-red)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                    <X size={12} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {hasMore && (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <button onClick={() => setVisibleCount(c => c + 20)} className="pinc-btn" style={{ fontSize: '0.75rem' }}>
                Load More ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
