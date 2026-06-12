import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { Brain, Eye, Route, Shield, Zap, Activity, TrendingUp, Database } from 'lucide-react';

interface AgentCard { id: string; name: string; agent_type: string; active: boolean; accuracy: number; inferences_run: number; }

export default function AiPage() {
  const [agents, setAgents] = useState<AgentCard[]>([]);

  useEffect(() => {
    invoke<any[]>('cmd_get_ai_agents').then(data => {
      setAgents(data.map(a => ({
        id: a.id ?? '',
        name: a.name ?? '',
        agent_type: a.agent_type ?? '',
        active: a.active ?? false,
        accuracy: a.accuracy ?? 0,
        inferences_run: a.inferences_run ?? 0,
      })));
    }).catch(console.error);
  }, []);

  const activeCount = agents.filter(a => a.active).length;
  const avgAccuracy = agents.length ? agents.reduce((s,a) => s+a.accuracy, 0) / agents.length : 0;
  const totalInferences = agents.reduce((s,a) => s+a.inferences_run, 0);
  return (
    <div style={{ padding:'2rem', maxWidth:'900px' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>DISTRIBUTED INTELLIGENCE</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700 }}>AI Engine</div>
          <span className="badge badge-purple">PHASE 11</span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
        {[{ l:'AGENTS RUNNING', v:String(activeCount), c:'var(--neon-green)' },{ l:'INFERENCES TODAY', v:totalInferences > 1000 ? `${(totalInferences/1000).toFixed(0)}K` : String(totalInferences), c:'var(--electric-blue)' },
          { l:'FRAUD STOPPED', v:'0', c:'var(--neon-red)' },{ l:'AVG ACCURACY', v:`${(avgAccuracy*100).toFixed(0)}%`, c:'var(--neon-cyan)' }].map(s => (
          <div key={s.l} className="pinc-card"><div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginBottom:'4px' }}>{s.l}</div>
          <div style={{ fontFamily:'monospace', fontSize:'1.1rem', fontWeight:700, color:s.c }}>{s.v}</div></div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
        {agents.map((agent, i) => {
          const color = agent.active ? 'var(--neon-green)' : 'var(--text-muted)';
          const status = agent.active ? 'ACTIVE' : 'STANDBY';
          return (
          <motion.div key={agent.id || i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.06 }}
            className="pinc-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
              <div>
                <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-primary)' }}>{agent.name}</div>
                <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:'2px' }}>{agent.agent_type}</div>
              </div>
              <span className={`badge ${agent.active ? 'badge-online' : 'badge-info'}`} style={{ fontSize:'0.6rem' }}>
                {status}
              </span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
              <span style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>Accuracy</span>
              <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color }}>{(agent.accuracy*100).toFixed(0)}%</span>
            </div>
            <div style={{ height:'4px', background:'var(--bg-elevated)', borderRadius:'2px', marginBottom:'8px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${agent.accuracy*100}%`, background:color, borderRadius:'2px' }} />
            </div>
            <div style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>{agent.inferences_run.toLocaleString()} inferences</div>
          </motion.div>
          );
        })}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <div className="pinc-card">
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>DISTRIBUTED MODEL SHARDING</div>
          <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', lineHeight:1.7 }}>
            Large AI models are sharded across participating nodes. Each node hosts a portion and contributes compute during inference. Rewards are split proportionally by compute contributed.
          </div>
          <div style={{ display:'flex', gap:'4px', marginTop:'1rem' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ flex:1, height:'24px', borderRadius:'3px', background: i < 5 ? 'var(--electric-blue)' : 'var(--bg-elevated)',
                border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.55rem', color: i < 5 ? 'var(--bg-primary)' : 'var(--text-muted)' }}>S{i+1}</div>
            ))}
          </div>
          <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:'4px' }}>5/8 shards hosted locally</div>
        </div>
        <div className="pinc-card">
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>SMART CACHE PREDICTIONS</div>
          {[
            { file:'project_v2.zip', score:0.94, next:'2m' },
            { file:'model_weights.bin', score:0.87, next:'15m' },
            { file:'backup_2024.tar', score:0.61, next:'2h' },
          ].map(p => (
            <div key={p.file} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.4rem 0', borderBottom:'1px solid var(--border)' }}>
              <Database size={12} style={{ color:'var(--text-muted)', flexShrink:0 }} />
              <div style={{ flex:1, fontSize:'0.7rem', color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.file}</div>
              <div style={{ fontSize:'0.65rem', color:'var(--neon-cyan)' }}>{(p.score*100).toFixed(0)}%</div>
              <div style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>~{p.next}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
