import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import {
  Server, Cpu, HardDrive, Wifi, Clock, ShieldCheck,
  Activity, DollarSign, Star, Scan, CheckCircle, XCircle,
  Cloud, Database, Brain, Zap, Gamepad2, Search,
  ChevronDown, ArrowUpRight, RefreshCw, AlertTriangle,
  Info, ServerCog, Globe,
} from 'lucide-react';
import type { RentbitStatus, DeviceScanResult } from '../../types';

// ─── Server Listing type (mirrors Rust ServerListing) ────────────────────────

interface HardwareSpecs {
  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  network_speed_mbps: number;
}

interface ServerMetrics {
  uptime_percentage: number;
  cpu_usage: number;
  ram_usage: number;
  disk_usage: number;
  network_in_mbps: number;
  network_out_mbps: number;
  total_rentals: number;
  total_earnings: number;
  average_rating: number;
  last_updated: number;
}

interface ServerListing {
  id: string;
  owner_id: string;
  tier: string;
  price_per_hour: number;
  hardware_specs: HardwareSpecs;
  status: string;
  created_at: number;
  rental_start: number | null;
  rental_duration_hours: number | null;
  renter_id: string | null;
  reputation_score: number | null;
  total_earnings: number;
  metrics: ServerMetrics;
}

// ─── Hosting option type ─────────────────────────────────────────────────────

interface HostingOption {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  requirements: string[];
  tier: string;
}

// ─── Tab type ────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'device_scan' | 'qualification' | 'hosting' | 'marketplace';

// ─── Default status ──────────────────────────────────────────────────────────

const DEFAULT_STATUS: RentbitStatus = {
  active_rentals: 0,
  cpu_usage: 0,
  ram_usage: 0,
  storage_usage: 0,
  earnings: 0,
  host_rating: 0,
  qualified: false,
};

// ─── Hosting options ─────────────────────────────────────────────────────────

const HOSTING_OPTIONS: HostingOption[] = [
  {
    id: 'vps',
    title: 'VPS Hosting',
    icon: <Server size={22} />,
    color: 'var(--electric-blue)',
    description: 'Virtual private servers with dedicated resources. Rent isolated compute environments for web apps, APIs, and backend services.',
    requirements: ['2+ CPU Cores', '4+ GB RAM', '20+ GB Storage', '100+ Mbps Network'],
    tier: 'T1',
  },
  {
    id: 'storage',
    title: 'Storage Hosting',
    icon: <Database size={22} />,
    color: 'var(--neon-cyan)',
    description: 'Distributed file storage with encryption. Provide redundant, geo-distributed storage capacity to the network.',
    requirements: ['2+ CPU Cores', '4+ GB RAM', '100+ GB Storage', '100+ Mbps Network'],
    tier: 'T2',
  },
  {
    id: 'ai',
    title: 'AI Hosting',
    icon: <Brain size={22} />,
    color: 'var(--soft-purple)',
    description: 'GPU-accelerated compute for AI model training and inference. Power the decentralized AI ecosystem.',
    requirements: ['4+ CPU Cores', '16+ GB RAM', '50+ GB Storage', 'GPU Required'],
    tier: 'T3',
  },
  {
    id: 'compute',
    title: 'Compute Hosting',
    icon: <Cpu size={22} />,
    color: 'var(--neon-green)',
    description: 'Raw compute power for batch processing, simulations, and distributed workloads across the network.',
    requirements: ['2+ CPU Cores', '8+ GB RAM', '20+ GB Storage', '100+ Mbps Network'],
    tier: 'T1',
  },
  {
    id: 'game',
    title: 'Game Server Hosting',
    icon: <Gamepad2 size={22} />,
    color: 'var(--neon-yellow)',
    description: 'Low-latency game server instances for multiplayer gaming. Optimized for real-time, high-performance workloads.',
    requirements: ['4+ CPU Cores', '8+ GB RAM', '50+ GB Storage', '500+ Mbps Network'],
    tier: 'T2',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function renderStars(rating: number): React.ReactNode {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {Array(full).fill(0).map((_, i) => (
        <Star key={`f${i}`} size={12} fill="var(--neon-yellow)" color="var(--neon-yellow)" />
      ))}
      {half > 0 && (
        <span style={{ position: 'relative', display: 'inline-block', width: 12, height: 12 }}>
          <Star size={12} style={{ position: 'absolute', color: 'var(--text-muted)' }} />
          <span style={{ position: 'absolute', overflow: 'hidden', width: 6 }}>
            <Star size={12} fill="var(--neon-yellow)" color="var(--neon-yellow)" />
          </span>
        </span>
      )}
      {Array(empty).fill(0).map((_, i) => (
        <Star key={`e${i}`} size={12} color="var(--text-muted)" />
      ))}
    </span>
  );
}

function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'available': return 'var(--neon-green)';
    case 'rented': return 'var(--electric-blue)';
    case 'maintenance': return 'var(--neon-yellow)';
    case 'offline': return 'var(--neon-red)';
    default: return 'var(--text-muted)';
  }
}

// ─── StatCard Component ──────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
  glow?: boolean;
}

function StatCard({ label, value, icon, color, sub, glow }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pinc-card"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>{label}</div>
        <div style={{ color }}>{icon}</div>
      </div>
      <div
        style={{ fontSize: '1.4rem', fontWeight: 700, color, fontFamily: 'monospace', letterSpacing: '0.05em' }}
        className={glow ? 'glow-blue' : ''}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</div>}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}44, ${color}88, ${color}44)` }} />
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RentbitPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [status, setStatus] = useState<RentbitStatus>(DEFAULT_STATUS);
  const [scanResult, setScanResult] = useState<DeviceScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [listings, setListings] = useState<ServerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ── Load data ────────────────────────────────────────────────────────────

  const loadStatus = useCallback(async () => {
    try {
      const s = await invoke<RentbitStatus>('cmd_get_rentbit_status');
      setStatus(s);
    } catch {
      // use defaults
    }
  }, []);

  const loadListings = useCallback(async () => {
    try {
      const l = await invoke<ServerListing[]>('cmd_get_rift_listings');
      setListings(l);
    } catch {
      setListings([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStatus(), loadListings()]).finally(() => setLoading(false));
  }, [loadStatus, loadListings]);

  // ── Device scan ──────────────────────────────────────────────────────────

  const runDeviceScan = useCallback(async () => {
    setScanning(true);
    try {
      const result = await invoke<DeviceScanResult>('cmd_run_device_scan');
      setScanResult(result);
    } catch {
      setScanResult(null);
    } finally {
      setScanning(false);
    }
  }, []);

  // ── Tab config ───────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Activity size={14} /> },
    { id: 'device_scan', label: 'Device Scan', icon: <Scan size={14} /> },
    { id: 'qualification', label: 'Qualification', icon: <ShieldCheck size={14} /> },
    { id: 'hosting', label: 'Hosting Options', icon: <ServerCog size={14} /> },
    { id: 'marketplace', label: 'Marketplace', icon: <Globe size={14} /> },
  ];

  // ── Filtered listings ────────────────────────────────────────────────────

  const filteredListings = listings.filter((l) => {
    if (filterTier !== 'all' && l.tier !== filterTier) return false;
    if (filterStatus !== 'all' && l.status.toLowerCase() !== filterStatus) return false;
    return true;
  });

  // ── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>
          SERVER HOSTING MARKETPLACE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>RENTBIT</div>
          <span className="badge badge-purple">PHASE 4</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: tab === t.id ? '1px solid var(--electric-blue)' : '1px solid var(--border)',
              background: tab === t.id ? 'rgba(0,212,255,0.08)' : 'transparent',
              color: tab === t.id ? 'var(--electric-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 600,
              transition: 'all 0.12s',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          DASHBOARD TAB
          ════════════════════════════════════════════════════════════════════════ */}
      {tab === 'dashboard' && (
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
            RENTAL OVERVIEW
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard
              label="ACTIVE RENTALS"
              value={String(status.active_rentals)}
              icon={<Server size={14} />}
              color="var(--electric-blue)"
            />
            <StatCard
              label="CPU USAGE"
              value={`${status.cpu_usage.toFixed(1)}%`}
              icon={<Cpu size={14} />}
              color="var(--soft-purple)"
              glow={status.cpu_usage > 80}
            />
            <StatCard
              label="RAM USAGE"
              value={`${status.ram_usage.toFixed(1)}%`}
              icon={<Activity size={14} />}
              color="var(--neon-cyan)"
              glow={status.ram_usage > 80}
            />
            <StatCard
              label="STORAGE USAGE"
              value={`${status.storage_usage.toFixed(1)}%`}
              icon={<HardDrive size={14} />}
              color="var(--neon-yellow)"
              glow={status.storage_usage > 80}
            />
            <StatCard
              label="TOTAL EARNINGS"
              value={formatCurrency(status.earnings)}
              icon={<DollarSign size={14} />}
              color="var(--neon-green)"
            />
            <StatCard
              label="HOST RATING"
              value={`${status.host_rating.toFixed(1)}`}
              icon={renderStars(status.host_rating)}
              color="var(--neon-yellow)"
              sub={`${status.host_rating.toFixed(1)} / 5.0`}
            />
          </div>

          {/* Quick status */}
          <div className="pinc-card">
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
              SYSTEM HEALTH
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: 'CPU', value: status.cpu_usage, color: status.cpu_usage > 80 ? 'var(--neon-red)' : 'var(--neon-green)' },
                { label: 'RAM', value: status.ram_usage, color: status.ram_usage > 80 ? 'var(--neon-red)' : 'var(--neon-green)' },
                { label: 'Storage', value: status.storage_usage, color: status.storage_usage > 80 ? 'var(--neon-red)' : 'var(--neon-green)' },
              ].map((bar) => (
                <div key={bar.label} style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    <span>{bar.label}</span>
                    <span style={{ color: bar.color }}>{bar.value.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(bar.value, 100)}%`, background: bar.color, borderRadius: '2px', transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          DEVICE SCAN TAB
          ════════════════════════════════════════════════════════════════════════ */}
      {tab === 'device_scan' && (
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
            HARDWARE ANALYSIS
          </div>

          {!scanResult && !scanning && (
            <div className="pinc-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <Scan size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.3 }} />
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Run a device scan to analyze your hardware
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                This will detect your CPU, RAM, storage, network speed, and security status to determine hosting eligibility.
              </div>
              <button
                className="pinc-btn pinc-btn-primary"
                onClick={runDeviceScan}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}
              >
                <Scan size={14} />
                Run Device Scan
              </button>
            </div>
          )}

          {scanning && (
            <div className="pinc-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--electric-blue)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scanning hardware...</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {scanResult && !scanning && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <StatCard
                  label="CPU CORES"
                  value={`${scanResult.cpu_cores}`}
                  icon={<Cpu size={14} />}
                  color="var(--electric-blue)"
                  sub={`${scanResult.cpu_speed_ghz.toFixed(1)} GHz`}
                />
                <StatCard
                  label="RAM"
                  value={`${scanResult.ram_gb} GB`}
                  icon={<Activity size={14} />}
                  color="var(--neon-cyan)"
                />
                <StatCard
                  label="STORAGE"
                  value={`${scanResult.storage_gb} GB`}
                  icon={<HardDrive size={14} />}
                  color="var(--neon-yellow)"
                />
                <StatCard
                  label="NETWORK"
                  value={`${scanResult.network_mbps} Mbps`}
                  icon={<Wifi size={14} />}
                  color="var(--neon-green)"
                />
                <StatCard
                  label="UPTIME"
                  value={`${scanResult.uptime_hours}h`}
                  icon={<Clock size={14} />}
                  color="var(--soft-purple)"
                />
                <StatCard
                  label="SECURITY"
                  value={scanResult.security_status === 'ok' ? 'PASS' : 'WARN'}
                  icon={<ShieldCheck size={14} />}
                  color={scanResult.security_status === 'ok' ? 'var(--neon-green)' : 'var(--neon-red)'}
                />
              </div>

              <div className="pinc-card" style={{ textAlign: 'center' }}>
                <button
                  className="pinc-btn"
                  onClick={runDeviceScan}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}
                >
                  <RefreshCw size={14} />
                  Rescan
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          QUALIFICATION TAB
          ════════════════════════════════════════════════════════════════════════ */}
      {tab === 'qualification' && (
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
            HOSTING ELIGIBILITY
          </div>

          {/* Big qualification card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pinc-card"
            style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              marginBottom: '1.5rem',
              borderColor: status.qualified ? 'rgba(57,255,20,0.3)' : 'rgba(255,34,85,0.3)',
              background: status.qualified ? 'rgba(57,255,20,0.03)' : 'rgba(255,34,85,0.03)',
            }}
          >
            {status.qualified ? (
              <>
                <CheckCircle size={56} style={{ color: 'var(--neon-green)', marginBottom: '1rem' }} />
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neon-green)', marginBottom: '0.5rem' }}>
                  QUALIFIED
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  You can host servers on the PINC network
                </div>
              </>
            ) : (
              <>
                <XCircle size={56} style={{ color: 'var(--neon-red)', marginBottom: '1rem' }} />
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neon-red)', marginBottom: '0.5rem' }}>
                  NOT QUALIFIED
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Your hardware does not meet the minimum hosting requirements
                </div>

                <div className="pinc-card" style={{ textAlign: 'left', maxWidth: 400, margin: '0 auto', background: 'var(--bg-secondary)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
                    RECOMMENDATIONS
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {[
                      'Run a Device Scan to check your hardware',
                      'Ensure at least 2 CPU cores and 4 GB RAM',
                      'Provide at least 20 GB of available storage',
                      'Maintain network speed above 100 Mbps',
                      'Keep security status clear of threats',
                    ].map((item, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        <AlertTriangle size={12} style={{ color: 'var(--neon-yellow)', marginTop: '2px', flexShrink: 0 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </motion.div>

          {/* Tier requirements */}
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
            HOSTING TIER REQUIREMENTS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {[
              { tier: 'T1', name: 'Basic', color: 'var(--neon-green)', cpu: '2+', ram: '4 GB', storage: '20 GB', network: '100 Mbps' },
              { tier: 'T2', name: 'Standard', color: 'var(--electric-blue)', cpu: '4+', ram: '8 GB', storage: '50 GB', network: '500 Mbps' },
              { tier: 'T3', name: 'Premium', color: 'var(--soft-purple)', cpu: '8+', ram: '16 GB', storage: '100 GB', network: '1 Gbps' },
            ].map((t) => (
              <div key={t.tier} className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${t.color}44, ${t.color}88, ${t.color}44)` }} />
                <div style={{ fontSize: '0.65rem', color: t.color, letterSpacing: '0.12em', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {t.tier} — {t.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                  {[
                    { label: 'CPU', val: t.cpu },
                    { label: 'RAM', val: t.ram },
                    { label: 'Storage', val: t.storage },
                    { label: 'Network', val: t.network },
                  ].map((r) => (
                    <div key={r.label} style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                      {r.label}: <span style={{ color: 'var(--text-secondary)' }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          HOSTING OPTIONS TAB
          ════════════════════════════════════════════════════════════════════════ */}
      {tab === 'hosting' && (
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
            SERVER TYPES
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
            {HOSTING_OPTIONS.map((option, idx) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="pinc-card"
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${option.color}44, ${option.color}88, ${option.color}44)` }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    background: `${option.color}15`,
                    border: `1px solid ${option.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: option.color,
                  }}>
                    {option.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{option.title}</div>
                    <div style={{ fontSize: '0.6rem', color: option.color, letterSpacing: '0.1em' }}>Tier {option.tier}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {option.description}
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
                    REQUIREMENTS
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {option.requirements.map((req, i) => (
                      <span key={i} style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '3px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        fontSize: '0.6rem',
                        color: 'var(--text-secondary)',
                      }}>
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  className="pinc-btn"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.72rem',
                    borderColor: option.color,
                    color: option.color,
                  }}
                >
                  <ArrowUpRight size={14} />
                  List as Host
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MARKETPLACE TAB
          ════════════════════════════════════════════════════════════════════════ */}
      {tab === 'marketplace' && (
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
            AVAILABLE SERVERS
          </div>

          {/* Filter controls */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search servers..."
                className="pinc-input"
                style={{ paddingLeft: '32px', fontSize: '0.72rem' }}
              />
            </div>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Tiers</option>
              <option value="T1">T1 — Basic</option>
              <option value="T2">T2 — Standard</option>
              <option value="T3">T3 — Premium</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Listings */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--electric-blue)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Loading servers...</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="pinc-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Server size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.3 }} />
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                No servers available
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                {listings.length === 0
                  ? 'No servers have been listed yet. Be the first to host!'
                  : 'No servers match your current filters.'}
              </div>
              <button className="pinc-btn pinc-btn-primary" style={{ fontSize: '0.72rem' }}>
                <Server size={14} />
                List Your Server
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
              {filteredListings.map((listing) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pinc-card"
                  style={{ position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${statusColor(listing.status)}44, ${statusColor(listing.status)}88, ${statusColor(listing.status)}44)` }} />

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', color: statusColor(listing.status), letterSpacing: '0.1em', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {listing.status.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {listing.tier} Server
                      </div>
                    </div>
                    <div style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '3px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      fontSize: '0.6rem',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.05em',
                    }}>
                      {listing.id.slice(0, 8)}
                    </div>
                  </div>

                  {/* Specs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {[
                      { label: 'CPU', val: `${listing.hardware_specs.cpu_cores} cores` },
                      { label: 'RAM', val: `${listing.hardware_specs.ram_gb} GB` },
                      { label: 'Storage', val: `${listing.hardware_specs.storage_gb} GB` },
                      { label: 'Network', val: `${listing.hardware_specs.network_speed_mbps} Mbps` },
                    ].map((spec) => (
                      <div key={spec.label} style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                        {spec.label}: <span style={{ color: 'var(--text-secondary)' }}>{spec.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.6rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Rating: <span style={{ color: 'var(--neon-yellow)' }}>{listing.metrics.average_rating.toFixed(1)}</span>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Rentals: <span style={{ color: 'var(--text-secondary)' }}>{listing.metrics.total_rentals}</span>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Uptime: <span style={{ color: 'var(--neon-green)' }}>{listing.metrics.uptime_percentage.toFixed(1)}%</span>
                    </span>
                  </div>

                  {/* Price & action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>PRICE/HOUR</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neon-green)' }}>
                        {formatCurrency(listing.price_per_hour)}
                      </div>
                    </div>
                    <button
                      className="pinc-btn pinc-btn-primary"
                      style={{ fontSize: '0.65rem', padding: '0.4rem 0.75rem' }}
                    >
                      Rent
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
