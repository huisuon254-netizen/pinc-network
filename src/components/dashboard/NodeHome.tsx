import { motion } from 'framer-motion';
import { Shield, Cpu, HardDrive, Network, Lock, Activity, Wallet, Swords, Server, Briefcase, Globe, Trophy, Users } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface StatCard { label: string; value: string; sub?: string; color: string; icon: React.ReactNode; glow?: boolean; }

function StatCard({ label, value, sub, color, icon, glow }: StatCard) {
  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      className="pinc-card" style={{ position:'relative', overflow:'hidden' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em' }}>{label}</div>
        <div style={{ color }}>{icon}</div>
      </div>
      <div style={{ fontSize:'1.4rem', fontWeight:700, color, fontFamily:'monospace', letterSpacing:'0.05em' }}
        className={glow ? 'glow-blue' : ''}>{value}</div>
      {sub && <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'0.25rem' }}>{sub}</div>}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg, ${color}44, ${color}88, ${color}44)` }} />
    </motion.div>
  );
}

export default function NodeHome() {
  const { identity, nodeStatus } = useAppStore();
  const nodeId = identity?.node_id ?? '—';

  return (
    <div style={{ padding:'2rem', maxWidth:'1100px' }}>
      {/* Header */}
      <div style={{ marginBottom:'2rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>PINC COMMAND CENTER</div>
        <div style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--text-primary)' }}>Welcome back</div>
      </div>

      {/* IDENTITY CARD */}
      <div className="pinc-card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'1rem' }}>IDENTITY CARD</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'1rem' }}>
          <div>
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>USER ID</div>
            <div style={{ fontFamily:'monospace', fontSize:'0.75rem', color:'var(--neon-cyan)', wordBreak:'break-all' }}>{nodeId}</div>
          </div>
          <div>
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>USERNAME</div>
            <div style={{ fontSize:'0.85rem', color:'var(--text-primary)', fontWeight:600 }}>pinc_user</div>
          </div>
          <div>
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>REPUTATION</div>
            <div style={{ fontSize:'0.85rem', color:'var(--neon-green)', fontWeight:600 }}>0</div>
          </div>
          <div>
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>GLOBAL RANK</div>
            <div style={{ fontSize:'0.85rem', color:'var(--soft-purple)', fontWeight:600 }}>—</div>
          </div>
          <div>
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>COUNTRY RANK</div>
            <div style={{ fontSize:'0.85rem', color:'var(--soft-purple)', fontWeight:600 }}>—</div>
          </div>
        </div>
      </div>

      {/* EARNINGS SUMMARY */}
      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>EARNINGS SUMMARY</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
        <StatCard label="WALLET BALANCE" value="$0.00" color="var(--neon-green)" icon={<Wallet size={14}/>} />
        <StatCard label="TOTAL EARNINGS" value="$0.00" color="var(--electric-blue)" icon={<Wallet size={14}/>} />
        <StatCard label="NETWORK" value="$0.00" sub="STARTERAN" color="var(--neon-cyan)" icon={<Globe size={14}/>} />
        <StatCard label="SERVERS" value="$0.00" sub="RENTBIT" color="var(--soft-purple)" icon={<Server size={14}/>} />
        <StatCard label="JOBS" value="$0.00" color="var(--neon-yellow)" icon={<Briefcase size={14}/>} />
        <StatCard label="WAGERS" value="$0.00" color="var(--neon-red)" icon={<Swords size={14}/>} />
      </div>

      {/* ACTIVITY SUMMARY */}
      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>ACTIVITY SUMMARY</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
        <StatCard label="CURRENT WAGERS" value="0" color="var(--neon-red)" icon={<Swords size={14}/>} />
        <StatCard label="ACTIVE JOBS" value="0" color="var(--neon-yellow)" icon={<Briefcase size={14}/>} />
        <StatCard label="SERVER RENTALS" value="0" color="var(--soft-purple)" icon={<Server size={14}/>} />
        <StatCard label="NETWORK SHARING" value="OFF" color="var(--text-muted)" icon={<Globe size={14}/>} />
      </div>

      {/* RANKING SUMMARY */}
      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>RANKING SUMMARY</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
        <StatCard label="TOTAL POINTS" value="0" color="var(--neon-green)" icon={<Trophy size={14}/>} />
        <StatCard label="GAMES WON" value="0" color="var(--neon-cyan)" icon={<Swords size={14}/>} />
        <StatCard label="GAMES DRAWN" value="0" color="var(--neon-yellow)" icon={<Activity size={14}/>} />
        <StatCard label="TOURNAMENT" value="—" color="var(--soft-purple)" icon={<Trophy size={14}/>} />
      </div>

      {/* Node Status */}
      <div className="pinc-card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em' }}>NODE STATUS</span>
          <span className={`badge ${nodeStatus?.online ? 'badge-online' : 'badge-offline'}`}>
            {nodeStatus?.online ? 'ONLINE' : 'LOCAL'}
          </span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'0.75rem' }}>
          <div style={{ padding:'0.5rem', background:'var(--bg-secondary)', borderRadius:'3px' }}>
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>PEERS</div>
            <div style={{ fontSize:'0.85rem', color:'var(--neon-cyan)', fontFamily:'monospace' }}>{nodeStatus?.peer_count ?? 0}</div>
          </div>
          <div style={{ padding:'0.5rem', background:'var(--bg-secondary)', borderRadius:'3px' }}>
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>VAULT FILES</div>
            <div style={{ fontSize:'0.85rem', color:'var(--neon-green)', fontFamily:'monospace' }}>{nodeStatus?.vault_file_count ?? 0}</div>
          </div>
          <div style={{ padding:'0.5rem', background:'var(--bg-secondary)', borderRadius:'3px' }}>
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>BANDWIDTH UP</div>
            <div style={{ fontSize:'0.85rem', color:'var(--electric-blue)', fontFamily:'monospace' }}>{nodeStatus?.bandwidth_up_kbps ?? 0} kbps</div>
          </div>
          <div style={{ padding:'0.5rem', background:'var(--bg-secondary)', borderRadius:'3px' }}>
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>BANDWIDTH DOWN</div>
            <div style={{ fontSize:'0.85rem', color:'var(--electric-blue)', fontFamily:'monospace' }}>{nodeStatus?.bandwidth_down_kbps ?? 0} kbps</div>
          </div>
        </div>
      </div>
    </div>
  );
}
