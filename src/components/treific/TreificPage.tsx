import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Video, Users, Bell, Search, Plus, Send, X, Loader2, Hash,
  Globe, Lock, ChevronRight, Clock,
} from 'lucide-react';

type Tab = 'messages' | 'calls' | 'communities' | 'status';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'messages', label: 'MESSAGES', icon: <MessageSquare size={14} /> },
  { id: 'calls', label: 'CALLS', icon: <Phone size={14} /> },
  { id: 'communities', label: 'COMMUNITIES', icon: <Users size={14} /> },
  { id: 'status', label: 'STATUS', icon: <Bell size={14} /> },
];

interface Conversation {
  id: string;
  name: string;
  last_message: string;
  timestamp: number;
  unread_count: number;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  timestamp: number;
}

interface CallRecord {
  id: string;
  contact_name: string;
  call_type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  duration: number;
  timestamp: number;
}

interface Community {
  id: string;
  name: string;
  type: string;
  member_count: number;
  description: string;
}

interface StatusUpdate {
  id: string;
  author_id: string;
  content: string;
  timestamp: number;
}

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 0) return 'just now';
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

function truncateId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,212,255,0.06)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
        {icon}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6 }}>{description}</div>
    </div>
  );
}

function MessagesTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const msgEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    invoke<Conversation[]>('cmd_get_conversations')
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    invoke<ChatMessage[]>('cmd_get_messages', { peerId: activeConv })
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [activeConv]);

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !activeConv) return;
    const content = input.trim();
    invoke<ChatMessage>('cmd_send_message', { peerId: activeConv, content })
      .then(msg => setMessages(prev => [...prev, msg]))
      .catch(console.error);
    setInput('');
  };

  const activeConvData = conversations.find(c => c.id === activeConv);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={20} style={{ color: 'var(--electric-blue)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare size={24} style={{ color: 'var(--electric-blue)' }} />}
        title="No conversations yet"
        description="Start a conversation with connected peers to begin encrypted messaging."
      />
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 260, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>CONVERSATIONS</div>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="pinc-input" placeholder="search..." style={{ paddingLeft: '1.75rem', fontSize: '0.75rem', width: '100%', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {conversations.map(conv => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setActiveConv(conv.id)}
              style={{
                padding: '0.875rem 1rem',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: activeConv === conv.id ? 'rgba(0,212,255,0.06)' : 'transparent',
                borderLeft: activeConv === conv.id ? '2px solid var(--electric-blue)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                  {conv.name || truncateId(conv.id)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {conv.unread_count > 0 && (
                    <span style={{ background: 'var(--electric-blue)', color: 'var(--bg-primary)', fontSize: '0.6rem', padding: '1px 6px', borderRadius: '9999px', fontWeight: 700 }}>
                      {conv.unread_count}
                    </span>
                  )}
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{timeAgo(conv.timestamp)}</span>
                </div>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {conv.last_message || 'No messages yet'}
              </div>
            </motion.div>
          ))}
        </div>
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <button className="pinc-btn" style={{ width: '100%', fontSize: '0.75rem' }}><Plus size={12} /> NEW CONVERSATION</button>
        </div>
      </div>

      {activeConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--neon-cyan)' }}>
                {activeConvData?.name || truncateId(activeConv)}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--neon-green)' }}>E2E encrypted</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="pinc-btn" style={{ padding: '0.3rem 0.6rem' }}><Phone size={13} /></button>
              <button className="pinc-btn" style={{ padding: '0.3rem 0.6rem' }}><Video size={13} /></button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2rem' }}>
                No messages yet. Send the first message to start the conversation.
              </div>
            )}
            {messages.map((msg, i) => {
              const time = new Date(msg.timestamp * 1000).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{ display: 'flex', justifyContent: 'flex-start' }}
                >
                  <div style={{ maxWidth: '70%', padding: '0.6rem 0.875rem', borderRadius: '12px 12px 12px 3px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--electric-blue)', marginBottom: '3px', fontFamily: 'monospace' }}>
                      {truncateId(msg.sender_id)}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{msg.content}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '3px', textAlign: 'right' }}>{time}</div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={msgEnd} />
          </div>
          <div style={{ padding: '0.875rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem' }}>
            <input
              className="pinc-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message... (E2E encrypted)"
              style={{ flex: 1 }}
            />
            <button className="pinc-btn pinc-btn-primary" onClick={sendMessage} style={{ padding: '0.5rem 1rem' }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Select a conversation
        </div>
      )}
    </div>
  );
}

function CallsTab() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<CallRecord[]>('cmd_get_call_history')
      .then(setCalls)
      .catch(() => setCalls([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 size={20} style={{ color: 'var(--electric-blue)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <EmptyState
        icon={<Phone size={24} style={{ color: 'var(--electric-blue)' }} />}
        title="No call history"
        description="Start voice or video calls with connected peers. Your call history will appear here."
      />
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '1rem' }}>RECENT CALLS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {calls.map((call, i) => {
          const DirIcon = call.direction === 'incoming' ? PhoneIncoming : call.direction === 'outgoing' ? PhoneOutgoing : PhoneMissed;
          const dirColor = call.direction === 'missed' ? 'var(--neon-red)' : call.direction === 'incoming' ? 'var(--neon-green)' : 'var(--electric-blue)';
          const durationMin = Math.floor(call.duration / 60);
          const durationSec = call.duration % 60;
          const durationStr = call.duration > 0 ? `${durationMin}:${durationSec.toString().padStart(2, '0')}` : '--';
          return (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="pinc-card"
              style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${dirColor}15`, border: `1px solid ${dirColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DirIcon size={16} style={{ color: dirColor }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                    {call.contact_name || truncateId(call.id)}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.6rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '1px 6px', borderRadius: '9999px', border: '1px solid var(--border)' }}>
                    {call.call_type === 'video' ? <Video size={9} /> : <Phone size={9} />}
                    {call.call_type}
                  </span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: dirColor, textTransform: 'capitalize' }}>{call.direction}</span>
                  <span>·</span>
                  <span>{durationStr}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{timeAgo(call.timestamp)}</div>
              </div>
              <button className="pinc-btn" style={{ padding: '0.3rem 0.6rem', flexShrink: 0 }}>
                <Phone size={12} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function CommunitiesTab() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<Community[]>('cmd_get_communities')
      .then(setCommunities)
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 size={20} style={{ color: 'var(--electric-blue)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <EmptyState
        icon={<Users size={24} style={{ color: 'var(--electric-blue)' }} />}
        title="No communities yet"
        description="Create or join communities to connect with groups of peers in the network."
      />
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>COMMUNITIES</div>
        <button className="pinc-btn pinc-btn-primary" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}>
          <Plus size={12} /> CREATE COMMUNITY
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {communities.map((community, i) => (
          <motion.div
            key={community.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="pinc-card"
            style={{ padding: '1.25rem', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(0,212,255,0.08)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hash size={18} style={{ color: 'var(--electric-blue)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {community.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.58rem', color: 'var(--neon-cyan)', background: 'rgba(0,212,255,0.08)', padding: '1px 6px', borderRadius: '9999px', border: '1px solid rgba(0,212,255,0.15)' }}>
                    {community.type === 'public' ? <Globe size={8} /> : <Lock size={8} />}
                    {community.type}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Users size={9} />
                    {community.member_count}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {community.description || 'No description'}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StatusTab() {
  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [postInput, setPostInput] = useState('');

  useEffect(() => {
    invoke<StatusUpdate[]>('cmd_get_status_updates')
      .then(setStatuses)
      .catch(() => setStatuses([]))
      .finally(() => setLoading(false));
  }, []);

  const postStatus = async () => {
    if (!postInput.trim()) return;
    try {
      await invoke('cmd_post_status', { content: postInput.trim() });
      setPostInput('');
      const updated = await invoke<StatusUpdate[]>('cmd_get_status_updates').catch(() => []);
      setStatuses(updated);
    } catch (e) {
      console.error('Failed to post status:', e);
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '640px', margin: '0 auto' }}>
      <div className="pinc-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>POST STATUS</div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            className="pinc-input"
            value={postInput}
            onChange={e => setPostInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && postStatus()}
            placeholder="What's on your mind?"
            style={{ flex: 1, fontSize: '0.8rem' }}
          />
          <button
            className="pinc-btn pinc-btn-primary"
            onClick={postStatus}
            disabled={!postInput.trim()}
            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', opacity: postInput.trim() ? 1 : 0.4 }}
          >
            <Send size={13} /> POST
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={20} style={{ color: 'var(--electric-blue)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : statuses.length === 0 ? (
        <EmptyState
          icon={<Bell size={24} style={{ color: 'var(--electric-blue)' }} />}
          title="No status updates"
          description="Share a status update with your network. Updates will appear here for connected peers."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {statuses.map((status, i) => (
            <motion.div
              key={status.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="pinc-card"
              style={{ padding: '1rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.15))', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--neon-cyan)', fontFamily: 'monospace', fontWeight: 700 }}>
                  {truncateId(status.author_id).slice(-2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--neon-cyan)' }}>
                    {truncateId(status.author_id)}
                  </div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{timeAgo(status.timestamp)}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {status.content}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreificPage() {
  const [tab, setTab] = useState<Tab>('messages');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1rem 1.5rem 0', flexShrink: 0 }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>COMMUNICATION HUB</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>TREIFIC</div>
            <span className="badge badge-info">PHASE 5</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: tab === t.id ? 'rgba(0,212,255,0.1)' : 'transparent',
                border: tab === t.id ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
                color: tab === t.id ? 'var(--neon-cyan)' : 'var(--text-muted)',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'messages' && <MessagesTab />}
        {tab === 'calls' && <CallsTab />}
        {tab === 'communities' && <CommunitiesTab />}
        {tab === 'status' && <StatusTab />}
      </div>
    </div>
  );
}
