import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Copy, Check, Link2, Phone, Video, Send,
  Wifi, WifiOff, Shield, Clock, Users, MessageSquare,
  Scan, X, RefreshCw, ArrowRight, Zap
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface PairingCodeData {
  code: string;
  node_id: string;
  address: string;
  public_key: string;
  created_at: number;
  expires_at: number;
}

interface SharedConnection {
  id: string;
  peer_node_id: string;
  peer_address: string;
  connected_at: number;
  messages_exchanged: number;
  active: boolean;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: number[];
  content_hash: string;
  msg_type: string;
  status: string;
  sent_at: number;
}

type NetShareTab = 'connect' | 'connections' | 'chat';

export default function NetSharingPage() {
  const [tab, setTab] = useState<NetShareTab>('connect');
  const [pairingCode, setPairingCode] = useState<PairingCodeData | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [sharingActive, setSharingActive] = useState(false);
  const [connections, setConnections] = useState<SharedConnection[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const msgEnd = useRef<HTMLDivElement>(null);
  const peers = useAppStore(s => s.peers);
  const identity = useAppStore(s => s.identity);
  const myNodeId = identity?.node_id ?? '';

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConnections = () => {
    invoke<SharedConnection[]>('cmd_get_shared_connections').then(setConnections).catch(() => {});
  };

  useEffect(() => {
    loadConnections();
    invoke<boolean>('cmd_get_net_share_status').then(s => setSharingActive(s)).catch(() => {});
  }, []);

  const generateCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const code = await invoke<PairingCodeData>('cmd_generate_pairing_code');
      setPairingCode(code);
      setSharingActive(true);
      const qr = await invoke<string>('cmd_generate_qr_png', { data: JSON.stringify(code) });
      setQrBase64(qr);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const connectWithCode = async () => {
    if (!codeInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const conn = await invoke<SharedConnection>('cmd_connect_with_code', { code: codeInput.trim() });
      setConnections(prev => [...prev, conn]);
      setSelectedPeer(conn.peer_node_id);
      setTab('chat');
      setCodeInput('');
      loadConnections();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async (connId: string) => {
    try {
      await invoke('cmd_disconnect_shared', { connectionId: connId });
      setConnections(prev => prev.filter(c => c.id !== connId));
      if (selectedPeer === connections.find(c => c.id === connId)?.peer_node_id) {
        setSelectedPeer(null);
        setTab('connections');
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !selectedPeer) return;
    try {
      const msg = await invoke<Message>('cmd_send_message', { peerId: selectedPeer, content: msgInput.trim() });
      setMessages(prev => [...prev, msg]);
      setMsgInput('');
    } catch (e) {
      setError(String(e));
    }
  };

  const loadMessages = async (peerId: string) => {
    try {
      const msgs = await invoke<Message[]>('cmd_get_messages', { peerId });
      setMessages(msgs);
    } catch (e) {
      setMessages([]);
    }
  };

  useEffect(() => {
    if (selectedPeer) loadMessages(selectedPeer);
  }, [selectedPeer]);

  const startCall = (type: 'voice' | 'video') => {
    setCallType(type);
    setCallActive(true);
  };

  const endCall = () => {
    setCallActive(false);
  };

  const formatTime = (ts: number) => new Date(ts * 1000).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });

  const timeRemaining = (expiresAt: number) => {
    const diff = expiresAt - Date.now() / 1000;
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60);
    const secs = Math.floor(diff % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 0px)', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <div style={{ width: 260, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
            NET SHARING <span className="badge badge-info" style={{ marginLeft: 8 }}>PHASE 16</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {([['connect', 'Connect'], ['connections', 'Peers'], ['chat', 'Chat']] as [NetShareTab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '0.5rem', fontSize: '0.68rem', fontFamily: 'monospace',
              background: tab === id ? 'rgba(0,212,255,0.08)' : 'transparent',
              border: 'none', borderBottom: tab === id ? '2px solid var(--electric-blue)' : '2px solid transparent',
              color: tab === id ? 'var(--electric-blue)' : 'var(--text-muted)',
              cursor: 'pointer', letterSpacing: '0.06em',
            }}>{label}</button>
          ))}
        </div>

        {/* Connections list */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {connections.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              No connections yet. Generate a code or enter one to connect.
            </div>
          )}
          {connections.map(conn => (
            <div key={conn.id} onClick={() => { setSelectedPeer(conn.peer_node_id); setTab('chat'); }}
              style={{
                padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                background: selectedPeer === conn.peer_node_id ? 'rgba(0,212,255,0.06)' : 'transparent',
                borderLeft: selectedPeer === conn.peer_node_id ? '2px solid var(--electric-blue)' : '2px solid transparent',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: conn.active ? 'var(--neon-green)' : 'var(--text-muted)' }} />
                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--neon-cyan)' }}>
                  {conn.peer_node_id.slice(0, 12)}...
                </span>
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{conn.messages_exchanged} msgs</span>
                <button onClick={(e) => { e.stopPropagation(); disconnect(conn.id); }}
                  style={{ background: 'none', border: 'none', color: 'var(--neon-red)', cursor: 'pointer', fontSize: '0.6rem' }}>
                  disconnect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {/* CONNECT TAB */}
          {tab === 'connect' && (
            <motion.div key="connect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>

              {/* Sharing toggle */}
              <div className="pinc-card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Wifi size={18} style={{ color: sharingActive ? 'var(--neon-green)' : 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>Net Sharing</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {sharingActive ? 'Active — Accepting connections' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                  <button className={`pinc-btn ${sharingActive ? 'pinc-btn-danger' : 'pinc-btn-primary'}`}
                    onClick={() => setSharingActive(!sharingActive)} style={{ fontSize: '0.72rem' }}>
                    {sharingActive ? 'Stop' : 'Start'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Generate Code */}
                <div className="pinc-card">
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                    GENERATE PAIRING CODE
                  </div>

                  {pairingCode ? (
                    <div>
                      <div style={{
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '1.25rem', textAlign: 'center', marginBottom: '1rem',
                      }}>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          YOUR PAIRING CODE
                        </div>
                        <div style={{
                          fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700,
                          color: 'var(--electric-blue)', letterSpacing: '0.15em', marginBottom: '0.5rem',
                        }}>
                          {pairingCode.code}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Clock size={11} style={{ color: 'var(--neon-yellow)' }} />
                          <span style={{ fontSize: '0.62rem', color: 'var(--neon-yellow)' }}>
                            {timeRemaining(pairingCode.expires_at)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <button className="pinc-btn" onClick={copyCode} style={{ flex: 1, fontSize: '0.72rem' }}>
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                          {copied ? 'Copied!' : 'Copy Code'}
                        </button>
                        <button className="pinc-btn pinc-btn-primary" onClick={generateCode} style={{ fontSize: '0.72rem' }}>
                          <RefreshCw size={12} /> New
                        </button>
                      </div>

                      {/* QR Code */}
                      {qrBase64 && (
                        <div style={{ textAlign: 'center', padding: '1rem', background: '#fff', borderRadius: 8 }}>
                          <img src={`data:image/png;base64,${qrBase64}`} alt="QR Code"
                            style={{ width: 160, height: 160, imageRendering: 'pixelated' }} />
                          <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '0.5rem' }}>
                            Scan to connect
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <QrCode size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Generate a code to share with other devices
                      </div>
                      <button className="pinc-btn pinc-btn-primary" onClick={generateCode}
                        disabled={loading} style={{ fontSize: '0.75rem' }}>
                        {loading ? 'Generating...' : 'Generate Code'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Enter Code */}
                <div className="pinc-card">
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                    ENTER PAIRING CODE
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <input className="pinc-input" value={codeInput} onChange={e => setCodeInput(e.target.value)}
                      placeholder="PINC-XXXX-XXXX-XXXX" onKeyDown={e => e.key === 'Enter' && connectWithCode()}
                      style={{ fontFamily: 'monospace', fontSize: '1rem', textAlign: 'center', letterSpacing: '0.1em' }} />
                  </div>

                  {error && (
                    <div style={{ padding: '0.5rem', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
                      borderRadius: 4, fontSize: '0.7rem', color: 'var(--neon-red)', marginBottom: '1rem' }}>
                      {error}
                    </div>
                  )}

                  <button className="pinc-btn pinc-btn-primary" onClick={connectWithCode}
                    disabled={!codeInput.trim() || loading} style={{ width: '100%', fontSize: '0.75rem' }}>
                    {loading ? 'Connecting...' : <><Link2 size={13} /> Connect</>}
                  </button>

                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>HOW IT WORKS</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: 'var(--electric-blue)', fontWeight: 700 }}>1</span>
                        Generate a code on your device
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ color: 'var(--electric-blue)', fontWeight: 700 }}>2</span>
                        Share the code or QR with peer
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--electric-blue)', fontWeight: 700 }}>3</span>
                        Peer enters code to connect
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* CONNECTIONS TAB */}
          {tab === 'connections' && (
            <motion.div key="connections" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
              <div className="pinc-card" style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                  SHARED CONNECTIONS
                </div>
                {connections.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    <Users size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                    No active connections. Use the Connect tab to pair with a device.
                  </div>
                ) : (
                  connections.map(conn => (
                    <div key={conn.id} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: conn.active ? 'var(--neon-green)' : 'var(--text-muted)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--neon-cyan)' }}>{conn.peer_node_id}</div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{conn.peer_address}</div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {conn.messages_exchanged} msgs · {formatTime(conn.connected_at)}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="pinc-btn" onClick={() => { setSelectedPeer(conn.peer_node_id); setTab('chat'); }}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.68rem' }}>
                          <MessageSquare size={12} /> Chat
                        </button>
                        <button className="pinc-btn" onClick={() => disconnect(conn.id)}
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.68rem', color: 'var(--neon-red)' }}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* CHAT TAB */}
          {tab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

              {/* Chat header */}
              {selectedPeer && (
                <div style={{
                  padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-green)' }} />
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--neon-cyan)' }}>{selectedPeer}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--neon-green)' }}>● connected · E2E encrypted</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="pinc-btn" onClick={() => startCall('voice')} style={{ padding: '0.3rem 0.6rem' }}>
                      <Phone size={13} />
                    </button>
                    <button className="pinc-btn" onClick={() => startCall('video')} style={{ padding: '0.3rem 0.6rem' }}>
                      <Video size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Call overlay */}
              <AnimatePresence>
                {callActive && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
                      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
                      padding: '2rem', textAlign: 'center', zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                      minWidth: 280,
                    }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {callType === 'voice' ? 'VOICE CALL' : 'VIDEO CALL'}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--neon-cyan)', marginBottom: '1rem' }}>
                      {selectedPeer?.slice(0, 16)}...
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      {callType === 'video' ? (
                        <div style={{
                          width: 200, height: 150, background: 'var(--bg-secondary)', borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid var(--border)',
                        }}>
                          <Video size={32} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      ) : (
                        <div style={{
                          width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-secondary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          margin: '0 auto', border: '2px solid var(--neon-green)',
                        }}>
                          <Phone size={24} style={{ color: 'var(--neon-green)' }} />
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                      <button className="pinc-btn" style={{ background: 'rgba(255,68,68,0.2)', color: 'var(--neon-red)', borderColor: 'var(--neon-red)' }}
                        onClick={endCall}>
                        <X size={14} /> End Call
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {!selectedPeer ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2rem' }}>
                    Select a peer from the Connections list to start chatting.
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2rem' }}>
                    No messages yet. Send the first message!
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const text = new TextDecoder().decode(new Uint8Array(msg.content));
                    const time = formatTime(msg.sent_at);
                    const mine = msg.sender_id === myNodeId;
                    return (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '70%', padding: '0.6rem 0.875rem',
                          borderRadius: mine ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                          background: mine ? 'rgba(0,212,255,0.15)' : 'var(--bg-card)',
                          border: `1px solid ${mine ? 'rgba(0,212,255,0.3)' : 'var(--border)'}`,
                        }}>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{text}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 3, textAlign: 'right' }}>{time}</div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={msgEnd} />
              </div>

              {/* Message input */}
              {selectedPeer && (
                <div style={{ padding: '0.875rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem' }}>
                  <input className="pinc-input" value={msgInput} onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message... (E2E encrypted)" style={{ flex: 1 }} />
                  <button className="pinc-btn pinc-btn-primary" onClick={sendMessage} style={{ padding: '0.5rem 1rem' }}>
                    <Send size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
