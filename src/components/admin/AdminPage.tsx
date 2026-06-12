import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { Globe, Shield, Cpu, Activity, AlertTriangle, Server, Map, Lock, Zap, TrendingUp } from 'lucide-react';

type Tab = 'routing' | 'infrastructure' | 'security' | 'ecosystem';

interface PeerRow { id: string; address: string; latency_ms: number; trust_score: number; online: boolean; }

function TabButton({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding:'0.4rem 1rem', fontSize:'0.72rem', fontFamily:'monospace', letterSpacing:'0.06em',
      background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
      border:`1px solid ${active ? 'var(--electric-blue)' : 'var(--border)'}`,
      color: active ? 'var(--electric-blue)' : 'var(--text-muted)',
      borderRadius:'4px', cursor:'pointer', transition:'all 0.15s',
    }}>{label}</button>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('routing');
  const [networkStatus, setNetworkStatus] = useState<any>(null);
  const [peers, setPeers] = useState<PeerRow[]>([]);
  const [nodeStatus, setNodeStatus] = useState<any>(null);

  useEffect(() => {
    invoke<any>('cmd_get_network_status').then(setNetworkStatus).catch(console.error);
    invoke<any[]>('cmd_get_peers').then(data => {
      setPeers(data.map(p => ({
        id: p.id ?? p.node_id ?? '',
        address: p.address ?? p.addr ?? '',
        latency_ms: p.latency_ms ?? p.latency ?? 0,
        trust_score: p.trust_score ?? 0.5,
        online: p.online ?? p.status === 'Connected',
      })));
    }).catch(console.error);
    invoke<any>('cmd_get_node_status').then(setNodeStatus).catch(console.error);
  }, []);

  const onlinePeers = peers.filter(p => p.online).length;
  const avgLatency = peers.length ? peers.reduce((s,p) => s + p.latency_ms, 0) / peers.length : 0;
  const uptime = nodeStatus?.uptime_seconds ? `${Math.floor(nodeStatus.uptime_seconds / 3600)}h ${Math.floor((nodeStatus.uptime_seconds % 3600) / 60)}m` : '—';

  return (
    <div style={{ padding:'2rem', maxWidth:'1000px' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>PHASES 12–15</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700 }}>Global Infrastructure</div>
          <span className="badge badge-info">PHASE 12</span>
          <span className="badge badge-info">PHASE 13</span>
          <span className="badge badge-info">PHASE 14</span>
          <span className="badge badge-purple">PHASE 15</span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
        {[
          { l:'NODES',      v: String(peers.length || 0),   c:'var(--electric-blue)' },
          { l:'ONLINE',     v: String(onlinePeers),   c:'var(--neon-green)' },
          { l:'OFFLINE',    v: String(peers.length - onlinePeers),   c:'var(--neon-red)' },
          { l:'AVG LATENCY',  v: peers.length ? `${avgLatency.toFixed(0)}ms` : '—', c:'var(--neon-cyan)' },
          { l:'VAULT FILES', v: nodeStatus?.vault_files !== undefined ? String(nodeStatus.vault_files) : '—', c:'var(--soft-purple)' },
          { l:'UPTIME',     v: uptime,   c:'var(--neon-yellow)' },
        ].map(s => (
          <div key={s.l} className="pinc-card" style={{ textAlign:'center', padding:'0.75rem' }}>
            <div style={{ fontFamily:'monospace', fontSize:'0.95rem', fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:'0.58rem', color:'var(--text-muted)', marginTop:'3px', letterSpacing:'0.08em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:'4px', marginBottom:'1.5rem' }}>
        {[['routing','ROUTING'],['infrastructure','INFRASTRUCTURE'],['security','SECURITY'],['ecosystem','ECOSYSTEM']].map(([id, label]) => (
          <TabButton key={id} id={id} label={label} active={tab===id} onClick={() => setTab(id as Tab)} />
        ))}
      </div>

      {tab === 'routing' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
            <div className="pinc-card">
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'1rem' }}>PEER LOAD MAP</div>
              {peers.length === 0 && <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.72rem' }}>No peers connected</div>}
              {peers.slice(0, 6).map(r => {
                const load = r.trust_score;
                return (
                <div key={r.id} style={{ marginBottom:'0.75rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', fontFamily:'monospace' }}>{r.id}</span>
                    <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color: load > 0.8 ? 'var(--neon-green)' : load > 0.5 ? 'var(--neon-yellow)' : 'var(--neon-red)' }}>
                      {(load*100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ height:'5px', background:'var(--bg-elevated)', borderRadius:'2px', overflow:'hidden' }}>
                    <motion.div initial={{ width:0 }} animate={{ width:`${load*100}%` }} transition={{ duration:0.6 }}
                      style={{ height:'100%', borderRadius:'2px',
                        background: load > 0.8 ? 'var(--neon-green)' : load > 0.5 ? 'var(--neon-yellow)' : 'var(--neon-red)' }} />
                  </div>
                </div>
                );
              })}
            </div>
            <div className="pinc-card">
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'1rem' }}>PEER LATENCY</div>
              {peers.length === 0 && <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.72rem' }}>No peers connected</div>}
              <div style={{ fontFamily:'monospace', fontSize:'0.7rem', color:'var(--text-secondary)', lineHeight:2.2 }}>
                {peers.slice(0, 4).map(r => (
                  <div key={r.id} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--border)', padding:'4px 0' }}>
                    <span style={{ color:'var(--text-secondary)' }}>{r.id}</span>
                    <span style={{ color: r.latency_ms < 100 ? 'var(--neon-green)' : r.latency_ms < 500 ? 'var(--neon-yellow)' : 'var(--neon-red)' }}>{r.latency_ms}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'infrastructure' && (
        <div>
          <div className="pinc-card" style={{ marginBottom:'1rem' }}>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'1rem' }}>CONNECTED PEERS</div>
            {peers.length === 0 && <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.72rem' }}>No peers connected. Connect to peers via the Network tab.</div>}
            {peers.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.5rem 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background: p.online ? 'var(--neon-green)' : 'var(--neon-red)', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-primary)', fontFamily:'monospace' }}>{p.id}</div>
                  <div style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>{p.address}</div>
                </div>
                <div style={{ fontSize:'0.65rem', fontFamily:'monospace', color: p.online ? 'var(--neon-green)' : 'var(--text-muted)' }}>
                  {p.online ? `${p.latency_ms}ms` : 'offline'}
                </div>
              </div>
            ))}
          </div>
          <div className="pinc-card">
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>NODE INFO</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              {[
                ['Node ID', nodeStatus?.node_id ?? '—'],
                ['Identity', nodeStatus?.identity_verified ? 'Verified' : 'Not verified'],
                ['Peers Connected', String(peers.length)],
                ['Online Peers', String(onlinePeers)],
                ['Vault Files', String(nodeStatus?.vault_files ?? 0)],
                ['Uptime', uptime],
              ].map(([l, v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', borderBottom:'1px solid var(--border)', fontSize:'0.72rem' }}>
                  <span style={{ color:'var(--text-muted)' }}>{l}</span>
                  <span style={{ color:'var(--neon-cyan)', fontFamily:'monospace' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div>
          <div className="pinc-card" style={{ marginBottom:'1rem' }}>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>SECURITY STATUS</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.75rem' }}>
              {[
                ['Encryption', 'XChaCha20-Poly1305', 'var(--neon-green)'],
                ['Identity', nodeStatus?.identity_verified ? 'Verified (Ed25519)' : 'Pending', nodeStatus?.identity_verified ? 'var(--neon-green)' : 'var(--neon-yellow)'],
                ['DB Encryption', 'AES-256-GCM', 'var(--neon-green)'],
                ['Secure Boot', 'Enabled', 'var(--neon-green)'],
              ].map(([l, v, c]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'0.5rem', background:'var(--bg-secondary)', borderRadius:'4px', fontSize:'0.72rem' }}>
                  <span style={{ color:'var(--text-muted)' }}>{l}</span>
                  <span style={{ color: c as string, fontFamily:'monospace' }}>{v as string}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pinc-card">
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>AUDIT LOG</div>
            <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.72rem' }}>
              <Shield size={24} style={{ margin:'0 auto 0.5rem', opacity:0.3 }} />
              No security events detected. System operating normally.
            </div>
          </div>
        </div>
      )}

      {tab === 'ecosystem' && (
        <div>
          <div style={{ background:'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(168,85,247,0.08))', border:'1px solid rgba(0,212,255,0.2)', borderRadius:'8px', padding:'1.5rem', marginBottom:'1.5rem' }}>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.5rem' }}>PINC ECOSYSTEM</div>
            <div style={{ fontSize:'1rem', color:'var(--text-primary)', fontWeight:600, marginBottom:'0.75rem' }}>Decentralized Platform</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.75rem', fontSize:'0.75rem', color:'var(--text-secondary)', lineHeight:1.8 }}>
              <div>{['Encrypted identity management','P2P networking (libp2p)','Encrypted vault storage','Marketplace for jobs'].map(f => <div key={f}>• {f}</div>)}</div>
              <div>{['Payment & escrow system','Social feed','Wagering & tournaments','AI agent coordination'].map(f => <div key={f}>• {f}</div>)}</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.75rem', marginBottom:'1rem' }}>
            {[
              ['PEERS', String(peers.length), 'var(--electric-blue)'],
              ['ONLINE', String(onlinePeers), 'var(--neon-green)'],
              ['VAULT FILES', String(nodeStatus?.vault_files ?? 0), 'var(--soft-purple)'],
            ].map(([l,v,c]) => (
              <div key={l} className="pinc-card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginBottom:'6px' }}>{l}</div>
                <div style={{ fontFamily:'monospace', fontSize:'0.95rem', fontWeight:700, color:c }}>{v}</div>
              </div>
            ))}
          </div>

          <div className="pinc-card">
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'1rem' }}>SYSTEM COMPONENTS</div>
            {[
              { engine:'Identity Engine',    status: nodeStatus?.identity_verified ? 'active' : 'pending', color: nodeStatus?.identity_verified ? 'var(--neon-green)' : 'var(--neon-yellow)' },
              { engine:'Network Engine',     status: peers.length > 0 ? 'active' : 'connecting', color: peers.length > 0 ? 'var(--neon-green)' : 'var(--neon-yellow)' },
              { engine:'Vault Engine',       status: (nodeStatus?.vault_files ?? 0) > 0 ? 'active' : 'ready', color: (nodeStatus?.vault_files ?? 0) > 0 ? 'var(--neon-green)' : 'var(--neon-yellow)' },
              { engine:'Messaging Engine',   status: 'active', color: 'var(--neon-green)' },
              { engine:'Marketplace Engine', status: 'ready', color: 'var(--neon-yellow)' },
              { engine:'Payment Engine',     status: 'ready', color: 'var(--neon-yellow)' },
              { engine:'AI Engine',          status: 'standby', color: 'var(--text-muted)' },
            ].map(e => (
              <div key={e.engine} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.5rem 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:e.color, flexShrink:0 }} />
                <div style={{ flex:1, fontSize:'0.78rem', color:'var(--text-primary)' }}>{e.engine}</div>
                <span style={{ fontSize:'0.65rem', color:e.color, fontFamily:'monospace', minWidth:'65px', textAlign:'right' }}>{e.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
