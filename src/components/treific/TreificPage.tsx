import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Video, Users, Search, Plus, Send, X, Loader2, Hash,
  Globe, Lock, ChevronRight, Clock, RefreshCcw, FileText,
  BookOpen, Megaphone, MessageCircle, UserX, Shield, Heart,
  BarChart2, TrendingUp, Eye, MoreHorizontal, Bookmark,
  Home, Radio, Camera, Play, ThumbsUp, Repeat2, Share2,
  Image, MapPin, Smile, Calendar, Bell, Film, Mic,
} from 'lucide-react';
import { CallPage } from '../messages/CallPage';

type Tab = 'chat' | 'call' | 'communities' | 'forums';

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'chat', label: 'CHAT', icon: <MessageSquare size={13} />, color: 'var(--electric-blue)' },
  { id: 'call', label: 'CALL', icon: <Phone size={13} />, color: 'var(--neon-green)' },
  { id: 'communities', label: 'COMMUNITIES', icon: <Users size={13} />, color: '#a78bfa' },
  { id: 'forums', label: 'FORUMS', icon: <Megaphone size={13} />, color: '#1d9bf0' },
];

function pincIdFromNodeId(nodeId: string): string {
  const digits = nodeId.replace(/\D/g, '');
  if (digits.length >= 7) return `pinc-${digits.slice(0, 5)}-${digits.slice(-2)}`;
  return `pinc-${digits || nodeId}`;
}

function truncateId(id: string): string {
  if (!id) return '---';
  if (id.length <= 10) return id;
  return `${id.slice(0, 5)}...${id.slice(-3)}`;
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

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

// ─── CHAT TAB ───────────────────────────────────────────────────────────────

function ChatTab() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStartChat, setShowStartChat] = useState(false);
  const [newContactId, setNewContactId] = useState('');
  const msgEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    invoke<any[]>('cmd_get_conversations')
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    invoke<any[]>('cmd_get_messages', { peerId: activeConv })
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [activeConv]);

  useEffect(() => {
    msgEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !activeConv) return;
    const content = input.trim();
    invoke<any>('cmd_send_message', { peerId: activeConv, content })
      .then(msg => setMessages(prev => [...prev, msg]))
      .catch(console.error);
    setInput('');
  };

  const startConversation = () => {
    if (!newContactId.trim()) return;
    const id = `conv-${Date.now()}`;
    const newConv = { id, name: newContactId.trim(), last_message: '', last_message_at: Math.floor(Date.now() / 1000), unread_count: 0 };
    setConversations(prev => [newConv, ...prev]);
    setActiveConv(id);
    setNewContactId('');
    setShowStartChat(false);
  };

  const activeConvData = conversations.find(c => c.id === activeConv);
  const filteredConvs = searchQuery
    ? conversations.filter(c => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={20} style={{ color: 'var(--electric-blue)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <div style={{ width: 280, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'var(--bg-secondary)' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={12} style={{ color: 'var(--electric-blue)' }} />
            MESSAGES
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="pinc-input" placeholder="Search conversations..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '1.75rem', fontSize: '0.75rem', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {conversations.length === 0 && !searchQuery ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              No conversations yet
            </div>
          ) : filteredConvs.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              No results found
            </div>
          ) : (
            filteredConvs.map(conv => (
              <div key={conv.id} onClick={() => setActiveConv(conv.id)} style={{
                padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                background: activeConv === conv.id ? 'rgba(0,212,255,0.06)' : 'transparent',
                borderLeft: activeConv === conv.id ? '2px solid var(--electric-blue)' : '2px solid transparent',
                transition: 'all 0.12s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                    {conv.name || truncateId(conv.id)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {conv.unread_count > 0 && (
                      <span style={{ background: 'var(--electric-blue)', color: 'var(--bg-primary)', fontSize: '0.55rem', padding: '1px 5px', borderRadius: '9999px', fontWeight: 700 }}>
                        {conv.unread_count}
                      </span>
                    )}
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{timeAgo(conv.last_message_at)}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.last_message || 'No messages yet'}
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <button className="pinc-btn pinc-btn-primary" onClick={() => setShowStartChat(true)} style={{ width: '100%', fontSize: '0.72rem' }}>
            <Plus size={12} /> START NEW CHAT
          </button>
        </div>
      </div>

      {/* Chat area or entry screen */}
      {activeConv && activeConvData ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Hash size={11} style={{ color: 'var(--electric-blue)' }} />
                {activeConvData.name || pincIdFromNodeId(truncateId(activeConv))}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--neon-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield size={8} /> E2E encrypted
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="pinc-btn" style={{ padding: '0.3rem 0.6rem', color: 'var(--neon-green)' }} title="Voice call"><Phone size={13} /></button>
              <button className="pinc-btn" style={{ padding: '0.3rem 0.6rem', color: 'var(--electric-blue)' }} title="Video call"><Video size={13} /></button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2rem' }}>
                Send the first message. End-to-end encrypted.
              </div>
            )}
            {messages.map((msg, i) => {
              const isSelf = msg.sender_id === activeConv;
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', justifyContent: isSelf ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '70%', padding: '0.6rem 0.875rem',
                    borderRadius: isSelf ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                    background: isSelf ? 'rgba(0,212,255,0.08)' : 'var(--bg-card)',
                    border: `1px solid ${isSelf ? 'var(--electric-blue)' : 'var(--border)'}`,
                  }}>
                    <div style={{ fontSize: '0.58rem', color: 'var(--electric-blue)', marginBottom: 2, fontFamily: 'monospace' }}>
                      {pincIdFromNodeId(msg.sender_id)}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{msg.content}</div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 2, textAlign: 'right' }}>{formatTimestamp(msg.timestamp)}</div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={msgEnd} />
          </div>
          <div style={{ padding: '0.875rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', background: 'var(--bg-secondary)' }}>
            <input className="pinc-input" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..." style={{ flex: 1 }} />
            <button className="pinc-btn pinc-btn-primary" onClick={sendMessage} style={{ padding: '0.5rem 1rem' }}>
              <Send size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,212,255,0.06)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={32} style={{ color: 'var(--electric-blue)' }} />
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>Your Messages</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 300, textAlign: 'center', lineHeight: 1.6 }}>
            Send private encrypted messages to a PINC ID or start a voice/video call.
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button className="pinc-btn pinc-btn-primary" onClick={() => setShowStartChat(true)} style={{ fontSize: '0.78rem', padding: '0.5rem 1.25rem' }}>
              <Plus size={14} /> Start Chat
            </button>
            <button className="pinc-btn" style={{ fontSize: '0.78rem', padding: '0.5rem 1.25rem', color: 'var(--neon-green)' }}>
              <Phone size={14} /> Start Call
            </button>
          </div>
        </div>
      )}

      {/* Start chat modal */}
      <AnimatePresence>
        {showStartChat && (
          <StartChatModal
            onClose={() => setShowStartChat(false)}
            onStart={(contactId) => {
              const id = `conv-${Date.now()}`;
              const newConv = { id, name: contactId, last_message: '', last_message_at: Math.floor(Date.now() / 1000), unread_count: 0 };
              setConversations(prev => [newConv, ...prev]);
              setActiveConv(id);
              setShowStartChat(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CALL TAB ────────────────────────────────────────────────────────────────

function CallTab() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [showCallUI, setShowCallUI] = useState(false);
  const [contactInput, setContactInput] = useState('');

  useEffect(() => {
    invoke<any[]>('cmd_get_call_history')
      .then(setCalls)
      .catch(() => setCalls([]))
      .finally(() => setLoading(false));
  }, []);

  const initiateCall = (contact: string, type: 'voice' | 'video') => {
    setActiveCall(contact);
    setCallType(type);
    setShowCallUI(true);
  };

  const endCall = () => {
    setActiveCall(null);
    setShowCallUI(false);
  };

  if (showCallUI && activeCall) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000' }}>
        <CallPage
          peerId={activeCall}
          onEnd={endCall}
          autoInitiate={callType === 'video' ? 'Video' : 'Voice'}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 size={20} style={{ color: 'var(--electric-blue)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800, margin: '0 auto', width: '100%' }}>
      {/* Quick dial */}
      <div className="pinc-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
          QUICK DIAL
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input className="pinc-input" value={contactInput} onChange={e => setContactInput(e.target.value)}
            placeholder="Enter PINC ID to call..." style={{ flex: 1, fontSize: '0.8rem' }}
            onKeyDown={e => e.key === 'Enter' && contactInput.trim() && initiateCall(contactInput.trim(), callType)} />
          <button className="pinc-btn" onClick={() => contactInput.trim() && initiateCall(contactInput.trim(), 'voice')}
            style={{ color: 'var(--neon-green)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Phone size={13} /> Voice
          </button>
          <button className="pinc-btn" onClick={() => contactInput.trim() && initiateCall(contactInput.trim(), 'video')}
            style={{ color: 'var(--electric-blue)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Video size={13} /> Video
          </button>
        </div>
      </div>

      {/* Recent calls */}
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Phone size={10} /> RECENT CALLS
      </div>
      {calls.length === 0 ? (
        <EmptyState icon={<Phone size={24} style={{ color: 'var(--neon-green)' }} />}
          title="No call history" description="Start a voice or video call with any PINC ID." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {calls.map((call, i) => {
            const DirIcon = call.direction === 'incoming' ? PhoneIncoming : call.direction === 'outgoing' ? PhoneOutgoing : PhoneMissed;
            const dirColor = call.direction === 'missed' ? 'var(--neon-red)' : call.direction === 'incoming' ? 'var(--neon-green)' : 'var(--electric-blue)';
            return (
              <motion.div key={call.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="pinc-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${dirColor}15`, border: `1px solid ${dirColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DirIcon size={16} style={{ color: dirColor }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--neon-cyan)', fontWeight: 600 }}>
                    {pincIdFromNodeId(call.contact)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: dirColor, textTransform: 'capitalize' }}>{call.direction}</span>
                    <span>·</span>
                    <span>{call.type}</span>
                    <span>·</span>
                    <span>{timeAgo(call.timestamp)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="pinc-btn" onClick={() => initiateCall(call.contact, 'voice')} style={{ padding: '0.3rem 0.5rem', color: 'var(--neon-green)' }}>
                    <Phone size={12} />
                  </button>
                  <button className="pinc-btn" onClick={() => initiateCall(call.contact, 'video')} style={{ padding: '0.3rem 0.5rem', color: 'var(--electric-blue)' }}>
                    <Video size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── COMMUNITIES TAB ────────────────────────────────────────────────────────

function CommunitiesTab() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('public');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [memberCommunities, setMemberCommunities] = useState<Set<string>>(new Set());

  useEffect(() => {
    invoke<any[]>('cmd_list_communities')
      .then(list => {
        setCommunities(list);
        setMemberCommunities(new Set(list.filter((c: any) => c.is_member).map((c: any) => c.id)));
      })
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCommunity) { setChannels([]); return; }
    invoke<any[]>('cmd_list_channels', { communityId: selectedCommunity.id })
      .then(setChannels)
      .catch(() => setChannels([]));
  }, [selectedCommunity]);

  const createCommunity = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await invoke('cmd_create_community', { name: newName.trim(), cType: newType, description: newDesc.trim() || undefined });
      setNewName(''); setNewType('public'); setNewDesc(''); setShowCreate(false);
      const updated = await invoke<any[]>('cmd_list_communities').catch(() => []);
      setCommunities(updated);
      setMemberCommunities(new Set(updated.filter((c: any) => c.is_member).map((c: any) => c.id)));
    } catch (e) { console.error('create community failed', e); }
    finally { setCreating(false); }
  };

  const joinCommunity = async (id: string) => {
    try {
      await invoke('cmd_join_community', { communityId: id });
      setMemberCommunities(prev => new Set(prev).add(id));
    } catch (e) { console.error('join failed', e); }
  };

  const leaveCommunity = async (id: string) => {
    try {
      await invoke('cmd_leave_community', { communityId: id });
      setMemberCommunities(prev => { const s = new Set(prev); s.delete(id); return s; });
    } catch (e) { console.error('leave failed', e); }
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !selectedCommunity) return;
    try {
      await invoke('cmd_create_channel', { communityId: selectedCommunity.id, name: newChannelName.trim() });
      setNewChannelName(''); setShowCreateChannel(false);
      const updated = await invoke<any[]>('cmd_list_channels', { communityId: selectedCommunity.id }).catch(() => []);
      setChannels(updated);
    } catch (e) { console.error('create channel failed', e); }
  };

  const filteredCommunities = searchQuery
    ? communities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : communities;

  if (selectedCommunity) {
    return (
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ width: 220, borderRight: '1px solid var(--border)', padding: '1rem', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <button onClick={() => setSelectedCommunity(null)} className="pinc-btn" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              ← Back
            </button>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedCommunity.name}</div>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>CHANNELS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: '0.75rem' }}>
            {channels.map((ch: any) => (
              <div key={ch.id} style={{ padding: '0.4rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Hash size={10} style={{ color: 'var(--electric-blue)' }} />
                {ch.name}
              </div>
            ))}
            {channels.length === 0 && (
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No channels yet</div>
            )}
          </div>
          <button className="pinc-btn" onClick={() => setShowCreateChannel(true)} style={{ width: '100%', fontSize: '0.65rem', padding: '0.3rem' }}>
            <Plus size={10} /> Add Channel
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Select a channel to view messages
        </div>

        {/* Create channel modal */}
        <AnimatePresence>
          {showCreateChannel && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="pinc-card" style={{ padding: '1.5rem', width: 340 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Create Channel</div>
                <input className="pinc-input" value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
                  placeholder="Channel name" style={{ width: '100%', marginBottom: '0.75rem', fontSize: '0.8rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowCreateChannel(false)} className="pinc-btn" style={{ fontSize: '0.7rem' }}>Cancel</button>
                  <button onClick={createChannel} className="pinc-btn pinc-btn-primary" disabled={!newChannelName.trim()} style={{ fontSize: '0.7rem' }}>Create</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 size={20} style={{ color: '#a78bfa', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={10} /> COMMUNITIES · {communities.length} total
        </div>
        <button className="pinc-btn pinc-btn-primary" onClick={() => setShowCreate(!showCreate)} style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem', color: '#a78bfa' }}>
          <Plus size={12} /> NEW COMMUNITY
        </button>
      </div>

      {/* Create community form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="pinc-card" style={{ marginBottom: '1rem', borderColor: '#a78bfa40' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a78bfa', marginBottom: '0.75rem' }}>Create New Community</div>
            <input placeholder="Community name" value={newName} onChange={e => setNewName(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.75rem', marginBottom: '0.5rem', boxSizing: 'border-box' }} />
            <select value={newType} onChange={e => setNewType(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.72rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="gaming">Gaming</option>
              <option value="coding">Coding</option>
              <option value="business">Business</option>
            </select>
            <textarea placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2}
              style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.75rem', marginBottom: '0.75rem', resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} className="pinc-btn" style={{ fontSize: '0.7rem' }}>Cancel</button>
              <button onClick={createCommunity} disabled={creating || !newName.trim()}
                className="pinc-btn pinc-btn-primary" style={{ fontSize: '0.7rem', color: '#a78bfa' }}>
                {creating ? 'Creating...' : 'Create Community'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={12} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="pinc-input" placeholder="Search communities..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '1.75rem', fontSize: '0.75rem', width: '100%', boxSizing: 'border-box' }} />
      </div>

      {/* Community grid */}
      {filteredCommunities.length === 0 ? (
        <EmptyState icon={<Users size={24} style={{ color: '#a78bfa' }} />}
          title="No communities found" description="Create or join a community to connect with peers." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {filteredCommunities.map((community, i) => {
            const isMember = memberCommunities.has(community.id);
            return (
              <motion.div key={community.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="pinc-card" style={{ padding: '1.1rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(167,139,250,0.08)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Hash size={18} style={{ color: '#a78bfa' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {community.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 2 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                        {community.type === 'public' ? <Globe size={8} /> : <Lock size={8} />}
                        {community.type}
                      </span>
                      <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Users size={8} /> {community.member_count} members
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {community.description || 'No description'}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {isMember ? (
                    <button onClick={(e) => { e.stopPropagation(); leaveCommunity(community.id); }}
                      className="pinc-btn" style={{ flex: 1, fontSize: '0.68rem', padding: '0.35rem', color: 'var(--neon-red)' }}>
                      <X size={10} /> Leave
                    </button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); joinCommunity(community.id); }}
                      className="pinc-btn" style={{ flex: 1, fontSize: '0.68rem', padding: '0.35rem', color: 'var(--neon-green)' }}>
                      <Plus size={10} /> Join
                    </button>
                  )}
                  <button onClick={() => setSelectedCommunity(community)}
                    className="pinc-btn" style={{ flex: 1, fontSize: '0.68rem', padding: '0.35rem', color: 'var(--electric-blue)' }}>
                    <MessageSquare size={10} /> View
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── FORUMS TAB (Twitter/X-style) ─────────────────────────────────────────

function ForumsTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postInput, setPostInput] = useState('');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [posting, setPosting] = useState(false);
  const [view, setView] = useState<'feed' | 'livestreams' | 'trending'>('feed');

  const loadPosts = async () => {
    setLoading(true);
    try {
      const result = await invoke<any[]>('cmd_get_forum_posts', { limit: 50 });
      setPosts(Array.isArray(result) ? result : []);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPosts(); }, []);

  useEffect(() => {
    if (!selectedPost) { setComments([]); return; }
    invoke<any[]>('cmd_get_forum_comments', { postId: selectedPost.id })
      .then(setComments)
      .catch(() => setComments([]));
  }, [selectedPost]);

  const createPost = async () => {
    if (!postInput.trim()) return;
    setPosting(true);
    try {
      const post = await invoke<any>('cmd_create_forum_post', {
        content: postInput.trim(), postType: 'text', visibility: 'public',
      });
      setPosts(prev => [post, ...prev]);
      setPostInput('');
    } catch (e) { console.error('post failed', e); }
    finally { setPosting(false); }
  };

  const createComment = async () => {
    if (!commentInput.trim() || !selectedPost) return;
    try {
      const comment = await invoke<any>('cmd_create_forum_comment', {
        postId: selectedPost.id, content: commentInput.trim(),
      });
      setComments(prev => [...prev, comment]);
      setCommentInput('');
    } catch (e) { console.error('comment failed', e); }
  };

  const likePost = async (postId: string) => {
    try {
      await invoke('cmd_like_forum_post', { postId });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: (p.like_count || 0) + 1 } : p));
    } catch {}
  };

  const displayedPosts = [...posts].sort((a, b) => {
    if (view === 'trending') return (b.like_count + b.reply_count * 2) - (a.like_count + a.reply_count * 2);
    return b.created_at - a.created_at;
  });

  const livestreams = posts.filter(p => p.post_type === 'livestream' || p.post_type === 'video');

  // Post detail view
  if (selectedPost) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-secondary)', flexShrink: 0 }}>
          <button onClick={() => setSelectedPost(null)} className="pinc-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>← Back</button>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)' }}>Post</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{comments.length} replies</div>
          </div>
        </div>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(29,155,240,0.1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#1d9bf0', fontFamily: 'monospace', fontWeight: 700 }}>
              {selectedPost.author_pinc_id?.slice(-2)?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>{selectedPost.display_name || pincIdFromNodeId(selectedPost.author_pinc_id)}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>@{selectedPost.author_pinc_id?.slice(0, 8) || 'anonymous'} · {timeAgo(selectedPost.created_at)}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedPost.content}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => likePost(selectedPost.id)} className="pinc-btn" style={{ padding: '0.25rem 0.55rem', color: '#ef4444', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Heart size={12} /> {selectedPost.like_count || 0}
            </button>
            <button className="pinc-btn" style={{ padding: '0.25rem 0.55rem', color: 'var(--electric-blue)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 3 }}>
              <MessageSquare size={12} /> {selectedPost.reply_count || 0}
            </button>
            <button className="pinc-btn" style={{ padding: '0.25rem 0.55rem', color: 'var(--neon-green)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Repeat2 size={12} /> Repost
            </button>
            <button className="pinc-btn" style={{ padding: '0.25rem 0.55rem', color: 'var(--text-muted)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Share2 size={12} /> Share
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>REPLIES</div>
          {comments.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2rem' }}>No replies yet. Start the conversation.</div>
          )}
          {comments.map((comment, i) => (
            <motion.div key={comment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              style={{ padding: '0.75rem 1rem', marginBottom: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(29,155,240,0.08)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: '#1d9bf0', fontFamily: 'monospace', fontWeight: 700 }}>
                  {comment.author_pinc_id?.slice(-2)?.toUpperCase() || '?'}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600 }}>{comment.display_name || pincIdFromNodeId(comment.author_pinc_id)}</span>
                <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>· {timeAgo(comment.created_at)}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5, paddingLeft: '2rem' }}>{comment.content}</div>
            </motion.div>
          ))}
        </div>
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', background: 'var(--bg-secondary)' }}>
          <input className="pinc-input" value={commentInput} onChange={e => setCommentInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createComment()}
            placeholder="Post your reply..." style={{ flex: 1 }} />
          <button className="pinc-btn pinc-btn-primary" onClick={createComment} style={{ padding: '0.5rem 1rem' }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top navigation: Feed | Live | Trending */}
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-card)', borderRadius: 6, padding: 2, border: '1px solid var(--border)' }}>
          {[
            { id: 'feed' as const, label: 'Feed', icon: <Home size={12} /> },
            { id: 'livestreams' as const, label: 'Live', icon: <Radio size={12} /> },
            { id: 'trending' as const, label: 'Trending', icon: <BarChart2 size={12} /> },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{
              flex: 1, padding: '0.4rem 0.75rem', borderRadius: 4, fontSize: '0.68rem', fontWeight: 600,
              background: view === v.id ? 'rgba(29,155,240,0.1)' : 'transparent',
              border: view === v.id ? '1px solid rgba(29,155,240,0.3)' : '1px solid transparent',
              color: view === v.id ? '#1d9bf0' : 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Post composer */}
      <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(29,155,240,0.1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', color: '#1d9bf0', fontFamily: 'monospace', fontWeight: 700 }}>
            U
          </div>
          <div style={{ flex: 1 }}>
            <textarea value={postInput} onChange={e => setPostInput(e.target.value)}
              placeholder="What's happening?" rows={2}
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'none', outline: 'none', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="pinc-btn" style={{ padding: '0.25rem', color: '#1d9bf0', background: 'none', border: 'none', cursor: 'pointer' }}><Image size={14} /></button>
                <button className="pinc-btn" style={{ padding: '0.25rem', color: '#1d9bf0', background: 'none', border: 'none', cursor: 'pointer' }}><Film size={14} /></button>
                <button className="pinc-btn" style={{ padding: '0.25rem', color: '#1d9bf0', background: 'none', border: 'none', cursor: 'pointer' }}><MapPin size={14} /></button>
                <button className="pinc-btn" style={{ padding: '0.25rem', color: '#1d9bf0', background: 'none', border: 'none', cursor: 'pointer' }}><Smile size={14} /></button>
                <button className="pinc-btn" style={{ padding: '0.25rem', color: '#1d9bf0', background: 'none', border: 'none', cursor: 'pointer' }}><Calendar size={14} /></button>
              </div>
              <button onClick={createPost} disabled={posting || !postInput.trim()}
                className="pinc-btn pinc-btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: 9999, background: '#1d9bf0', color: '#fff', border: 'none' }}>
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {view === 'livestreams' ? (
          <>
            {/* LIVE NOW banner */}
            <div className="pinc-card" style={{ margin: '0.75rem', padding: '1rem', background: 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(29,155,240,0.05))', border: '1px solid var(--neon-red)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-red)', animation: 'pulse 1.5s infinite' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--neon-red)' }}>LIVE NOW</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>PINC network livestreams and video content</div>
                </div>
              </div>
            </div>
            {livestreams.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Radio size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: '1rem' }} />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No live streams right now</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Start a livestream to share with the network</div>
                <button className="pinc-btn pinc-btn-primary" style={{ marginTop: '1rem', fontSize: '0.72rem' }}>
                  <Camera size={13} /> Go Live
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', padding: '0.75rem' }}>
                {livestreams.map((stream, i) => (
                  <motion.div key={stream.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="pinc-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ height: 140, background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <Play size={32} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <div style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.55rem', padding: '2px 6px', borderRadius: 3, background: 'var(--neon-red)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Radio size={8} /> LIVE
                      </div>
                    </div>
                    <div style={{ padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>{stream.content.slice(0, 60)}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{stream.author_pinc_id?.slice(0, 8)} · {stream.like_count || 0} viewers</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {/* Sponsored ad placement */}
            <div style={{ margin: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>SPONSORED</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Advertise on PINC Network — Reach decentralized users worldwide</div>
            </div>
          </>
        ) : loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 size={20} style={{ color: '#1d9bf0', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : displayedPosts.length === 0 ? (
          <EmptyState icon={<Megaphone size={24} style={{ color: '#1d9bf0' }} />}
            title="No posts yet" description="Be the first to share something on the PINC network." />
        ) : (
          displayedPosts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              onClick={() => setSelectedPost(post)}
              style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(29,155,240,0.1)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', color: '#1d9bf0', fontFamily: 'monospace', fontWeight: 700 }}>
                  {post.author_pinc_id?.slice(-2)?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{post.display_name || pincIdFromNodeId(post.author_pinc_id)}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>@{post.author_pinc_id?.slice(0, 8)} · {timeAgo(post.created_at)}</span>
                    {post.post_type === 'livestream' && <span style={{ fontSize: '0.55rem', padding: '1px 4px', borderRadius: 3, background: 'var(--neon-red)', color: '#fff' }}>LIVE</span>}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.5rem', whiteSpace: 'pre-wrap' }}>{post.content}</div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button onClick={(e) => { e.stopPropagation(); likePost(post.id); }} className="pinc-btn" style={{ padding: '0.2rem', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Heart size={13} /> {post.like_count || 0}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }} className="pinc-btn" style={{ padding: '0.2rem', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                      <MessageSquare size={13} /> {post.reply_count || 0}
                    </button>
                    <button className="pinc-btn" style={{ padding: '0.2rem', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Repeat2 size={13} /> Repost
                    </button>
                    <button className="pinc-btn" style={{ padding: '0.2rem', fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Share2 size={13} /> Share
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── MAIN TREIFIC PAGE ───────────────────────────────────────────────────

export default function TreificPage() {
  const [tab, setTab] = useState<Tab>('chat');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '0.75rem 1.25rem 0', flexShrink: 0, background: 'var(--bg-primary)' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} style={{ color: 'var(--electric-blue)' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>TREIFIC</div>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginTop: 2 }}>
            Encrypted messaging, calls, communities, and decentralized social
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600,
              letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.15s',
              background: tab === t.id ? `${t.color}12` : 'transparent',
              border: tab === t.id ? `1px solid ${t.color}40` : '1px solid transparent',
              color: tab === t.id ? t.color : 'var(--text-muted)',
            }}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'chat' && <ChatTab />}
        {tab === 'call' && <CallTab />}
        {tab === 'communities' && <CommunitiesTab />}
        {tab === 'forums' && <ForumsTab />}
      </div>
    </div>
  );
}

function StartChatModal({ onClose, onStart }: { onClose: () => void; onStart: (id: string) => void }) {
  const [inputVal, setInputVal] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [peers, setPeers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      invoke<any[]>('cmd_list_contacts').catch(() => []),
      invoke<any[]>('cmd_get_peers').catch(() => []),
    ]).then(([cList, pList]) => {
      setContacts(cList || []);
      setPeers(pList || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="pinc-card" style={{ padding: '1.5rem', width: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Start New Conversation</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
        <input className="pinc-input" value={inputVal} onChange={e => setInputVal(e.target.value)}
          placeholder="Enter PINC ID, username or node ID..." style={{ width: '100%', marginBottom: '0.75rem', fontSize: '0.8rem', boxSizing: 'border-box' }}
          onKeyDown={e => e.key === 'Enter' && inputVal.trim() && onStart(inputVal.trim())} />

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>SAVED CONTACTS & PEERS</div>
          {loading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Loading contacts...</div>
          ) : contacts.length === 0 && peers.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No saved contacts found. Enter a PINC ID above.</div>
          ) : (
            <>
              {contacts.map((c, i) => (
                <div key={`c-${i}`} onClick={() => onStart(c.pinc_id || c.name || c.id)} style={{
                  padding: '0.6rem 0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>{c.name || c.pinc_id}</div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--electric-blue)', fontFamily: 'monospace' }}>{c.pinc_id || c.node_id}</span>
                </div>
              ))}
              {peers.map((p, i) => (
                <div key={`p-${i}`} onClick={() => onStart(p.id)} style={{
                  padding: '0.6rem 0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--neon-green)', fontWeight: 600 }}>Node {p.id}</div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{p.address}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="pinc-btn" style={{ fontSize: '0.72rem' }}>Cancel</button>
          <button onClick={() => inputVal.trim() && onStart(inputVal.trim())} className="pinc-btn pinc-btn-primary" disabled={!inputVal.trim()} style={{ fontSize: '0.72rem' }}>
            <MessageSquare size={12} /> Start Chat
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

