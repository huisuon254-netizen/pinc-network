import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Activity, Server, Zap, Globe, Gauge, Loader2, Search } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface SpeedResult { download_kbps: number; upload_kbps: number; latency_ms: number; jitter_ms: number; }
interface ScanResult { component: string; status: string; details: string; }

export default function NetworkPage() {
  const { networkStatus, peers, refreshNetwork } = useAppStore();
  const [speedResult, setSpeedResult] = useState<SpeedResult | null>(null);
  const [speedTestRunning, setSpeedTestRunning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => { refreshNetwork(); const t = setInterval(refreshNetwork, 5000); return () => clearInterval(t); }, []);

  const online = networkStatus?.online ?? false;

  const runSpeedTest = async () => {
    setSpeedTestRunning(true);
    try {
      const result = await invoke<SpeedResult>('cmd_run_speed_test');
      setSpeedResult(result);
    } catch (e) { console.error(e); }
    finally { setSpeedTestRunning(false); }
  };

  const runSystemScan = async () => {
    setScanning(true);
    setScanResults([]);
    const results: ScanResult[] = [];
    const checks = [
      { component: 'Database', check: async () => { await invoke('cmd_get_node_status'); return 'Operational'; } },
      { component: 'Network', check: async () => { const s = await invoke<any>('cmd_get_network_status'); return s.online ? 'Online' : 'Offline'; } },
      { component: 'Vault', check: async () => { const f = await invoke<any[]>('cmd_list_vault'); return `${f.length} files stored`; } },
      { component: 'Peers', check: async () => { const p = await invoke<any[]>('cmd_get_peers'); return `${p.length} connected`; } },
      { component: 'Identity', check: async () => { const i = await invoke<any>('cmd_get_identity'); return i ? 'Verified' : 'Not found'; } },
      { component: 'Settings', check: async () => { await invoke('cmd_get_settings'); return 'Loaded'; } },
      { component: 'Balance', check: async () => { const b = await invoke<any>('cmd_get_wallet_balance'); return `${b.balance ?? 0} PINC`; } },
      { component: 'AI Agents', check: async () => { const a = await invoke<any[]>('cmd_get_ai_agents'); return `${a.length} agents`; } },
    ];
    for (const c of checks) {
      try {
        const details = await c.check();
        results.push({ component: c.component, status: 'OK', details });
      } catch (e) {
        results.push({ component: c.component, status: 'ERROR', details: String(e).slice(0, 80) });
      }
      setScanResults([...results]);
    }
    setScanning(false);
  };

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
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
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

      {/* Speed Test & System Scan */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
        <div className="pinc-card">
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>
            <Gauge size={12} style={{ display:'inline', marginRight:'6px' }}/>SPEED TEST
          </div>
          {speedResult ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
              {[
                { l:'Download', v:`${speedResult.download_kbps.toFixed(1)} kbps`, c:'var(--neon-green)' },
                { l:'Upload', v:`${speedResult.upload_kbps.toFixed(1)} kbps`, c:'var(--electric-blue)' },
                { l:'Latency', v:`${speedResult.latency_ms} ms`, c:'var(--neon-yellow)' },
                { l:'Jitter', v:`${speedResult.jitter_ms} ms`, c:'var(--neon-cyan)' },
              ].map(r => (
                <div key={r.l} style={{ padding:'0.5rem', background:'var(--bg-secondary)', borderRadius:'4px' }}>
                  <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>{r.l}</div>
                  <div style={{ fontFamily:'monospace', fontSize:'0.85rem', fontWeight:700, color:r.c }}>{r.v}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'1rem', color:'var(--text-muted)', fontSize:'0.72rem' }}>
              Run a speed test to measure network performance
            </div>
          )}
          <button className="pinc-btn" onClick={runSpeedTest} disabled={speedTestRunning}
            style={{ width:'100%', marginTop:'0.75rem', fontSize:'0.72rem' }}>
            {speedTestRunning ? <><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/> TESTING...</> : <><Gauge size={13}/> RUN SPEED TEST</>}
          </button>
        </div>

        <div className="pinc-card">
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>
            <Search size={12} style={{ display:'inline', marginRight:'6px' }}/>SYSTEM SCAN
          </div>
          {scanResults.length > 0 ? (
            <div style={{ maxHeight:'160px', overflow:'auto' }}>
              {scanResults.map(r => (
                <div key={r.component} style={{ display:'flex', justifyContent:'space-between', padding:'0.3rem 0', borderBottom:'1px solid var(--border)', fontSize:'0.7rem' }}>
                  <span style={{ color:'var(--text-secondary)' }}>{r.component}</span>
                  <span style={{ fontFamily:'monospace', color: r.status === 'OK' ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                    {r.status === 'OK' ? '✓' : '✗'} {r.details}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'1rem', color:'var(--text-muted)', fontSize:'0.72rem' }}>
              Scan all system components for issues
            </div>
          )}
          <button className="pinc-btn" onClick={runSystemScan} disabled={scanning}
            style={{ width:'100%', marginTop:'0.75rem', fontSize:'0.72rem' }}>
            {scanning ? <><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/> SCANNING...</> : <><Search size={13}/> RUN SYSTEM SCAN</>}
          </button>
        </div>
      </div>

      {/* Phase 3 notice */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
        style={{ background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:'6px', padding:'1.25rem', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.75rem', color:'var(--soft-purple)', fontWeight:600, marginBottom:'0.5rem' }}>◈ PHASE 3 — REAL MESH TRANSPORT</div>
        <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', lineHeight:1.7 }}>
          QUIC transport layer initialized. Peer discovery, NAT traversal, and relay routing activate when you connect to a bootstrap node.
        </div>
        <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem', flexWrap:'wrap' }}>
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
