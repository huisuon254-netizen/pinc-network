import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Wifi, MemoryStick, Activity, Zap, Save, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { ResourceAllocation } from '../../types';

const PRIORITY_OPTIONS: { id: ResourceAllocation['priority']; label: string; desc: string }[] = [
  { id: 'realtime', label: 'REALTIME', desc: 'Lowest latency, highest resource usage' },
  { id: 'high', label: 'HIGH', desc: 'Prioritize this node over others' },
  { id: 'normal', label: 'NORMAL', desc: 'Balanced resource allocation' },
  { id: 'low', label: 'LOW', desc: 'Minimize resource usage, background only' },
];

function ResourceSlider({ label, icon, value, min, max, step, unit, color, onChange }: {
  label: string; icon: React.ReactNode; value: number; min: number; max: number; step: number;
  unit: string; color: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color }}>{icon}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{label}</span>
        </div>
        <span style={{ fontSize: '0.8rem', color, fontFamily: 'monospace', fontWeight: 600 }}>
          {value >= 1024 && unit === 'MB' ? `${(value / 1024).toFixed(1)} GB` : `${value} ${unit}`}
        </span>
      </div>
      <div style={{ position: 'relative', height: '28px' }}>
        <div style={{ position: 'absolute', top: '12px', left: 0, right: 0, height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px' }} />
        <div style={{ position: 'absolute', top: '12px', left: 0, width: `${pct}%`, height: '4px', background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: '2px' }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            appearance: 'none', background: 'transparent', cursor: 'pointer', margin: 0,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '2px' }}>
        <span>{min >= 1024 && unit === 'MB' ? `${(min / 1024).toFixed(0)} GB` : `${min} ${unit}`}</span>
        <span>{max >= 1024 && unit === 'MB' ? `${(max / 1024).toFixed(0)} GB` : `${max} ${unit}`}</span>
      </div>
    </div>
  );
}

export default function ResourcePage() {
  const { resources, updateResources } = useAppStore();
  const [local, setLocal] = useState<ResourceAllocation>({ ...resources });
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof ResourceAllocation>(k: K, v: ResourceAllocation[K]) =>
    setLocal(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    updateResources(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaults: ResourceAllocation = {
      cpuCores: 2, ramMb: 2048, bandwidthUpKbps: 10000, bandwidthDownKbps: 10000,
      storageGb: 10, relayCapacity: 50, maxConnections: 20, priority: 'normal',
    };
    setLocal(defaults);
  };

  const totalEst = (local.cpuCores * 250 + local.ramMb / 4 + local.bandwidthUpKbps / 10 + local.storageGb * 50);
  const loadPct = Math.min(100, Math.round((totalEst / 5000) * 100));

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>SYSTEM CONFIGURATION</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Resource Allocation</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="pinc-btn" onClick={handleReset} style={{ fontSize: '0.75rem' }}>
            <RotateCcw size={13} /> RESET
          </button>
          <button className="pinc-btn pinc-btn-primary" onClick={handleSave} style={{ fontSize: '0.75rem' }}>
            <Save size={13} /> {saved ? 'SAVED ✓' : 'APPLY'}
          </button>
        </div>
      </div>

      {/* Load estimate bar */}
      <div className="pinc-card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>ESTIMATED RESOURCE LOAD</span>
          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: loadPct > 80 ? 'var(--neon-red)' : loadPct > 50 ? 'var(--neon-yellow)' : 'var(--neon-green)' }}>
            {loadPct}%
          </span>
        </div>
        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${loadPct}%` }}
            style={{
              height: '100%', borderRadius: '3px',
              background: loadPct > 80 ? 'var(--neon-red)' : loadPct > 50 ? 'var(--neon-yellow)' : 'var(--neon-green)',
            }}
          />
        </div>
        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          Higher allocations increase node capability but consume more system resources.
        </div>
      </div>

      {/* Compute */}
      <div className="pinc-card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>COMPUTE</div>
        <ResourceSlider label="CPU Cores" icon={<Cpu size={14} />} value={local.cpuCores}
          min={1} max={16} step={1} unit="cores" color="var(--electric-blue)"
          onChange={v => set('cpuCores', v)} />
        <ResourceSlider label="RAM" icon={<MemoryStick size={14} />} value={local.ramMb}
          min={256} max={16384} step={256} unit="MB" color="var(--soft-purple)"
          onChange={v => set('ramMb', v)} />
      </div>

      {/* Network */}
      <div className="pinc-card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>NETWORK</div>
        <ResourceSlider label="Upload Bandwidth" icon={<Wifi size={14} />} value={local.bandwidthUpKbps}
          min={100} max={100000} step={100} unit="kbps" color="var(--neon-green)"
          onChange={v => set('bandwidthUpKbps', v)} />
        <ResourceSlider label="Download Bandwidth" icon={<Wifi size={14} />} value={local.bandwidthDownKbps}
          min={100} max={100000} step={100} unit="kbps" color="var(--neon-cyan)"
          onChange={v => set('bandwidthDownKbps', v)} />
        <ResourceSlider label="Relay Capacity" icon={<Activity size={14} />} value={local.relayCapacity}
          min={0} max={200} step={5} unit="sessions" color="var(--neon-yellow)"
          onChange={v => set('relayCapacity', v)} />
        <ResourceSlider label="Max Connections" icon={<Zap size={14} />} value={local.maxConnections}
          min={1} max={100} step={1} unit="peers" color="var(--neon-red)"
          onChange={v => set('maxConnections', v)} />
      </div>

      {/* Storage */}
      <div className="pinc-card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>STORAGE</div>
        <ResourceSlider label="Vault Storage" icon={<HardDrive size={14} />} value={local.storageGb}
          min={1} max={500} step={1} unit="GB" color="var(--neon-cyan)"
          onChange={v => set('storageGb', v)} />
      </div>

      {/* Priority */}
      <div className="pinc-card">
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>NODE PRIORITY</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          {PRIORITY_OPTIONS.map(p => (
            <motion.button
              key={p.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => set('priority', p.id)}
              style={{
                padding: '0.6rem', textAlign: 'center',
                background: local.priority === p.id ? 'rgba(0,212,255,0.1)' : 'var(--bg-tertiary)',
                border: `1px solid ${local.priority === p.id ? 'var(--electric-blue)' : 'var(--border)'}`,
                borderRadius: '4px', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '0.7rem', color: local.priority === p.id ? 'var(--electric-blue)' : 'var(--text-primary)', fontWeight: local.priority === p.id ? 600 : 400 }}>
                {p.label}
              </div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '3px' }}>{p.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
