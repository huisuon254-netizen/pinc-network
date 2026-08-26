import { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Send, MessageSquare, Search, User } from 'lucide-react';
import { usePolling } from '../hooks/usePolling';
import { useI18n } from '../../../i18n';
import type { ChatMessage } from '../../../types/sarai';

function pincIdFromNodeId(nodeId: string): string {
  const digits = nodeId.replace(/\D/g, '');
  if (digits.length >= 7) return `PINC-${digits.slice(0, 4)}-${digits.slice(4, 7)}`;
  return `PINC-${digits || nodeId}`;
}

export default function MessagesPage() {
  const { t } = useI18n();
  const [peerId, setPeerId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!peerId.trim()) return;
    try {
      const msgs = await invoke<any[]>('cmd_get_messages', { peerId: peerId.trim() });
      const normalized: ChatMessage[] = (Array.isArray(msgs) ? msgs : []).map((m: any) => ({
        id: m.id,
        conversation_id: m.conversation_id || m.conversationId || '',
        sender_id: m.sender_id || m.senderId || '',
        recipient_id: m.recipient_id || m.recipientId || '',
        content: m.content || '',
        status: m.status || 'Sent',
        timestamp: Number(m.timestamp ?? m.sent_at ?? m.sentAt ?? Date.now() / 1000),
        sent_at: Number(m.sent_at ?? m.timestamp ?? Date.now() / 1000),
      }));
      setMessages(normalized);
      setErr(null);
    } catch (e) {
      setErr(String(e));
    }
  };

  // initial + polling 3s when peer selected
  useEffect(() => {
    if (peerId.trim()) fetchMessages();
    else setMessages([]);
  }, [peerId]);

  usePolling(fetchMessages, 3000, !!peerId.trim(), [peerId]);

  // auto scroll
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!peerId.trim() || !input.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await invoke<any>('cmd_send_message', { peerId: peerId.trim(), content: input.trim() });
      // Optimistically append if backend returns message; else refetch
      if (res && res.id) {
        setMessages((prev) => [
          ...prev,
          {
            id: res.id,
            conversation_id: res.conversation_id || res.conversationId || '',
            sender_id: res.sender_id || res.senderId || 'self',
            recipient_id: res.recipient_id || res.recipientId || peerId.trim(),
            content: res.content || input.trim(),
            status: res.status || 'Sent',
            timestamp: Number(res.timestamp ?? res.sent_at ?? Date.now() / 1000),
          },
        ]);
      } else {
        await fetchMessages();
      }
      setInput('');
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  const filtered = search.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(search.toLowerCase()) || m.sender_id.toLowerCase().includes(search.toLowerCase()))
    : messages;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem', height: 'calc(100vh - 220px)', minHeight: 420 }}>
      {/* Peer selector / thread list */}
      <div className="pinc-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 0.75rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>{t('app.messages').toUpperCase()} — REAL POLLING 3s</div>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>PEER PINC ID</label>
          <input
            className="pinc-input"
            value={peerId}
            onChange={(e) => setPeerId(e.target.value.toUpperCase())}
            placeholder="PINC-0000-000"
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem' }}
          />
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Messages are synced live to your account.</div>
        </div>

        <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={12} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="pinc-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search in conversation" style={{ paddingLeft: '1.6rem', fontSize: '0.7rem' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              <MessageSquare size={20} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <div>{peerId ? 'No messages yet' : 'Enter a PINC ID to load conversation'}</div>
              <div style={{ fontSize: '0.6rem', marginTop: '0.25rem' }}>Polling every 3 seconds when peer is selected.</div>
            </div>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '0.5rem 0.6rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  fontSize: '0.7rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--electric-blue)', fontFamily: 'monospace', fontSize: '0.65rem' }}>{pincIdFromNodeId(m.sender_id)}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>{new Date(m.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{ color: 'var(--text-primary)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{m.status}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="pinc-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--electric-blue)' }}>
            <User size={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {peerId || '— Select peer'}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{messages.length} message{messages.length === 1 ? '' : 's'} · polling 3s</div>
          </div>
        </div>

        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--bg-secondary)' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '0.8rem' }}>{peerId ? 'Start the conversation' : 'Select a peer on the left'}</div>
              <div style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>Real messages from DB. No demo.</div>
            </div>
          ) : (
            messages.map((m) => {
              const isSelf = m.sender_id === 'self' || m.sender_id.includes('self') || m.sender_id === '' ? false : false;
              // Heuristic: if sender_id equals our own node, align right. Since we don't have own node here, use status or sender check via local identity?
              // For now, treat messages we sent (optimistic) as right-aligned if we just sent them.
              // We'll align by checking if content was just sent? Simpler: left align all but use color diff by status
              const mine = false; // keep simple: all left; could enhance with identity check via store
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    maxWidth: '78%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: mine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: mine ? 'var(--electric-blue)' : 'var(--bg-card)',
                    color: mine ? '#0a0a0f' : 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    fontSize: '0.78rem',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.content}
                  <div style={{ fontSize: '0.55rem', color: mine ? 'rgba(10,10,15,0.6)' : 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
                    {new Date(m.timestamp * 1000).toLocaleTimeString()} · {m.status}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-card)' }}>
          <input
            className="pinc-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={peerId ? 'Type a message…' : 'Select peer first'}
            disabled={!peerId.trim()}
            style={{ flex: 1, fontSize: '0.8rem' }}
          />
          <button
            className="pinc-btn pinc-btn-primary"
            onClick={send}
            disabled={loading || !peerId.trim() || !input.trim()}
            style={{ padding: '0.55rem 0.9rem', fontSize: '0.75rem', opacity: peerId.trim() && input.trim() ? 1 : 0.6 }}
          >
            <Send size={14} /> {t('app.send')}
          </button>
        </div>
        {err && <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.65rem', color: 'var(--neon-red)', borderTop: '1px solid var(--border)' }}>{err}</div>}
      </div>
    </div>
  );
}
