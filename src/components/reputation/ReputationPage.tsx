import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { Star, Shield, Zap, TrendingUp, AlertTriangle, Award } from 'lucide-react';

interface ScoreBar { label: string; value: number; color: string; }

function ScoreBar({ label, value, color }: ScoreBar) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
        <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontFamily:'monospace', fontSize:'0.72rem', color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div style={{ height:'6px', background:'var(--bg-elevated)', borderRadius:'3px', overflow:'hidden' }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${value * 100}%` }} transition={{ duration:0.8, delay:0.1 }}
          style={{ height:'100%', background:color, borderRadius:'3px', boxShadow:`0 0 6px ${color}` }} />
      </div>
    </div>
  );
}

export default function ReputationPage() {
  const [rep, setRep] = useState({ relay:0, job:0, payment:0, dispute:0, uptime:0, total:0, reviews:0, disputes:0, won:0 });

  useEffect(() => {
    invoke<any>('cmd_get_reputation', { nodeId: 'self' }).then(data => {
      setRep({
        relay: data.relay_score ?? 0,
        job: data.job_score ?? 0,
        payment: data.payment_score ?? 0,
        dispute: data.dispute_score ?? 0,
        uptime: data.uptime_score ?? 0,
        total: data.total_score ?? 0,
        reviews: data.reviews ?? 0,
        disputes: data.disputes ?? 0,
        won: data.won ?? 0,
      });
    }).catch(console.error);
  }, []);

  return (
    <div style={{ padding:'2rem', maxWidth:'800px' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>TRUST ENGINE</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700 }}>Reputation & Trust</div>
          <span className="badge badge-info">PHASE 8</span>
        </div>
      </div>

      {/* Big score */}
      <div className="pinc-card border-glow-blue" style={{ textAlign:'center', padding:'2.5rem', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'1rem' }}>COMPOSITE TRUST SCORE</div>
        <motion.div initial={{ scale:0.5, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:'spring', damping:10 }}
          style={{ fontSize:'4rem', fontWeight:900, fontFamily:'monospace', color:'var(--neon-cyan)' }} className="glow-cyan">
          {(rep.total * 100).toFixed(0)}
        </motion.div>
        <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.5rem' }}>out of 100</div>
        <div style={{ display:'flex', justifyContent:'center', gap:'1.5rem', marginTop:'1.5rem' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'monospace', fontSize:'1.1rem', color:'var(--neon-green)' }}>{rep.reviews}</div>
            <div style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>REVIEWS</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'monospace', fontSize:'1.1rem', color:'var(--neon-yellow)' }}>{rep.disputes}</div>
            <div style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>DISPUTES</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'monospace', fontSize:'1.1rem', color:'var(--neon-cyan)' }}>{rep.won}</div>
            <div style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>WON</div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <div className="pinc-card">
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'1.25rem' }}>SCORE BREAKDOWN</div>
          <ScoreBar label="Relay Quality"    value={rep.relay}   color="var(--electric-blue)" />
          <ScoreBar label="Job Completion"   value={rep.job}     color="var(--neon-cyan)" />
          <ScoreBar label="Payment Reliability" value={rep.payment} color="var(--neon-green)" />
          <ScoreBar label="Dispute Record"   value={rep.dispute} color="var(--soft-purple)" />
          <ScoreBar label="Node Uptime"      value={rep.uptime}  color="var(--neon-yellow)" />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div className="pinc-card">
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>TRUST BADGES</div>
            {[
              { icon:<Award size={14}/>, label:'Top Relay Node', color:'var(--neon-yellow)', desc:'Top 10% uptime' },
              { icon:<Shield size={14}/>, label:'Verified Identity', color:'var(--neon-green)', desc:'Device fingerprint confirmed' },
              { icon:<Zap size={14}/>, label:'Fast Responder', color:'var(--electric-blue)', desc:'&lt;100ms avg latency' },
            ].map(b => (
              <div key={b.label} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.5rem 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ color:b.color }}>{b.icon}</div>
                <div>
                  <div style={{ fontSize:'0.75rem', color:b.color }}>{b.label}</div>
                  <div style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="pinc-card">
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>BURN PROTECTION</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', lineHeight:1.7 }}>
              Account is in good standing. Three violations within 30 days triggers automatic review. Permanent burns require majority referee consensus.
            </div>
            <div style={{ display:'flex', gap:'6px', marginTop:'0.75rem' }}>
              <div style={{ height:'4px', flex:1, borderRadius:'2px', background:'var(--neon-green)' }} />
              <div style={{ height:'4px', flex:1, borderRadius:'2px', background:'var(--neon-green)' }} />
              <div style={{ height:'4px', flex:1, borderRadius:'2px', background:'var(--bg-elevated)' }} />
            </div>
            <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:'4px' }}>0 of 3 warnings</div>
          </div>
        </div>
      </div>
    </div>
  );
}
