import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { Swords, Trophy, Users, Clock, DollarSign, Shield, Plus } from 'lucide-react';

type Tab = 'wagers' | 'tournaments' | 'create';

interface Wager { id: string; challenger_id: string; opponent_id: string; amount: number; game_type: string; status: string; referee_ids: string[]; expires_at: number | null; }

function WagerRow({ w }: { w: Wager }) {
  const statusColor = w.status === 'InProgress' ? 'var(--neon-yellow)' : w.status === 'Open' ? 'var(--neon-green)' : 'var(--electric-blue)';
  const timeLeft = w.expires_at ? (() => {
    const diff = w.expires_at - Date.now() / 1000;
    if (diff <= 0) return 'expired';
    if (diff < 3600) return `${Math.floor(diff/60)}m left`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h left`;
    return `${Math.floor(diff/86400)}d left`;
  })() : '';
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="pinc-card" style={{ marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
      <Swords size={16} style={{ color:'var(--soft-purple)', flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'0.78rem', color:'var(--text-primary)', marginBottom:'3px' }}>
          <span style={{ color:'var(--neon-cyan)', fontFamily:'monospace' }}>{w.challenger_id}</span>
          <span style={{ color:'var(--text-muted)', margin:'0 8px' }}>vs</span>
          <span style={{ color:'var(--electric-blue)', fontFamily:'monospace' }}>{w.opponent_id || '?'}</span>
        </div>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>
          {w.game_type} · {w.referee_ids.length} referees · {timeLeft}
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:'monospace', fontWeight:700, color:'var(--neon-green)' }}>{w.amount} PINC</div>
        <span className="badge" style={{ fontSize:'0.6rem', color:statusColor, border:`1px solid ${statusColor}33`, background:`${statusColor}11` }}>{w.status.replace('_',' ')}</span>
      </div>
      {w.status === 'Open' && <button className="pinc-btn" style={{ padding:'0.3rem 0.75rem', fontSize:'0.7rem' }}>ACCEPT</button>}
    </motion.div>
  );
}

function CreateWagerForm() {
  return (
    <div className="pinc-card" style={{ maxWidth:'520px' }}>
      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'1rem' }}>CREATE WAGER</div>
      <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        {[['OPPONENT NODE ID','PINC-XX-0000','text'],['GAME / CHALLENGE TYPE','Chess, Coding Race, Custom...','text'],['WAGER AMOUNT (PINC)','100','number'],['EXPIRES IN (HOURS)','48','number']].map(([l,p,t]) => (
          <div key={l}><label style={{ display:'block', fontSize:'0.62rem', color:'var(--text-muted)', marginBottom:'4px' }}>{l}</label>
          <input className="pinc-input" type={t} placeholder={p} /></div>
        ))}
        <div style={{ background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:'4px', padding:'0.75rem', fontSize:'0.72rem', color:'var(--text-secondary)', lineHeight:1.6 }}>
          <div style={{ marginBottom:'4px', color:'var(--soft-purple)', fontWeight:600 }}>REFEREE SYSTEM</div>
          Minimum 3 anonymous referees must be assigned before acceptance. Each referee stakes reputation. Majority vote determines outcome.
        </div>
        <button className="pinc-btn pinc-btn-primary"><Swords size={14}/> CREATE WAGER</button>
      </div>
    </div>
  );
}

export default function WagerPage() {
  const [tab, setTab] = useState<Tab>('wagers');
  const [wagers, setWagers] = useState<Wager[]>([]);

  useEffect(() => {
    invoke<Wager[]>('cmd_get_wagers').then(setWagers).catch(console.error);
  }, []);

  return (
    <div style={{ padding:'2rem', maxWidth:'900px' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>COMPETITIVE BETTING</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700 }}>Wagers & Tournaments</div>
          <span className="badge badge-pending">PHASE 10</span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
        {[{ l:'ACTIVE WAGERS', v:'3', c:'var(--soft-purple)' },{ l:'PRIZE POOLS', v:'7,500 PINC', c:'var(--neon-green)' },
          { l:'TOURNAMENTS', v:'2', c:'var(--neon-cyan)' },{ l:'MY WINS', v:'4', c:'var(--neon-yellow)' }].map(s => (
          <div key={s.l} className="pinc-card"><div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginBottom:'4px' }}>{s.l}</div>
          <div style={{ fontFamily:'monospace', fontSize:'1.1rem', fontWeight:700, color:s.c }}>{s.v}</div></div>
        ))}
      </div>

      <div style={{ display:'flex', gap:'4px', marginBottom:'1.5rem' }}>
        {[['wagers','WAGERS'],['tournaments','TOURNAMENTS'],['create','+ CREATE']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as Tab)}
            style={{ padding:'0.4rem 1rem', fontSize:'0.72rem', fontFamily:'monospace',
              background: tab===id ? 'rgba(168,85,247,0.15)' : 'transparent',
              border:`1px solid ${tab===id?'var(--soft-purple)':'var(--border)'}`,
              color: tab===id ? 'var(--soft-purple)':'var(--text-muted)',
              borderRadius:'4px', cursor:'pointer' }}>{label}</button>
        ))}
      </div>

      {tab === 'wagers' && wagers.map(w => <WagerRow key={w.id} w={w} />)}

      {tab === 'tournaments' && (
        <div className="pinc-card" style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <Trophy size={32} style={{ margin:'0 auto 1rem', opacity:0.3 }} />
          <div>No tournaments available</div>
        </div>
      )}

      {tab === 'create' && <CreateWagerForm />}
    </div>
  );
}
