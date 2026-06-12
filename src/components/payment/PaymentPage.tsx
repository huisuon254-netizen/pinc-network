import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Lock, Unlock, Send, RefreshCw, DollarSign } from 'lucide-react';

type Tab = 'overview' | 'send' | 'escrow' | 'history';

interface Tx { id: string; type: string; amount: number; from: string; status: string; date: string; memo: string; }

export default function PaymentPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [sendTo, setSendTo] = useState('');
  const [sendAmt, setSendAmt] = useState('');
  const [balance, setBalance] = useState(0);
  const [escrowed, setEscrowed] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);

  const available = balance - escrowed;

  useEffect(() => {
    invoke<any>('cmd_get_wallet_balance').then(data => {
      setBalance(data.balance ?? 0);
      setEscrowed(data.escrow_locked ?? 0);
    }).catch(console.error);
    invoke<any[]>('cmd_get_transactions').then(data => {
      setTxs(data.map((t: any) => ({
        id: t.id ?? '',
        type: t.type ?? 'sent',
        amount: t.amount ?? 0,
        from: t.from ?? '',
        status: t.status ?? 'confirmed',
        date: t.date ?? '',
        memo: t.memo ?? '',
      })));
    }).catch(console.error);
  }, []);

  function TxRow({ tx }: { tx: Tx }) {
    const isIn = tx.type === 'received';
    const isLocked = tx.type === 'escrow_lock';
    const color = isIn ? 'var(--neon-green)' : isLocked ? 'var(--neon-yellow)' : 'var(--neon-red)';
    const icon = isIn ? <ArrowDown size={14}/> : isLocked ? <Lock size={14}/> : <ArrowUp size={14}/>;
    return (
      <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.75rem 0', borderBottom:'1px solid var(--border)' }}>
        <div style={{ width:32, height:32, borderRadius:'50%', background:`${color}15`, border:`1px solid ${color}33`,
          display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>{icon}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'0.8rem', color:'var(--text-primary)' }}>{tx.memo}</div>
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'2px', fontFamily:'monospace' }}>
            {tx.type === 'received' ? `from ${tx.from}` : `to network`} · {tx.date}
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'0.875rem', fontWeight:700, fontFamily:'monospace', color }}>
            {isIn ? '+' : isLocked ? '🔒' : '-'}{tx.amount} PINC
          </div>
          <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:'2px' }}>{tx.status}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:'2rem', maxWidth:'800px' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>PAYMENT & ESCROW</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700 }}>Wallet</div>
          <span className="badge badge-pending">PHASE 7</span>
        </div>
      </div>

      {/* Balance cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { l:'TOTAL BALANCE', v:`${balance.toFixed(2)}`, unit:'PINC', c:'var(--electric-blue)' },
          { l:'AVAILABLE', v:`${available.toFixed(2)}`, unit:'PINC', c:'var(--neon-green)' },
          { l:'IN ESCROW', v:`${escrowed.toFixed(2)}`, unit:'PINC', c:'var(--neon-yellow)' },
        ].map(s => (
          <div key={s.l} className="pinc-card border-glow-blue">
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginBottom:'8px', letterSpacing:'0.1em' }}>{s.l}</div>
            <div style={{ fontSize:'1.6rem', fontWeight:700, fontFamily:'monospace', color:s.c }}>{s.v}</div>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'2px' }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'1.5rem' }}>
        {(['overview','send','escrow','history'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'0.4rem 1rem', fontSize:'0.72rem', fontFamily:'monospace', letterSpacing:'0.06em',
              background: tab === t ? 'rgba(0,212,255,0.1)' : 'transparent',
              border: `1px solid ${tab === t ? 'var(--electric-blue)' : 'var(--border)'}`,
              color: tab === t ? 'var(--electric-blue)' : 'var(--text-muted)',
              borderRadius:'4px', cursor:'pointer' }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div className="pinc-card">
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>QUICK ACTIONS</div>
            {[
              { label:'SEND PINC', icon:<Send size={14}/>, color:'var(--electric-blue)' },
              { label:'LOCK ESCROW', icon:<Lock size={14}/>, color:'var(--neon-yellow)' },
              { label:'DEPOSIT', icon:<ArrowDown size={14}/>, color:'var(--neon-green)' },
              { label:'WITHDRAW', icon:<ArrowUp size={14}/>, color:'var(--text-secondary)' },
            ].map(a => (
              <button key={a.label} className="pinc-btn" onClick={() => setTab('send')}
                style={{ width:'100%', marginBottom:'0.5rem', color:a.color, borderColor:`${a.color}55` }}>
                {a.icon}{a.label}
              </button>
            ))}
          </div>
          <div className="pinc-card">
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>RECENT ACTIVITY</div>
            {txs.slice(0,3).map(tx => <TxRow key={tx.id} tx={tx} />)}
          </div>
        </div>
      )}

      {tab === 'send' && (
        <div className="pinc-card" style={{ maxWidth:'480px' }}>
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'1rem' }}>SEND PINC</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={{ display:'block', fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.4rem' }}>RECIPIENT NODE ID</label>
              <input className="pinc-input" value={sendTo} onChange={e=>setSendTo(e.target.value)} placeholder="PINC-XX-0000" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.4rem' }}>AMOUNT (PINC)</label>
              <input className="pinc-input" type="number" value={sendAmt} onChange={e=>setSendAmt(e.target.value)} placeholder="0.00" />
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'4px' }}>Available: {available.toFixed(2)} PINC</div>
            </div>
            <div style={{ background:'rgba(255,230,0,0.06)', border:'1px solid rgba(255,230,0,0.2)', borderRadius:'4px', padding:'0.75rem', fontSize:'0.72rem', color:'var(--neon-yellow)' }}>
              ⚠ Recipient must confirm before funds are released. Dispute window: 24 hours.
            </div>
            <button className="pinc-btn pinc-btn-primary"><Send size={14}/> SEND (REQUIRES CONFIRMATION)</button>
          </div>
        </div>
      )}

      {tab === 'escrow' && (
        <div className="pinc-card">
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>ACTIVE ESCROWS</div>
          <div style={{ padding:'0.875rem', background:'var(--bg-secondary)', borderRadius:'4px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:'0.8rem', color:'var(--text-primary)' }}>Job: Rust QUIC module</div>
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>Locked with PINC-BB-0017 · Milestone 1/3</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'monospace', color:'var(--neon-yellow)', fontWeight:700 }}>250 PINC</div>
              <div style={{ display:'flex', gap:'6px', marginTop:'6px' }}>
                <button className="pinc-btn" style={{ padding:'0.2rem 0.6rem', fontSize:'0.65rem' }}><Unlock size={11}/> RELEASE</button>
                <button className="pinc-btn pinc-btn-danger" style={{ padding:'0.2rem 0.6rem', fontSize:'0.65rem' }}>DISPUTE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="pinc-card">
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>TRANSACTION HISTORY</div>
            <button className="pinc-btn" style={{ padding:'0.2rem 0.6rem', fontSize:'0.65rem' }}><RefreshCw size={11}/></button>
          </div>
          {txs.map(tx => <TxRow key={tx.id} tx={tx} />)}
        </div>
      )}
    </div>
  );
}
