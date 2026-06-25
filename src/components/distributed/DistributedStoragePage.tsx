import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { Globe, Server, RefreshCw, Shield, HardDrive, Layers } from 'lucide-react';

interface StorageNode { id: string; address: string; free_space_bytes: number; reputation: number; online: boolean; uptime_pct: number; }

function NodeCard({ node }: { node: StorageNode }) {
  const freeGb = Math.round(node.free_space_bytes / (1024 * 1024 * 1024));
  return (
    <div className="pinc-card" style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background: node.online ? 'var(--neon-green)' : 'var(--neon-red)', flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:'monospace', fontSize:'0.75rem', color:'var(--neon-cyan)' }}>{node.id}</div>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'2px' }}>{node.address}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize:'0.75rem', color:'var(--text-primary)' }}>{freeGb} GB free</div>
        <div style={{ fontSize:'0.65rem', color: node.reputation > 0.9 ? 'var(--neon-green)' : 'var(--neon-yellow)', marginTop:'2px' }}>
          rep: {(node.reputation * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

export default function DistributedStoragePage() {
  const [replication, setReplication] = useState(3);
  const [nodes, setNodes] = useState<StorageNode[]>([]);

  useEffect(() => {
    invoke<any[]>('cmd_get_peers').then(data => {
      setNodes(data.map(p => ({
        id: p.id ?? '',
        address: p.address ?? '',
        free_space_bytes: 0,
        reputation: p.trust_score ?? 0.5,
        online: p.online ?? false,
        uptime_pct: 100,
      })));
    }).catch(console.error);
  }, []);

  const onlineNodes = nodes.filter(n => n.online).length;

  return (
    <div style={{ padding:'2rem', maxWidth:'900px' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>DISTRIBUTED STORAGE</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--text-primary)' }}>Distributed Storage</div>
          <span className="badge badge-purple">PHASE 4</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { l:'STORAGE NODES', v: String(onlineNodes), c:'var(--neon-cyan)', icon:<Server size={14}/> },
          { l:'REPLICATION', v: `×${replication}`, c:'var(--electric-blue)', icon:<Layers size={14}/> },
          { l:'FILES DISTRIBUTED', v:'0', c:'var(--soft-purple)', icon:<Globe size={14}/> },
          { l:'TOTAL FREE', v:`${nodes.filter(n=>n.online).reduce((s,n)=>s+Math.round(n.free_space_bytes/(1024*1024*1024)),0)} GB`, c:'var(--neon-green)', icon:<HardDrive size={14}/> },
        ].map(s => (
          <div key={s.l} className="pinc-card">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
              <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', letterSpacing:'0.1em' }}>{s.l}</div>
              <div style={{ color:s.c }}>{s.icon}</div>
            </div>
            <div style={{ fontSize:'1.2rem', fontWeight:700, color:s.c, fontFamily:'monospace' }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Replication control */}
      <div className="pinc-card" style={{ marginBottom:'1rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>REPLICATION FACTOR</div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <input type="range" min={1} max={10} value={replication} onChange={e => setReplication(Number(e.target.value))}
            style={{ flex:1, accentColor:'var(--electric-blue)' }} />
          <span style={{ fontFamily:'monospace', fontSize:'1rem', color:'var(--electric-blue)', minWidth:'30px' }}>×{replication}</span>
        </div>
        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.5rem' }}>
          Each file chunk will be stored on {replication} different nodes. Higher replication = more redundancy, more bandwidth.
        </div>
      </div>

      {/* Storage nodes */}
      <div className="pinc-card">
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em' }}>STORAGE NODES</div>
          <button className="pinc-btn" style={{ padding:'0.25rem 0.75rem', fontSize:'0.7rem' }}>
            <RefreshCw size={12} /> REFRESH
          </button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {nodes.map(n => <NodeCard key={n.id} node={n} />)}
        </div>
      </div>

      {/* Upload panel */}
      <div className="pinc-card" style={{ marginTop:'1rem', background:'rgba(0,212,255,0.04)', border:'1px dashed var(--electric-blue)', textAlign:'center', padding:'2rem' }}>
        <Shield size={24} style={{ margin:'0 auto 0.75rem', color:'var(--electric-blue)' }} />
        <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:'0.5rem' }}>Distribute a file across the mesh</div>
        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Requires active peer connections (Phase 3 network)</div>
        <button className="pinc-btn" style={{ marginTop:'1rem' }}>SELECT FILE TO DISTRIBUTE</button>
      </div>
    </div>
  );
}
