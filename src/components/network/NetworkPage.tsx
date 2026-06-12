import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Activity, Server, Zap, Globe } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export default function NetworkPage() {
  const { networkStatus, peers, refreshNetwork } = useAppStore();

  useEffect(() => { refreshNetwork(); const t = setInterval(refreshNetwork, 5000); return () => clearInterval(t); }, []);

  const online = networkStatus?.online ?? false;

  return (
    <div style={{ padding:'2rem', maxWidth:'900px' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>MESH NETWORK</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--text-primary)' }}>Node Transport</div>
          <span className={`badge ${online ? 'badge-online' : 'badge-offline'}`}>
            {online ? '● ONLINE' : '○ OFFLINE'}
          </span>
          <span className="badge badge-purple">PHASE 3A</span>
        </div>
      </div>

      {/* Status cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'1rem', marginBottom:'2rem' }}>
        {[
          { l:'PEERS ONLINE',  v: String(networkStatus?.peer_count ?? 0),    c:'var(--soft-purple)', icon:<Server size={16}/> },
          { l:'RELAY NODES',   v: String(networkStatus?.relay_count ?? 0),   c:'var(--neon-cyan)',   icon:<Zap size={16}/> },
          { l:'UPLOAD',        v: `${(networkStatus?.bandwidth_up_kbps ?? 0).toFixed(0)} kbps`,   c:'var(--electric-blue)', icon:<Activity size={16}/> },
          { l:'DOWNLOAD',      v: `${(networkStatus?.bandwidth_down_kbps ?? 0).toFixed(0)} kbps`, c:'var(--neon-green)',    icon:<Globe size={16}/> },
        ].map(s => (
          <div key={s.l} className="pinc-card">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
              <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', letterSpacing:'0.1em' }}>{s.l}</div>
              <div style={{ color:s.c }}>{s.icon}</div>
            </div>
            <div style={{ fontSize:'1.3rem', fontWeight:700, color:s.c, fontFamily:'monospace' }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Phase 3 notice */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
        style={{ background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:'6px', padding:'1.25rem', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.75rem', color:'var(--soft-purple)', fontWeight:600, marginBottom:'0.5rem' }}>◈ PHASE 3 — REAL MESH TRANSPORT</div>
        <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', lineHeight:1.7 }}>
          QUIC transport layer (quinn 0.11) is initialized. Peer discovery, NAT traversal, and relay routing activate once you connect to a bootstrap node. Bootstrap node addresses are configurable in Settings → Network.
        </div>
        <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
          {['3A: QUIC Transport ✓', '3B: Peer Discovery', '3C: Relay Routing', '3D: Device Testing'].map((step, i) => (
            <div key={step} style={{ fontSize:'0.65rem', padding:'0.25rem 0.6rem', borderRadius:'3px',
              background: i === 0 ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${i === 0 ? 'rgba(57,255,20,0.3)' : 'var(--border)'}`,
              color: i === 0 ? 'var(--neon-green)' : 'var(--text-muted)' }}>
              {step}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Peer list */}
      <div className="pinc-card">
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'1rem' }}>CONNECTED PEERS</div>
        {peers.length === 0 ? (
          <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>
            <WifiOff size={24} style={{ margin:'0 auto 0.75rem', opacity:0.3 }} />
            <div style={{ fontSize:'0.8rem' }}>No peers connected</div>
            <div style={{ fontSize:'0.7rem', marginTop:'0.5rem', opacity:0.6 }}>Connect to a bootstrap node to discover peers</div>
          </div>
        ) : (
          peers.map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.6rem 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: p.online ? 'var(--neon-green)' : 'var(--neon-red)' }} />
              <div style={{ fontFamily:'monospace', fontSize:'0.75rem', color:'var(--neon-cyan)', flex:1 }}>{p.id}</div>
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{p.address}</div>
              <div style={{ fontSize:'0.65rem', color:'var(--neon-yellow)' }}>{p.latency_ms}ms</div>
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>trust: {(p.trust_score * 100).toFixed(0)}%</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
