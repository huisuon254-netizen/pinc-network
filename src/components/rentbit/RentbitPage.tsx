import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server, Cpu, HardDrive, Wifi, Clock, ShieldCheck,
  Activity, DollarSign, Star, Scan, CheckCircle, XCircle,
  Cloud, Database, Brain, Zap, Gamepad2, Search,
  ArrowUpRight, RefreshCw, AlertTriangle, Info,
  ServerCog, Globe, BarChart3, Gauge, Monitor, Circle,
  Network, Layers,
} from 'lucide-react';
import type { RentbitStatus, DeviceScanResult } from '../../types';
import rentbitIcon from '../../assets/brand/rentbit_icon.jpg';

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

interface HostingOption {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  requirements: string[];
  tier: string;
}

type Tab = 'dashboard' | 'device_scan' | 'qualification' | 'hosting' | 'marketplace';

const DEFAULT_STATUS: RentbitStatus = {
  active_rentals: 0, cpu_usage: 0, ram_usage: 0, storage_usage: 0, earnings: 0, host_rating: 0, qualified: false,
};

const HOSTING_OPTIONS: HostingOption[] = [
  { id: 'vps', title: 'VPS Hosting', icon: <Server size={22} />, color: 'var(--electric-blue)', description: 'Virtual private servers with dedicated resources. Rent isolated compute environments for web apps, APIs, and backend services across the PINC network.', requirements: ['2+ CPU Cores', '4+ GB RAM', '20+ GB Storage', '100+ Mbps Network'], tier: 'T1' },
  { id: 'storage', title: 'Storage Hosting', icon: <Database size={22} />, color: 'var(--neon-cyan)', description: 'Distributed file storage with end-to-end encryption. Provide redundant, geo-distributed storage capacity to the network for decentralised data persistence.', requirements: ['2+ CPU Cores', '4+ GB RAM', '100+ GB Storage', '100+ Mbps Network'], tier: 'T2' },
  { id: 'ai', title: 'AI Hosting', icon: <Brain size={22} />, color: 'var(--soft-purple)', description: 'GPU-accelerated compute for AI model training, fine-tuning, and inference. Power the decentralised AI ecosystem with your hardware.', requirements: ['4+ CPU Cores', '16+ GB RAM', '50+ GB Storage', 'GPU Required'], tier: 'T3' },
  { id: 'compute', title: 'Compute Hosting', icon: <Cpu size={22} />, color: 'var(--neon-green)', description: 'Raw compute power for batch processing, scientific simulations, CI/CD pipelines, and distributed workloads across thousands of nodes.', requirements: ['2+ CPU Cores', '8+ GB RAM', '20+ GB Storage', '100+ Mbps Network'], tier: 'T1' },
  { id: 'game', title: 'Game Server Hosting', icon: <Gamepad2 size={22} />, color: 'var(--neon-yellow)', description: 'Low-latency game server instances for multiplayer gaming. Optimised for real-time, high-performance workloads with DDoS protection.', requirements: ['4+ CPU Cores', '8+ GB RAM', '50+ GB Storage', '500+ Mbps Network'], tier: 'T2' },
];

function formatCurrency(v: number): string { return `$${v.toFixed(2)}`; }

function renderStars(rating: number): React.ReactNode {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {Array.from({ length: full }, (_, i) => <Star key={`f${i}`} size={12} fill="var(--neon-yellow)" color="var(--neon-yellow)" />)}
      {half > 0 && (
        <span style={{ position: 'relative', display: 'inline-block', width: 12, height: 12 }}>
          <Star size={12} style={{ position: 'absolute', color: 'var(--text-muted)' }} />
          <span style={{ position: 'absolute', overflow: 'hidden', width: 6 }}>
            <Star size={12} fill="var(--neon-yellow)" color="var(--neon-yellow)" />
          </span>
        </span>
      )}
      {Array.from({ length: empty }, (_, i) => <Star key={`e${i}`} size={12} color="var(--text-muted)" />)}
    </span>
  );
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'available') return 'var(--neon-green)';
  if (s === 'rented') return 'var(--electric-blue)';
  if (s === 'maintenance') return 'var(--neon-yellow)';
  if (s === 'offline') return 'var(--neon-red)';
  if (s === 'reserved') return 'var(--soft-purple)';
  return 'var(--text-muted)';
}

function UsageBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(value, 100);
  return (
    <div style={{ padding: '0.65rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
        <span>{label}</span>
        <span style={{ color, fontFamily: 'monospace', fontWeight: 600 }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: pct > 80 ? `linear-gradient(90deg, ${color}, var(--neon-red))` : color, borderRadius: '3px' }}
        />
      </div>
    </div>
  );
}

interface StatCardProps { label: string; value: string; icon: React.ReactNode; color: string; sub?: string; glow?: boolean; }

function StatCard({ label, value, icon, color, sub, glow }: StatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>{label}</div>
        <div style={{ color }}>{icon}</div>
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color, fontFamily: 'monospace', letterSpacing: '0.05em' }} className={glow ? 'glow-blue' : ''}>{value}</div>
      {sub && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</div>}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}22, ${color}88, ${color}22)` }} />
    </motion.div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.75rem', textTransform: 'uppercase' }}>{label}</div>;
}

export default function RentbitPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [status, setStatus] = useState<RentbitStatus>(DEFAULT_STATUS);
  const [scanResult, setScanResult] = useState<DeviceScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [listings, setListings] = useState<ServerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [listingLoading, setListingLoading] = useState<string | null>(null);
  const [listingFeedback, setListingFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadStatus = useCallback(async () => {
    try { setStatus(await invoke<RentbitStatus>('cmd_get_rentbit_status')); } catch { /* use defaults */ }
  }, []);

  const loadListings = useCallback(async () => {
    try { setListings(await invoke<ServerListing[]>('cmd_get_rift_listings')); } catch { setListings([]); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStatus(), loadListings()]).finally(() => setLoading(false));
  }, [loadStatus, loadListings]);

  const runDeviceScan = useCallback(async () => {
    setScanning(true);
    try { setScanResult(await invoke<DeviceScanResult>('cmd_run_device_scan')); } catch { setScanResult(null); }
    finally { setScanning(false); }
  }, []);

  const handleRent = useCallback(async (id: string) => {
    try {
      await invoke('cmd_rent_server', { serverId: id, period: 'hourly', durationHours: 1 });
      await loadListings();
    } catch { /* silent */ }
  }, [loadListings]);

  const handleListAsHost = useCallback(async (opt: HostingOption) => {
    setListingLoading(opt.id);
    setListingFeedback(null);
    try {
      const parseReq = (label: string): number => {
        const r = opt.requirements.find((r) => r.includes(label));
        if (!r) return 0;
        const m = r.match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      };
      const cpu = scanResult?.cpu_cores ?? parseReq('CPU');
      const ram = scanResult?.ram_gb ?? parseReq('RAM');
      const storage = scanResult?.storage_gb ?? parseReq('Storage');
      const speed = scanResult?.network_mbps ?? parseReq('Network');
      const tierPrices: Record<string, number> = { T1: 0.05, T2: 0.15, T3: 0.50 };
      const price = tierPrices[opt.tier] ?? 0.10;
      await invoke('cmd_create_server_listing', {
        tier: opt.tier, price, cpu, ram, storage, speed,
      });
      setListingFeedback({ ok: true, msg: `${opt.title} listed successfully!` });
      await loadListings();
    } catch (e: any) {
      setListingFeedback({ ok: false, msg: typeof e === 'string' ? e : 'Failed to list server' });
    } finally {
      setListingLoading(null);
    }
  }, [scanResult, loadListings]);

  useEffect(() => {
    if (!listingFeedback) return;
    const t = setTimeout(() => setListingFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [listingFeedback]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={14} /> },
    { id: 'device_scan', label: 'Device Scan', icon: <Scan size={14} /> },
    { id: 'qualification', label: 'Qualification', icon: <ShieldCheck size={14} /> },
    { id: 'hosting', label: 'Hosting Options', icon: <ServerCog size={14} /> },
    { id: 'marketplace', label: 'Marketplace', icon: <Globe size={14} /> },
  ];

  const filteredListings = listings.filter((l) => {
    if (filterTier !== 'all' && l.tier !== filterTier) return false;
    if (filterStatus !== 'all' && l.status.toLowerCase() !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!l.id.toLowerCase().includes(q) && !l.tier.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const tBtn = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', borderRadius: '6px',
    border: 'none', background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
    color: active ? 'var(--electric-blue)' : 'var(--text-secondary)',
    cursor: 'pointer', fontSize: '0.72rem', fontWeight: active ? 700 : 500, transition: 'all 0.15s',
    position: 'relative',
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', width: '100%' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.25em', marginBottom: '0.25rem' }}>DECENTRALISED SERVER HOSTING</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={rentbitIcon}
            alt="Rentbit"
            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
          />
          <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>RENTBIT</div>
          <span className="badge badge-online" style={{ fontSize: '0.6rem' }}>LIVE</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {listings.length} server{listings.length !== 1 ? 's' : ''} online
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={tBtn(tab === t.id)}>
            {t.icon}{t.label}
            {tab === t.id && <motion.div layoutId="ti" style={{ position: 'absolute', bottom: '-0.5rem', left: '0.5rem', right: '0.5rem', height: '2px', background: 'var(--electric-blue)', borderRadius: '1px' }} />}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DASHBOARD
          ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'dashboard' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SectionHeader label="Rental Overview" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="ACTIVE RENTALS" value={String(status.active_rentals)} icon={<Server size={14} />} color="var(--electric-blue)" />
            <StatCard label="CPU USAGE" value={`${status.cpu_usage.toFixed(1)}%`} icon={<Cpu size={14} />} color="var(--soft-purple)" glow={status.cpu_usage > 80} />
            <StatCard label="RAM USAGE" value={`${status.ram_usage.toFixed(1)}%`} icon={<Activity size={14} />} color="var(--neon-cyan)" glow={status.ram_usage > 80} />
            <StatCard label="STORAGE USAGE" value={`${status.storage_usage.toFixed(1)}%`} icon={<HardDrive size={14} />} color="var(--neon-yellow)" glow={status.storage_usage > 80} />
            <StatCard label="TOTAL EARNINGS" value={formatCurrency(status.earnings)} icon={<DollarSign size={14} />} color="var(--neon-green)" />
            <StatCard label="HOST RATING" value={status.host_rating.toFixed(1)} icon={renderStars(status.host_rating)} color="var(--neon-yellow)" sub={`${status.host_rating.toFixed(1)} / 5.0`} />
          </div>

          <div className="pinc-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Gauge size={14} style={{ color: 'var(--electric-blue)' }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>RESOURCE USAGE</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
              <UsageBar label="CPU" value={status.cpu_usage} color="var(--soft-purple)" />
              <UsageBar label="RAM" value={status.ram_usage} color="var(--neon-cyan)" />
              <UsageBar label="Storage" value={status.storage_usage} color="var(--neon-yellow)" />
            </div>
          </div>

          <div className="pinc-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Monitor size={14} style={{ color: 'var(--neon-green)' }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>SYSTEM HEALTH</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.65rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Qualified: <span style={{ color: status.qualified ? 'var(--neon-green)' : 'var(--neon-red)', fontWeight: 600 }}>{status.qualified ? 'YES' : 'NO'}</span></span>
              <span style={{ color: 'var(--text-muted)' }}>Network: <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>Connected</span></span>
              <span style={{ color: 'var(--text-muted)' }}>Rating: <span style={{ color: 'var(--neon-yellow)', fontWeight: 600 }}>{status.host_rating.toFixed(1)} / 5.0</span></span>
              <span style={{ color: 'var(--text-muted)' }}>Active Rentals: <span style={{ color: 'var(--electric-blue)', fontWeight: 600 }}>{status.active_rentals}</span></span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DEVICE SCAN
          ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'device_scan' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SectionHeader label="Hardware Analysis" />

          <AnimatePresence mode="wait">
            {!scanResult && !scanning && (
              <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="pinc-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,212,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                    <Scan size={28} style={{ color: 'var(--electric-blue)' }} />
                  </div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>Device Scan Required</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                    Run a scan to analyse your hardware capabilities — CPU cores, clock speed, RAM, storage capacity, network throughput, system uptime, and security posture.
                  </div>
                  <button className="pinc-btn pinc-btn-primary" onClick={runDeviceScan} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}>
                    <Scan size={14} /> Run Device Scan
                  </button>
                </div>
              </motion.div>
            )}

            {scanning && (
              <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="pinc-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 40, height: 40, border: '3px solid var(--electric-blue)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem' }} />
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>Scanning device hardware...</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Measuring CPU, RAM, storage, network, uptime &amp; security</div>
                </div>
              </motion.div>
            )}

            {scanResult && !scanning && (
              <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <StatCard label="CPU CORES" value={String(scanResult.cpu_cores)} icon={<Cpu size={14} />} color="var(--electric-blue)" sub={`${scanResult.cpu_speed_ghz.toFixed(2)} GHz`} />
                  <StatCard label="RAM" value={`${scanResult.ram_gb} GB`} icon={<Activity size={14} />} color="var(--neon-cyan)" />
                  <StatCard label="STORAGE" value={`${scanResult.storage_gb} GB`} icon={<HardDrive size={14} />} color="var(--neon-yellow)" />
                  <StatCard label="NETWORK" value={`${scanResult.network_mbps} Mbps`} icon={<Wifi size={14} />} color="var(--neon-green)" />
                  <StatCard label="UPTIME" value={`${scanResult.uptime_hours}h`} icon={<Clock size={14} />} color="var(--soft-purple)" />
                  <StatCard
                    label="SECURITY"
                    value={scanResult.security_status === 'ok' ? 'PASS' : 'WARN'}
                    icon={<ShieldCheck size={14} />}
                    color={scanResult.security_status === 'ok' ? 'var(--neon-green)' : 'var(--neon-yellow)'}
                    sub={scanResult.security_status !== 'ok' ? scanResult.security_status : undefined}
                  />
                </div>

                <div className="pinc-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {scanResult.cpu_cores >= 2 && scanResult.ram_gb >= 4 && scanResult.storage_gb >= 20
                      ? <span style={{ color: 'var(--neon-green)' }}>✓ Meets minimum hosting requirements</span>
                      : <span style={{ color: 'var(--neon-yellow)' }}>⚠ Does not meet minimum hosting requirements</span>}
                  </div>
                  <button className="pinc-btn" onClick={runDeviceScan} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem' }}>
                    <RefreshCw size={14} /> Rescan
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          QUALIFICATION
          ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'qualification' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SectionHeader label="Hosting Eligibility" />

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="pinc-card"
            style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '1.5rem',
              borderColor: status.qualified ? 'rgba(57,255,20,0.35)' : 'rgba(255,34,85,0.35)',
              background: status.qualified ? 'rgba(57,255,20,0.03)' : 'rgba(255,34,85,0.03)' }}
          >
            {status.qualified ? (
              <>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                  <CheckCircle size={56} style={{ color: 'var(--neon-green)', marginBottom: '1rem' }} />
                </motion.div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--neon-green)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>HOST QUALIFIED</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
                  Your hardware meets the minimum requirements. You can list servers on the PINC network and start earning.
                </div>
              </>
            ) : (
              <>
                <XCircle size={56} style={{ color: 'var(--neon-red)', marginBottom: '1rem' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--neon-red)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>NOT QUALIFIED</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Your hardware does not meet the minimum hosting requirements. Run a device scan and upgrade your components.
                </div>

                <div className="pinc-card" style={{ textAlign: 'left', maxWidth: 420, margin: '0 auto', background: 'var(--bg-secondary)' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>RECOMMENDATIONS</div>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {[
                      'Run a Device Scan to check your current hardware configuration',
                      'Ensure at least 2 CPU cores and 4 GB of RAM are available',
                      'Provide at least 20 GB of free storage capacity',
                      'Maintain a network connection above 100 Mbps throughput',
                      'Keep system security status clear of threats',
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

          <SectionHeader label="Hosting Tier Requirements" />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {[
              { tier: 'T1', name: 'Basic', color: 'var(--neon-green)', cpu: '2+', ram: '4 GB', storage: '20 GB', network: '100 Mbps', badge: 'badge-online', desc: 'Entry-level VPS and compute hosting for lightweight workloads' },
              { tier: 'T2', name: 'Standard', color: 'var(--electric-blue)', cpu: '4+', ram: '8 GB', storage: '50 GB', network: '500 Mbps', badge: 'badge-info', desc: 'Storage and game server hosting requiring moderate resources' },
              { tier: 'T3', name: 'Premium', color: 'var(--soft-purple)', cpu: '8+', ram: '16 GB', storage: '100 GB', network: '1 Gbps', badge: 'badge-purple', desc: 'GPU-accelerated AI hosting for demanding compute workloads' },
            ].map((t) => (
              <motion.div key={t.tier} whileHover={{ y: -2 }} className="pinc-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${t.color}33, ${t.color}99, ${t.color}33)` }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: t.color, fontWeight: 700, letterSpacing: '0.12em' }}>{t.tier}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{t.name}</span>
                  </div>
                  <span className={`badge ${t.badge}`} style={{ fontSize: '0.55rem' }}>{t.tier}</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{t.desc}</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      { label: 'CPU Cores', val: t.cpu },
                      { label: 'RAM', val: t.ram },
                      { label: 'Storage', val: t.storage },
                      { label: 'Network', val: t.network },
                    ].map((r) => (
                      <tr key={r.label}>
                        <td style={{ padding: '0.3rem 0', fontSize: '0.6rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{r.label}</td>
                        <td style={{ padding: '0.3rem 0', fontSize: '0.6rem', color: 'var(--text-secondary)', fontFamily: 'monospace', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{r.val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          HOSTING OPTIONS
          ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'hosting' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {listingFeedback && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ padding: '0.65rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: listingFeedback.ok ? 'rgba(57,255,20,0.08)' : 'rgba(255,34,85,0.08)',
                border: `1px solid ${listingFeedback.ok ? 'rgba(57,255,20,0.25)' : 'rgba(255,34,85,0.25)'}`,
                color: listingFeedback.ok ? 'var(--neon-green)' : 'var(--neon-red)' }}>
              {listingFeedback.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {listingFeedback.msg}
            </motion.div>
          )}
          <SectionHeader label="Server Types" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
            {HOSTING_OPTIONS.map((opt, idx) => (
              <motion.div
                key={opt.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }} whileHover={{ y: -2 }}
                className="pinc-card" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${opt.color}33, ${opt.color}99, ${opt.color}33)` }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '10px', background: `${opt.color}15`, border: `1px solid ${opt.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: opt.color, flexShrink: 0 }}>
                    {opt.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{opt.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.6rem', color: opt.color, letterSpacing: '0.1em', fontWeight: 600 }}>Tier {opt.tier}</span>
                      <Circle size={4} fill={opt.color} color={opt.color} />
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>{opt.requirements.length} requirements</span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '0.75rem', flex: 1 }}>
                  {opt.description}
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.4rem' }}>REQUIREMENTS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {opt.requirements.map((req, i) => (
                      <span key={i} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.6rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  className="pinc-btn"
                  onClick={() => handleListAsHost(opt)}
                  disabled={listingLoading === opt.id}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.68rem', borderColor: opt.color, color: opt.color, marginTop: 'auto', opacity: listingLoading === opt.id ? 0.5 : 1 }}
                >
                  {listingLoading === opt.id ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  ) : <ArrowUpRight size={14} />}
                  {listingLoading === opt.id ? 'Listing...' : 'List as Host'}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MARKETPLACE
          ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'marketplace' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SectionHeader label="Available Servers" />

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 160 }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input type="text" placeholder="Search servers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pinc-input" style={{ paddingLeft: '32px', fontSize: '0.72rem' }} />
            </div>
            <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.72rem', cursor: 'pointer', outline: 'none', minWidth: 100 }}>
              <option value="all">All Tiers</option>
              <option value="T1">T1 — Basic</option>
              <option value="T2">T2 — Standard</option>
              <option value="T3">T3 — Premium</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.72rem', cursor: 'pointer', outline: 'none', minWidth: 100 }}>
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
            </select>
            {listings.length > 0 && (
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginLeft: 'auto' }}>
                {filteredListings.length} / {listings.length} shown
              </span>
            )}
          </div>

          {loading ? (
            <div className="pinc-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ width: 32, height: 32, border: '3px solid var(--electric-blue)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Loading servers from network...</div>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="pinc-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Server size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.25 }} />
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                {listings.length === 0 ? 'No servers listed yet' : 'No matching servers'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: 360, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                {listings.length === 0
                  ? 'The marketplace is currently empty. Be the first to list a server through the Hosting Options tab.'
                  : 'No servers match your current search or filter criteria. Try adjusting your settings.'}
              </div>
              {listings.length === 0 && (
                <button className="pinc-btn pinc-btn-primary" onClick={() => setTab('hosting')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}>
                  <ServerCog size={14} /> Go to Hosting Options
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
              {filteredListings.map((l, idx) => (
                <motion.div
                  key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }} whileHover={{ y: -2 }}
                  className="pinc-card" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${statusColor(l.status)}33, ${statusColor(l.status)}99, ${statusColor(l.status)}33)` }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: statusColor(l.status) }} />
                        <span style={{ fontSize: '0.6rem', color: statusColor(l.status), letterSpacing: '0.1em', fontWeight: 600 }}>{l.status.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{l.tier} Server</div>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '0.55rem', fontFamily: 'monospace' }}>{l.id.slice(0, 8)}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    {[
                      { label: 'CPU', val: `${l.hardware_specs.cpu_cores} cores` },
                      { label: 'RAM', val: `${l.hardware_specs.ram_gb} GB` },
                      { label: 'Storage', val: `${l.hardware_specs.storage_gb} GB` },
                      { label: 'Network', val: `${l.hardware_specs.network_speed_mbps} Mbps` },
                    ].map((s) => (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.4rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{s.label}: <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontWeight: 600 }}>{s.val}</span></span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Star size={10} fill="var(--neon-yellow)" color="var(--neon-yellow)" /> {l.metrics.average_rating.toFixed(1)}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>Rentals: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{l.metrics.total_rentals}</span></span>
                    <span style={{ color: 'var(--text-muted)' }}>Uptime: <span style={{ color: 'var(--neon-green)', fontWeight: 600 }}>{l.metrics.uptime_percentage.toFixed(1)}%</span></span>
                    <span style={{ color: 'var(--text-muted)' }}>CPU: <span style={{ color: 'var(--soft-purple)', fontWeight: 600 }}>{l.metrics.cpu_usage.toFixed(0)}%</span></span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {[{ v: l.metrics.cpu_usage, c: 'var(--soft-purple)' }, { v: l.metrics.ram_usage, c: 'var(--neon-cyan)' }, { v: l.metrics.disk_usage, c: 'var(--neon-yellow)' }].map((b, i) => (
                      <div key={i} style={{ flex: 1, height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(b.v, 100)}%`, height: '100%', background: b.c, borderRadius: '2px' }} />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                    <div>
                      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '2px' }}>PRICE / HOUR</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neon-green)', fontFamily: 'monospace' }}>{formatCurrency(l.price_per_hour)}</div>
                    </div>
                    <button
                      className="pinc-btn pinc-btn-primary" onClick={() => handleRent(l.id)}
                      disabled={l.status.toLowerCase() !== 'available'}
                      style={{ fontSize: '0.65rem', padding: '0.45rem 0.85rem', opacity: l.status.toLowerCase() !== 'available' ? 0.4 : 1 }}
                    >
                      {l.status.toLowerCase() === 'available' ? 'Rent' : l.status.toUpperCase()}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
