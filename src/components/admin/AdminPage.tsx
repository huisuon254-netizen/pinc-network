import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { Globe, Shield, Cpu, Activity, AlertTriangle, Server, Map, Lock, Zap, TrendingUp } from 'lucide-react';

type Tab = 'routing' | 'infrastructure' | 'security' | 'ecosystem';

interface PeerRow { id: string; address: string; latency_ms: number; trust_score: number; online: boolean; }

function SeverityBadge({ s }: { s: string }) {
  const map: Record<string, string> = { critical:'badge-offline', high:'badge-pending', medium:'badge-info', low:'badge-online' };
  return <span className={`badge ${map[s] || 'badge-info'}`} style={{ fontSize:'0.6rem' }}>{s.toUpperCase()}</span>;
}

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

  useEffect(() => {
    invoke<any>('cmd_get_network_status').then(setNetworkStatus).catch(console.error);
    invoke<any[]>('cmd_get_peers').then(data => {
      setPeers(data.map(p => ({
        id: p.id ?? '',
        address: p.address ?? '',
        latency_ms: p.latency_ms ?? 0,
        trust_score: p.trust_score ?? 0,
        online: p.online ?? false,
      })));
    }).catch(console.error);
  }, []);

  return (
    <div style={{ padding:'2rem', maxWidth:'1000px' }}>
      {/* Header */}
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

      {/* Global stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
        {[
          { l:'NODES',      v: String(peers.length || 0),   c:'var(--electric-blue)' },
          { l:'ACTIVE',     v: String(peers.filter(p => p.online).length || 0),   c:'var(--neon-green)' },
          { l:'REGIONS',    v: String(new Set(peers.map(p => p.address.split(':')[0])).size || 0),        c:'var(--neon-cyan)' },
          { l:'BANDWIDTH',  v: networkStatus ? `${((networkStatus.bandwidth_up_kbps||0)/1000000).toFixed(1)} Tbps` : '—', c:'var(--soft-purple)' },
          { l:'STORAGE',    v:'—',    c:'var(--neon-yellow)' },
          { l:'UPTIME',     v: networkStatus?.online ? '99.97%' : '—',   c:'var(--neon-green)' },
        ].map(s => (
          <div key={s.l} className="pinc-card" style={{ textAlign:'center', padding:'0.75rem' }}>
            <div style={{ fontFamily:'monospace', fontSize:'0.95rem', fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:'0.58rem', color:'var(--text-muted)', marginTop:'3px', letterSpacing:'0.08em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'1.5rem' }}>
        {[['routing','ROUTING (P12)'],['infrastructure','INFRA (P13)'],['security','SECURITY (P14)'],['ecosystem','ECOSYSTEM (P15)']].map(([id, label]) => (
          <TabButton key={id} id={id} label={label} active={tab===id} onClick={() => setTab(id as Tab)} />
        ))}
      </div>

      {/* ROUTING TAB */}
      {tab === 'routing' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
            <div className="pinc-card">
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'1rem' }}>REGIONAL LOAD MAP</div>
              {peers.slice(0, 6).map(r => {
                const load = r.trust_score;
                return (
                <div key={r.id} style={{ marginBottom:'0.75rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>{r.address}</span>
                    <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color: load > 0.8 ? 'var(--neon-red)' : load > 0.6 ? 'var(--neon-yellow)' : 'var(--neon-green)' }}>
                      {(load*100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ height:'5px', background:'var(--bg-elevated)', borderRadius:'2px', overflow:'hidden' }}>
                    <motion.div initial={{ width:0 }} animate={{ width:`${load*100}%` }} transition={{ duration:0.6 }}
                      style={{ height:'100%', borderRadius:'2px',
                        background: load > 0.8 ? 'var(--neon-red)' : load > 0.6 ? 'var(--neon-yellow)' : 'var(--neon-green)' }} />
                  </div>
                </div>
                );
              })}
            </div>
            <div className="pinc-card">
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'1rem' }}>MULTI-HOP ROUTING</div>
              <div style={{ fontFamily:'monospace', fontSize:'0.7rem', color:'var(--text-secondary)', lineHeight:2.2 }}>
                {peers.slice(0, 4).map(r => (
                  <div key={r.id} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--border)', padding:'4px 0' }}>
                    <span style={{ color:'var(--text-secondary)' }}>{r.address}</span>
                    <span style={{ color:'var(--neon-cyan)' }}>{r.latency_ms}ms</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:'1rem', padding:'0.75rem', background:'rgba(0,212,255,0.06)', borderRadius:'4px', fontSize:'0.7rem', color:'var(--text-secondary)' }}>
                Dijkstra shortest-path routing active. AI route optimizer predicts bandwidth and selects optimal relay chains in real-time.
              </div>
            </div>
          </div>
          <div className="pinc-card">
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>NAT TRAVERSAL STATUS</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.75rem' }}>
              {[['STUN','Connected','var(--neon-green)'],['TURN','Standby','var(--neon-yellow)'],['ICE','Active','var(--neon-green)'],['UPnP','Enabled','var(--neon-green)']].map(([l,v,c]) => (
                <div key={l} style={{ background:'var(--bg-secondary)', borderRadius:'4px', padding:'0.75rem', textAlign:'center', border:`1px solid ${c}33` }}>
                  <div style={{ fontFamily:'monospace', fontSize:'0.75rem', color:c, fontWeight:700 }}>{l}</div>
                  <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginTop:'3px' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INFRASTRUCTURE TAB */}
      {tab === 'infrastructure' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'1rem', marginBottom:'1rem' }}>
            <div className="pinc-card">
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'1rem' }}>BOOTSTRAP NODES</div>
              {[
                { id:'boot-1', region:'US-East', nodes:4200, uptime:99.99, active:true },
                { id:'boot-2', region:'EU-West', nodes:3800, uptime:99.95, active:true },
                { id:'boot-3', region:'AP-SE',   nodes:2100, uptime:99.87, active:true },
                { id:'boot-4', region:'SA',      nodes:440,  uptime:98.90, active:false },
              ].map(b => (
                <div key={b.id} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.5rem 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: b.active ? 'var(--neon-green)' : 'var(--neon-red)', flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-primary)', fontFamily:'monospace' }}>{b.id} · {b.region}</div>
                    <div style={{ fontSize:'0.62rem', color:'var(--text-muted)' }}>{b.nodes.toLocaleString()} nodes served</div>
                  </div>
                  <div style={{ fontSize:'0.65rem', color: b.uptime > 99.9 ? 'var(--neon-green)' : 'var(--neon-yellow)' }}>{b.uptime}%</div>
                </div>
              ))}
            </div>
            <div className="pinc-card">
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'1rem' }}>DISTRIBUTED DNS</div>
              {[
                { name:'_pinc._udp.pinc.network', type:'SRV', ttl:300 },
                { name:'bootstrap.pinc.network', type:'A', ttl:60 },
                { name:'relay.pinc.network', type:'TXT', ttl:600 },
                { name:'stun.pinc.network', type:'A', ttl:300 },
              ].map(r => (
                <div key={r.name} style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', borderBottom:'1px solid var(--border)', fontSize:'0.7rem' }}>
                  <span style={{ fontFamily:'monospace', color:'var(--neon-cyan)', maxWidth:'60%', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name}</span>
                  <div style={{ display:'flex', gap:'0.75rem' }}>
                    <span className="badge badge-info" style={{ fontSize:'0.58rem' }}>{r.type}</span>
                    <span style={{ color:'var(--text-muted)' }}>TTL:{r.ttl}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:'0.75rem', fontSize:'0.65rem', color:'var(--text-muted)' }}>
                Records are signed with Ed25519. Emergency recovery nodes hold backup signed snapshots.
              </div>
            </div>
          </div>
          <div className="pinc-card">
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>GLOBAL SCALING STATUS</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1rem' }}>
              {[
                { l:'CURRENT NODES', v:'11,460', target:'1,000,000', pct:1.1 },
                { l:'STORAGE USED', v:'48 PB', target:'1 EB', pct:4.8 },
                { l:'DAILY ACTIVE', v:'28,000', target:'1,000,000', pct:2.8 },
              ].map(s => (
                <div key={s.l} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', marginBottom:'6px' }}>{s.l}</div>
                  <div style={{ fontFamily:'monospace', fontSize:'1rem', color:'var(--electric-blue)', fontWeight:700 }}>{s.v}</div>
                  <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginTop:'2px' }}>target: {s.target}</div>
                  <div style={{ height:'3px', background:'var(--bg-elevated)', borderRadius:'2px', marginTop:'6px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${s.pct}%`, background:'var(--electric-blue)', borderRadius:'2px' }} />
                  </div>
                  <div style={{ fontSize:'0.58rem', color:'var(--text-muted)', marginTop:'2px' }}>{s.pct}% of target</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECURITY TAB */}
      {tab === 'security' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.75rem', marginBottom:'1rem' }}>
            {[
              { l:'EVENTS TODAY', v:'47',   c:'var(--neon-yellow)' },
              { l:'BLOCKED',      v:'41',   c:'var(--neon-green)' },
              { l:'CRITICAL',     v:'1',    c:'var(--neon-red)' },
              { l:'BURN QUEUE',   v:'3',    c:'var(--soft-purple)' },
            ].map(s => (
              <div key={s.l} className="pinc-card">
                <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginBottom:'4px' }}>{s.l}</div>
                <div style={{ fontFamily:'monospace', fontSize:'1.2rem', fontWeight:700, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div className="pinc-card" style={{ marginBottom:'1rem' }}>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>SECURITY EVENTS</div>
            <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.75rem' }}>
              <AlertTriangle size={24} style={{ margin:'0 auto 0.5rem', opacity:0.3 }} />
              No security events detected
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="pinc-card">
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>DDOS PROTECTION</div>
              {[['Rate Limit','1,000 req/s','active'],['Block Threshold','5,000 req/s','armed'],['Auto-Unblock','1 hour','enabled'],['Blocked IPs','3','active']].map(([l,v,s]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', borderBottom:'1px solid var(--border)', fontSize:'0.72rem' }}>
                  <span style={{ color:'var(--text-muted)' }}>{l}</span>
                  <span style={{ color:'var(--neon-green)', fontFamily:'monospace' }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="pinc-card">
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>HARDENING CONFIG</div>
              {[['Min TLS Version','TLS 1.3'],['Cert Pinning','Enabled'],['Max Message','64 KB'],['Audit Log','Active'],['Anomaly Detection','Active']].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', borderBottom:'1px solid var(--border)', fontSize:'0.72rem' }}>
                  <span style={{ color:'var(--text-muted)' }}>{l}</span>
                  <span style={{ color:'var(--neon-cyan)', fontFamily:'monospace' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ECOSYSTEM TAB */}
      {tab === 'ecosystem' && (
        <div>
          <div style={{ background:'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(168,85,247,0.08))', border:'1px solid rgba(0,212,255,0.2)', borderRadius:'8px', padding:'1.5rem', marginBottom:'1.5rem' }}>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.5rem' }}>PHASE 15 — FINAL VISION</div>
            <div style={{ fontSize:'1rem', color:'var(--text-primary)', fontWeight:600, marginBottom:'0.75rem' }}>PINC Global Ecosystem</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.75rem', fontSize:'0.75rem', color:'var(--text-secondary)', lineHeight:1.8 }}>
              <div>{['✓ Distributed mesh internet layer','✓ E2E encrypted communication','✓ Distributed vault & storage','✓ Remote work marketplace'].map(f => <div key={f}>{f}</div>)}</div>
              <div>{['✓ Non-custodial payment network','✓ Encrypted social network','✓ Distributed relay market','✓ Gaming & challenge ecosystem'].map(f => <div key={f}>{f}</div>)}</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.75rem', marginBottom:'1rem' }}>
            {[['PHASE','Current: 3 of 15','var(--electric-blue)'],['HEALTH','Healthy','var(--neon-green)'],['ACTIVE ENGINES','3 of 8','var(--soft-purple)']].map(([l,v,c]) => (
              <div key={l} className="pinc-card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginBottom:'6px' }}>{l}</div>
                <div style={{ fontFamily:'monospace', fontSize:'0.95rem', fontWeight:700, color:c }}>{v}</div>
              </div>
            ))}
          </div>

          <div className="pinc-card">
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'1rem' }}>ENGINE STATUS</div>
            {[
              { engine:'Identity Engine',    phase:1, status:'active',   color:'var(--neon-green)' },
              { engine:'Network Engine',     phase:3, status:'active',   color:'var(--neon-green)' },
              { engine:'Vault Engine',       phase:1, status:'active',   color:'var(--neon-green)' },
              { engine:'Distributed Vault',  phase:4, status:'ready',    color:'var(--neon-yellow)' },
              { engine:'Communication',      phase:5, status:'building', color:'var(--electric-blue)' },
              { engine:'Marketplace Engine', phase:6, status:'building', color:'var(--electric-blue)' },
              { engine:'Financial Engine',   phase:7, status:'planned',  color:'var(--text-muted)' },
              { engine:'AI Engine',          phase:11, status:'planned', color:'var(--text-muted)' },
            ].map(e => (
              <div key={e.engine} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.5rem 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:e.color, flexShrink:0 }} />
                <div style={{ flex:1, fontSize:'0.78rem', color:'var(--text-primary)' }}>{e.engine}</div>
                <span className="badge badge-purple" style={{ fontSize:'0.58rem' }}>P{e.phase}</span>
                <span style={{ fontSize:'0.65rem', color:e.color, fontFamily:'monospace', minWidth:'65px', textAlign:'right' }}>{e.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
