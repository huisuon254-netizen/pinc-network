import { motion } from 'framer-motion';
import { Shield, Cpu, HardDrive, Network, Lock, Activity } from 'lucide-react';
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
  const { identity, nodeStatus, startupReport } = useAppStore();

  const checks = startupReport?.checks ?? [];
  const allPassed = startupReport?.all_passed ?? false;

  return (
    <div style={{ padding:'2rem', maxWidth:'1000px' }}>
      {/* Header */}
      <div style={{ marginBottom:'2rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>NODE DASHBOARD</div>
        <div style={{ fontSize:'1.5rem', fontWeight:700, color:'var(--text-primary)' }}>
          {identity?.node_id ?? '—'}
        </div>
        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'0.25rem', fontFamily:'monospace' }}>
          {identity?.fingerprint ?? ''}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1rem', marginBottom:'2rem' }}>
        <StatCard label="IDENTITY STATUS" value="VERIFIED" sub="Ed25519 + BIP39" color="var(--neon-green)" icon={<Shield size={16}/>} />
        <StatCard label="ENCRYPTION" value="ACTIVE" sub="XChaCha20-Poly1305" color="var(--electric-blue)" icon={<Lock size={16}/>} glow />
        <StatCard label="PEER COUNT" value={String(nodeStatus?.peer_count ?? 0)} sub="Phase 3 — connecting" color="var(--soft-purple)" icon={<Network size={16}/>} />
        <StatCard label="VAULT FILES" value={String(nodeStatus?.vault_file_count ?? 0)} sub="encrypted local vault" color="var(--neon-cyan)" icon={<HardDrive size={16}/>} />
        <StatCard label="NODE STATUS" value={nodeStatus?.online ? 'ONLINE' : 'LOCAL'} sub={nodeStatus?.online ? 'mesh connected' : 'transport ready'} color={nodeStatus?.online ? 'var(--neon-green)' : 'var(--neon-yellow)'} icon={<Activity size={16}/>} />
        <StatCard label="CPU CORES" value={String(typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? '—' : '—')} sub="available threads" color="var(--text-secondary)" icon={<Cpu size={16}/>} />
      </div>

      {/* Startup diagnostics */}
      <div className="pinc-card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', letterSpacing:'0.12em' }}>STARTUP DIAGNOSTICS</span>
          <span className={`badge ${allPassed ? 'badge-online' : 'badge-offline'}`}>
            {allPassed ? '✓ ALL SYSTEMS OK' : '✗ DEGRADED'}
          </span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'0.5rem' }}>
          {checks.map((c) => (
            <div key={c.name} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.4rem 0.6rem',
              background:'var(--bg-secondary)', borderRadius:'3px', border:`1px solid ${c.passed ? 'rgba(57,255,20,0.2)' : 'rgba(255,34,85,0.2)'}` }}>
              <span style={{ color: c.passed ? 'var(--neon-green)' : 'var(--neon-red)', fontSize:'0.75rem' }}>{c.passed ? '✓' : '✗'}</span>
              <span style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Public key */}
      {identity && (
        <div className="pinc-card">
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.5rem' }}>PUBLIC KEY</div>
          <div style={{ fontFamily:'monospace', fontSize:'0.7rem', color:'var(--neon-cyan)', wordBreak:'break-all', lineHeight:1.6 }}>
            {identity.public_key}
          </div>
        </div>
      )}
    </div>
  );
}
