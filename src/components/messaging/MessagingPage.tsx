import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { Send, Phone, Video, Lock, Search, Plus } from 'lucide-react';

interface Message { id: string; conversation_id: string; sender_id: string; recipient_id: string; content: number[]; content_hash: string; msg_type: string; status: string; sent_at: number; }
interface MockConv { id: string; name: string; nodeId: string; lastMsg: string; unread: number; online: boolean; }

const MOCK_CONVS: MockConv[] = [
  { id:'c1', name:'PINC-AA-0042', nodeId:'PINC-AA-0042', lastMsg:'Ready for the job?', unread:2, online:true },
  { id:'c2', name:'PINC-BB-0017', nodeId:'PINC-BB-0017', lastMsg:'Payment confirmed', unread:0, online:false },
  { id:'c3', name:'PINC-CC-0099', nodeId:'PINC-CC-0099', lastMsg:'File sent ✓', unread:0, online:true },
];

export default function MessagingPage() {
  const [activeConv, setActiveConv] = useState<string | null>('c1');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const msgEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  useEffect(() => {
    if (!activeConv) return;
    const conv = MOCK_CONVS.find(c => c.id === activeConv);
    if (!conv) return;
    invoke<Message[]>('cmd_get_messages', { peerId: conv.nodeId }).then(setMessages).catch(console.error);
  }, [activeConv]);

  const sendMsg = () => {
    if (!input.trim() || !activeConv) return;
    const conv = MOCK_CONVS.find(c => c.id === activeConv);
    if (!conv) return;
    const content = new TextEncoder().encode(input.trim());
    invoke<Message>('cmd_send_message', { peerId: conv.nodeId, content: input.trim() }).then(msg => {
      setMessages(prev => [...prev, msg]);
    }).catch(console.error);
    setInput('');
  };

  return (
    <div style={{ display:'flex', height:'calc(100vh - 0px)', overflow:'hidden' }}>
      {/* Sidebar */}
      <div style={{ width:'260px', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'1rem', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.5rem' }}>MESSAGES <span className="badge badge-purple" style={{ marginLeft:'8px' }}>PHASE 5</span></div>
          <div style={{ position:'relative' }}>
            <Search size={12} style={{ position:'absolute', left:'0.5rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
            <input className="pinc-input" placeholder="search peers..." style={{ paddingLeft:'1.75rem', fontSize:'0.75rem' }} />
          </div>
        </div>
        <div style={{ flex:1, overflow:'auto' }}>
          {MOCK_CONVS.map(conv => (
            <div key={conv.id} onClick={() => setActiveConv(conv.id)}
              style={{ padding:'0.875rem 1rem', cursor:'pointer', borderBottom:'1px solid var(--border)',
                background: activeConv === conv.id ? 'rgba(0,212,255,0.06)' : 'transparent',
                borderLeft: activeConv === conv.id ? '2px solid var(--electric-blue)' : '2px solid transparent' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'3px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background: conv.online ? 'var(--neon-green)' : 'var(--text-muted)' }} />
                  <span style={{ fontFamily:'monospace', fontSize:'0.72rem', color:'var(--neon-cyan)' }}>{conv.name}</span>
                </div>
                {conv.unread > 0 && <span style={{ background:'var(--electric-blue)', color:'var(--bg-primary)', fontSize:'0.6rem', padding:'1px 5px', borderRadius:'9999px', fontWeight:700 }}>{conv.unread}</span>}
              </div>
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.lastMsg}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:'0.75rem', borderTop:'1px solid var(--border)' }}>
          <button className="pinc-btn" style={{ width:'100%', fontSize:'0.75rem' }}><Plus size={12}/> NEW CONVERSATION</button>
        </div>
      </div>

      {/* Chat */}
      {activeConv ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          {/* Header */}
          <div style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--neon-green)' }} />
              <div>
                <div style={{ fontFamily:'monospace', fontSize:'0.8rem', color:'var(--neon-cyan)' }}>PINC-AA-0042</div>
                <div style={{ fontSize:'0.62rem', color:'var(--neon-green)' }}>● online · E2E encrypted</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <button className="pinc-btn" style={{ padding:'0.3rem 0.6rem' }}><Phone size={13}/></button>
              <button className="pinc-btn" style={{ padding:'0.3rem 0.6rem' }}><Video size={13}/></button>
              <button className="pinc-btn" style={{ padding:'0.3rem 0.6rem' }}><Lock size={13}/></button>
            </div>
          </div>
          {/* Messages */}
          <div style={{ flex:1, overflow:'auto', padding:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {messages.map((msg, i) => {
              const text = new TextDecoder().decode(new Uint8Array(msg.content));
              const time = new Date(msg.sent_at * 1000).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'});
              const mine = msg.sender_id === 'me';
              return (
              <motion.div key={msg.id} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.04 }}
                style={{ display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth:'70%', padding:'0.6rem 0.875rem', borderRadius: mine ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                  background: mine ? 'rgba(0,212,255,0.15)' : 'var(--bg-card)',
                  border: `1px solid ${mine ? 'rgba(0,212,255,0.3)' : 'var(--border)'}` }}>
                  <div style={{ fontSize:'0.82rem', color:'var(--text-primary)', lineHeight:1.5 }}>{text}</div>
                  <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginTop:'3px', textAlign:'right' }}>{time}</div>
                </div>
              </motion.div>
              );
            })}
            <div ref={msgEnd} />
          </div>
          {/* Input */}
          <div style={{ padding:'0.875rem', borderTop:'1px solid var(--border)', display:'flex', gap:'0.75rem' }}>
            <input className="pinc-input" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder="Type a message... (E2E encrypted)" style={{ flex:1 }} />
            <button className="pinc-btn pinc-btn-primary" onClick={sendMsg} style={{ padding:'0.5rem 1rem' }}><Send size={14}/></button>
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:'0.8rem' }}>Select a conversation</div>
      )}
    </div>
  );
}
