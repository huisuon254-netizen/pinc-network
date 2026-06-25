import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import {
  HardDrive, RefreshCw, Shield, Database, AlertTriangle,
  CheckCircle, Clock, Layers, Settings, Wrench
} from 'lucide-react';

interface DistributedStatus {
  status: string;
  chunk_size_mb: number;
  replication_factor: number;
  storage_nodes: number;
  total_allocated_gb: number;
  active_contracts: number;
}

interface StorageContract {
  id: string;
  provider_node_id: string;
  consumer_node_id: string;
  bytes_allocated: number;
  price_per_gb_per_day: number;
  expires_at: number;
  active: boolean;
}

export default function DistributedVaultPage() {
  const [status, setStatus] = useState<DistributedStatus | null>(null);
  const [contracts, setContracts] = useState<StorageContract[]>([]);
  const [redundancy, setRedundancy] = useState(3);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        invoke<DistributedStatus>('cmd_get_distributed_status'),
        invoke<StorageContract[]>('cmd_get_storage_contracts'),
      ]);
      setStatus(s);
      setContracts(c);
    } catch (e) {
      console.error('Failed to load distributed status:', e);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const runRepair = async () => {
    setLoading(true);
    try {
      await invoke('cmd_repair_shards');
      await loadData();
    } catch (e) {
      console.error('Repair failed:', e);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>DISTRIBUTED VAULT</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Decentralized Storage Engine
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Files are split into encrypted shards and distributed across the network for redundancy
        </div>
      </div>

      {/* Status grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <StatusCard
          label="ENGINE STATUS"
          value={status?.status ?? '—'}
          sub="distributed vault"
          color={status?.status === 'Active' ? 'var(--neon-green)' : 'var(--text-muted)'}
          icon={<Layers size={16} />}
        />
        <StatusCard
          label="STORAGE NODES"
          value={String(status?.storage_nodes ?? 0)}
          sub="peers storing shards"
          color="var(--neon-green)"
          icon={<CheckCircle size={16} />}
        />
        <StatusCard
          label="CHUNK SIZE"
          value={`${status?.chunk_size_mb ?? 8} MB`}
          sub="per shard"
          color="var(--neon-cyan)"
          icon={<HardDrive size={16} />}
        />
        <StatusCard
          label="REPLICATION"
          value={`${status?.replication_factor ?? 3}x`}
          sub="copies per file"
          color="var(--soft-purple)"
          icon={<Shield size={16} />}
        />
        <StatusCard
          label="TOTAL ALLOCATED"
          value={`${(status?.total_allocated_gb ?? 0).toFixed(1)} GB`}
          sub="across all nodes"
          color="var(--electric-blue)"
          icon={<Database size={16} />}
        />
        <StatusCard
          label="CONTRACTS"
          value={String(status?.active_contracts ?? 0)}
          sub="storage agreements"
          color="var(--neon-yellow)"
          icon={<Database size={16} />}
        />
      </div>

      {/* Repair controls */}
      <div className="pinc-card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>REPAIR CONTROLS</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>REDUNDANCY LEVEL</label>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[2, 3, 5, 7].map(r => (
                <button key={r} onClick={() => setRedundancy(r)} style={{
                  padding: '0.3rem 0.6rem', borderRadius: '3px',
                  background: redundancy === r ? 'rgba(168,85,247,0.15)' : 'var(--bg-secondary)',
                  border: `1px solid ${redundancy === r ? 'var(--soft-purple)' : 'var(--border)'}`,
                  color: redundancy === r ? 'var(--soft-purple)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.65rem', fontFamily: 'monospace',
                }}>
                  {r}x
                </button>
              ))}
            </div>
          </div>

          <button onClick={runRepair} disabled={loading} className="pinc-btn">
            {loading ? <RefreshCw size={14} className="pulse-glow" /> : <Wrench size={14} />}
            {loading ? 'REPAIRING...' : 'REPAIR SHARDS'}
          </button>

          <button onClick={loadData} className="pinc-btn">
            <RefreshCw size={14} />
            REFRESH
          </button>
        </div>

        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Shard repair redistributes missing or degraded shards across available peers to maintain your redundancy level.
          Higher redundancy = more fault tolerance, but more network storage used.
        </div>
      </div>

      {/* Storage contracts */}
      <div className="pinc-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>STORAGE CONTRACTS</span>
          </div>
          <span className="badge badge-info">{contracts.length} ACTIVE</span>
        </div>

        {contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <HardDrive size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
            <div>No active storage contracts.</div>
            <div style={{ marginTop: '0.25rem' }}>Contracts are created when you save files to the distributed vault.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {contracts.map(c => (
              <div key={c.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 0.75rem', background: 'var(--bg-secondary)',
                borderRadius: '3px', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: c.active ? 'var(--neon-green)' : 'var(--neon-yellow)',
                  }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {c.id.slice(0, 16)}...
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                      Provider: {c.provider_node_id.slice(0, 12)}... · {formatBytes(c.bytes_allocated)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${c.active ? 'badge-online' : 'badge-pending'}`}>
                    {c.active ? 'ACTIVE' : 'EXPIRED'}
                  </span>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <Clock size={9} style={{ marginRight: '3px' }} />
                    {new Date(c.expires_at * 1000).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub: string; color: string; icon: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</div>
        <div style={{ color }}>{icon}</div>
      </div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}44, ${color}88, ${color}44)` }} />
    </motion.div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
