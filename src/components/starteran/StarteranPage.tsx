import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, WifiOff, Activity, Zap, TrendingUp, Shield, Award,
  Download, Upload, Gauge, Timer, AlertTriangle, CheckCircle2,
  Play, Pause, RefreshCw, Settings, Sliders, ArrowUpRight,
  ArrowDownRight, CircleDot, BarChart3, Lock, Star,
  QrCode, Link2, Copy, Share2, Check,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { StarteranStatus } from '../../types';

type StarteranTab = 'dashboard' | 'speed' | 'share' | 'approvals' | 'controls';

interface SpeedTestRaw {
  download_kbps: number;
  upload_kbps: number;
  latency_ms: number;
  jitter_ms: number;
  timestamp: number;
}

interface PairingCodeResponse {
  code: string;
  expires_in_secs: number;
}

const APPROVAL_LEVELS = [
  {
    level: 1, name: 'Bronze', color: '#cd7f32',
    requirement: '<50 Mbps download', benefit: 'Basic sharing access',
    icon: Shield,
  },
  {
    level: 2, name: 'Silver', color: '#c0c0c0',
    requirement: '50–100 Mbps verified', benefit: 'Verified speed badge',
    icon: Star,
  },
  {
    level: 3, name: 'Gold', color: '#ffd700',
    requirement: '100–500 Mbps', benefit: 'High reliability status',
    icon: Award,
  },
  {
    level: 4, name: 'Platinum', color: '#e5e4e2',
    requirement: '500–1000 Mbps', benefit: 'Premium network access',
    icon: Zap,
  },
  {
    level: 5, name: 'Enterprise', color: '#00d4ff',
    requirement: '1000+ Mbps', benefit: 'Max capacity & priority',
    icon: Lock,
  },
];

function levelToNumber(level: string): number {
  const map: Record<string, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4, enterprise: 5 };
  return map[level.toLowerCase()] ?? 0;
}

function StatCard({ icon: Icon, label, value, unit, color }: {
  icon: any; label: string; value: string | number; unit?: string; color?: string;
}) {
  return (
    <motion.div
      className="pinc-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem' }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 8,
        background: `${color || 'var(--electric-blue)'}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color || 'var(--electric-blue)'}30`,
        flexShrink: 0,
      }}>
        <Icon size={18} style={{ color: color || 'var(--electric-blue)' }} />
      </div>
      <div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            {value}
          </span>
          {unit && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{unit}</span>}
        </div>
      </div>
    </motion.div>
  );
}

export default function StarteranPage() {
  const [tab, setTab] = useState<StarteranTab>('dashboard');
  const [status, setStatus] = useState<StarteranStatus | null>(null);
  const [speedResult, setSpeedResult] = useState<SpeedTestRaw | null>(null);
  const [scanning, setScanning] = useState(false);
  const [sharingActive, setSharingActive] = useState(false);
  const [bandwidthLimit, setBandwidthLimit] = useState('');
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [loading, setLoading] = useState(false);

  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingExpiry, setPairingExpiry] = useState<number | null>(null);
  const [enterCode, setEnterCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await invoke<StarteranStatus>('cmd_get_starteran_status');
      setStatus(s);
      setSharingActive(s.sharing_active);
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const runSpeedScan = async () => {
    setScanning(true);
    setSpeedResult(null);
    setError(null);
    try {
      const raw = await invoke<SpeedTestRaw>('cmd_run_speed_test');
      setSpeedResult(raw);
    } catch (e) {
      console.error('Speed scan failed:', e);
      setError('Speed test failed. Please try again.');
    }
    setScanning(false);
  };

  const toggleSharing = async () => {
    setLoading(true);
    setError(null);
    const newActive = !sharingActive;
    try {
      await invoke('cmd_toggle_net_sharing', { active: newActive });
      setSharingActive(newActive);
      fetchStatus();
    } catch (e) {
      console.error('Toggle sharing failed:', e);
      setError('Failed to toggle sharing.');
    }
    setLoading(false);
  };

  const generateQRCode = async () => {
    setError(null);
    try {
      const pairing = await invoke<PairingCodeResponse>('cmd_generate_pairing_code');
      setPairingCode(pairing.code);
      setPairingExpiry(pairing.expires_in_secs);

      const qrData = JSON.stringify({ code: pairing.code, type: 'bandwidth_share' });
      const qr = await invoke<string>('cmd_generate_qr_png', { data: qrData });
      setQrBase64(qr);
    } catch (e) {
      console.error('QR generation failed:', e);
      setError('Failed to generate pairing code.');
    }
  };

  const connectWithCode = async () => {
    if (!enterCode.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      await invoke('cmd_connect_with_code', { code: enterCode.trim() });
      setEnterCode('');
    } catch (e) {
      console.error('Connect failed:', e);
      setError('Failed to connect with code.');
    }
    setConnecting(false);
  };

  const copyCode = async () => {
    if (!pairingCode) return;
    try {
      await navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const currentLevel = status ? levelToNumber(status.approval_level) : 0;
  const currentLevelInfo = APPROVAL_LEVELS.find(l => l.level === currentLevel);

  const tabButtons: [StarteranTab, string][] = [
    ['dashboard', 'Dashboard'],
    ['speed', 'Speed Scan'],
    ['share', 'Share'],
    ['approvals', 'Approval Levels'],
    ['controls', 'Controls'],
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>
          BANDWIDTH MARKETPLACE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>STARTERAN</div>
          <span className="badge badge-info">PHASE 3</span>
          {status && (
            <span className={`badge ${status.sharing_active ? 'badge-online' : 'badge-offline'}`}>
              {status.sharing_active ? 'SHARING' : 'IDLE'}
            </span>
          )}
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 6,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem',
              color: 'var(--neon-red)',
            }}
          >
            <AlertTriangle size={14} />
            {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem',
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 6, padding: 3, border: '1px solid var(--border)' }}>
        {tabButtons.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '0.55rem', fontSize: '0.7rem', fontFamily: 'var(--font-display)',
            fontWeight: 600, letterSpacing: '0.04em',
            background: tab === id ? 'rgba(0,212,255,0.1)' : 'transparent',
            border: 'none', borderRadius: 4,
            color: tab === id ? 'var(--electric-blue)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ─── DASHBOARD TAB ─────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
              <StatCard icon={Wifi} label="Active Connections" value={status?.active_connections ?? 0} color="var(--neon-green)" />
              <StatCard icon={ArrowUpRight} label="Traffic Shared" value={(status?.traffic_shared_gb ?? 0).toFixed(1)} unit="GB" color="var(--electric-blue)" />
              <StatCard icon={TrendingUp} label="Total Earnings" value={`$${(status?.earnings ?? 0).toFixed(2)}`} color="var(--neon-yellow)" />
              <StatCard icon={CheckCircle2} label="Reliability Score" value={`${(status?.reliability_score ?? 0).toFixed(0)}%`} color="var(--neon-cyan)" />
            </div>

            <div className="pinc-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                {currentLevelInfo ? (
                  <div style={{
                    width: 44, height: 44, borderRadius: 8,
                    background: `${currentLevelInfo.color}18`,
                    border: `1px solid ${currentLevelInfo.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <currentLevelInfo.icon size={20} style={{ color: currentLevelInfo.color }} />
                  </div>
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: 8,
                    background: 'rgba(74,85,104,0.15)',
                    border: '1px solid rgba(74,85,104,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Award size={20} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 2 }}>
                    APPROVAL LEVEL
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: currentLevelInfo?.color || 'var(--text-secondary)' }}>
                    {currentLevelInfo ? `${currentLevelInfo.name} (Level ${currentLevel})` : 'Unranked'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: sharingActive ? 'var(--neon-green)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {sharingActive ? 'Sharing Active' : 'Sharing Off'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button
                className={`pinc-btn ${sharingActive ? 'pinc-btn-danger' : 'pinc-btn-primary'}`}
                onClick={toggleSharing}
                disabled={loading}
                style={{ fontSize: '0.82rem', padding: '0.6rem 1.5rem' }}
              >
                {loading ? (
                  <><RefreshCw size={15} className="spin" /> Updating...</>
                ) : sharingActive ? (
                  <><WifiOff size={15} /> Stop Sharing</>
                ) : (
                  <><Wifi size={15} /> Start Sharing</>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── SPEED SCAN TAB ────────────────────────────────────── */}
        {tab === 'speed' && (
          <motion.div key="speed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="pinc-card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: 4 }}>
                  SYSTEM SPEED SCAN
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Test your connection before sharing with the network
                </div>
              </div>
              <button className="pinc-btn pinc-btn-primary" onClick={runSpeedScan} disabled={scanning} style={{ fontSize: '0.75rem', padding: '0.5rem 1.25rem' }}>
                {scanning ? (
                  <><RefreshCw size={14} className="spin" /> Testing...</>
                ) : (
                  <><Zap size={14} /> Run Scan</>
                )}
              </button>
            </div>

            {/* Scanning animation */}
            {scanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pinc-card"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '2.5rem', gap: '1rem',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                >
                  <RefreshCw size={32} style={{ color: 'var(--electric-blue)' }} />
                </motion.div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Running speed test...
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Measuring download, upload, latency, and jitter
                </div>
                <motion.div
                  style={{
                    width: '60%', height: 4, borderRadius: 2,
                    background: 'var(--bg-secondary)', overflow: 'hidden',
                    marginTop: '0.5rem',
                  }}
                >
                  <motion.div
                    style={{ height: '100%', borderRadius: 2, background: 'var(--electric-blue)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 12, ease: 'linear' }}
                  />
                </motion.div>
              </motion.div>
            )}

            {/* Results grid */}
            {!scanning && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem' }}>
                <StatCard
                  icon={Download}
                  label="Download Speed"
                  value={speedResult ? (speedResult.download_kbps / 1000).toFixed(1) : '—'}
                  unit={speedResult ? 'Mbps' : ''}
                  color="var(--neon-green)"
                />
                <StatCard
                  icon={Upload}
                  label="Upload Speed"
                  value={speedResult ? (speedResult.upload_kbps / 1000).toFixed(1) : '—'}
                  unit={speedResult ? 'Mbps' : ''}
                  color="var(--electric-blue)"
                />
                <StatCard
                  icon={Timer}
                  label="Latency"
                  value={speedResult ? speedResult.latency_ms.toFixed(0) : '—'}
                  unit={speedResult ? 'ms' : ''}
                  color="var(--neon-yellow)"
                />
                <StatCard
                  icon={Activity}
                  label="Jitter"
                  value={speedResult ? speedResult.jitter_ms.toFixed(1) : '—'}
                  unit={speedResult ? 'ms' : ''}
                  color="var(--neon-cyan)"
                />
              </div>
            )}

            {/* Detailed result card */}
            {speedResult && !scanning && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pinc-card" style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.75rem' }}>
                  SCAN RESULT
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 140, padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 2 }}>DOWNLOAD</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--neon-green)', fontFamily: 'var(--font-display)' }}>
                      {(speedResult.download_kbps / 1000).toFixed(1)} Mbps
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 140, padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 2 }}>UPLOAD</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--electric-blue)', fontFamily: 'var(--font-display)' }}>
                      {(speedResult.upload_kbps / 1000).toFixed(1)} Mbps
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 140, padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 2 }}>LATENCY</div>
                    <div style={{
                      fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)',
                      color: speedResult.latency_ms < 30 ? 'var(--neon-green)' : speedResult.latency_ms < 80 ? 'var(--neon-yellow)' : 'var(--neon-red)',
                    }}>
                      {speedResult.latency_ms.toFixed(0)} ms
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 140, padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 2 }}>JITTER</div>
                    <div style={{
                      fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)',
                      color: speedResult.jitter_ms < 5 ? 'var(--neon-green)' : speedResult.jitter_ms < 15 ? 'var(--neon-yellow)' : 'var(--neon-red)',
                    }}>
                      {speedResult.jitter_ms.toFixed(1)} ms
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  Tested at {new Date(speedResult.timestamp * 1000).toLocaleString()}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ─── SHARE TAB (QR Code + Code Entry) ──────────────────── */}
        {tab === 'share' && (
          <motion.div key="share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* QR Code Generator */}
              <div className="pinc-card">
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                  GENERATE PAIRING CODE
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Create a QR code or pairing code for another device to connect.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  {qrBase64 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        padding: '1rem', borderRadius: 8,
                        background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <img
                        src={`data:image/png;base64,${qrBase64}`}
                        alt="Pairing QR Code"
                        style={{ width: 180, height: 180, imageRendering: 'pixelated' }}
                      />
                    </motion.div>
                  ) : (
                    <div style={{
                      width: 180, height: 180, borderRadius: 8,
                      background: 'var(--bg-secondary)', border: '1px dashed var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <QrCode size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                    </div>
                  )}

                  {pairingCode && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        width: '100%', padding: '0.75rem', borderRadius: 6,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <code style={{
                        fontSize: '1rem', fontWeight: 700, color: 'var(--electric-blue)',
                        fontFamily: 'var(--font-display)', letterSpacing: '0.12em',
                      }}>
                        {pairingCode}
                      </code>
                      <button
                        className="pinc-btn"
                        onClick={copyCode}
                        style={{ fontSize: '0.68rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                      </button>
                    </motion.div>
                  )}

                  {pairingExpiry && pairingCode && (
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                      Expires in {pairingExpiry} seconds
                    </div>
                  )}

                  <button
                    className="pinc-btn pinc-btn-primary"
                    onClick={generateQRCode}
                    style={{ fontSize: '0.78rem', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <QrCode size={14} />
                    {qrBase64 ? 'Generate New Code' : 'Generate QR Code'}
                  </button>
                </div>
              </div>

              {/* Enter Code + Share Toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Enter Code */}
                <div className="pinc-card">
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                    CONNECT WITH CODE
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Enter a pairing code from another device to connect.
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      className="pinc-input"
                      type="text"
                      value={enterCode}
                      onChange={e => setEnterCode(e.target.value)}
                      placeholder="Enter pairing code"
                      onKeyDown={e => e.key === 'Enter' && connectWithCode()}
                      style={{ flex: 1, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                    />
                    <button
                      className="pinc-btn pinc-btn-primary"
                      onClick={connectWithCode}
                      disabled={connecting || !enterCode.trim()}
                      style={{ fontSize: '0.72rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {connecting ? (
                        <><RefreshCw size={13} className="spin" /> Connecting</>
                      ) : (
                        <><Link2 size={13} /> Connect</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Share Toggle */}
                <div className="pinc-card">
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                    BANDWIDTH SHARING
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Start or stop sharing your bandwidth with the PINC network.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={toggleSharing}
                      disabled={loading}
                      style={{
                        width: '100%', padding: '1rem 1.5rem', borderRadius: 8,
                        border: `2px solid ${sharingActive ? 'var(--neon-green)' : 'var(--electric-blue)'}`,
                        background: sharingActive ? 'rgba(52,211,153,0.1)' : 'rgba(0,212,255,0.1)',
                        color: sharingActive ? 'var(--neon-green)' : 'var(--electric-blue)',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-display)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {loading ? (
                        <RefreshCw size={20} className="spin" />
                      ) : (
                        <Share2 size={20} />
                      )}
                      {loading ? 'Updating...' : sharingActive ? 'SHARING ACTIVE — TAP TO STOP' : 'START SHARING'}
                    </motion.button>

                    {sharingActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          fontSize: '0.72rem', color: 'var(--neon-green)',
                        }}
                      >
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: 'var(--neon-green)',
                          animation: 'pulse 2s infinite',
                        }} />
                        Your bandwidth is being shared with the network
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── APPROVAL LEVELS TAB ───────────────────────────────── */}
        {tab === 'approvals' && (
          <motion.div key="approvals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="pinc-card" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
                NETWORK APPROVAL TIERS
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Higher approval levels unlock greater sharing capacity and network privileges.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem' }}>
              {APPROVAL_LEVELS.map((level, i) => {
                const isActive = currentLevel === level.level;
                const isUnlocked = currentLevel >= level.level;
                const Icon = level.icon;
                return (
                  <motion.div
                    key={level.level}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="pinc-card"
                    style={{
                      borderColor: isActive ? level.color : 'var(--border)',
                      boxShadow: isActive ? `0 0 12px ${level.color}30, inset 0 0 12px ${level.color}08` : 'none',
                      opacity: isUnlocked ? 1 : 0.6,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        fontSize: '0.55rem', color: level.color, letterSpacing: '0.08em',
                        padding: '2px 6px', borderRadius: 3,
                        background: `${level.color}18`, border: `1px solid ${level.color}30`,
                      }}>
                        CURRENT
                      </div>
                    )}

                    <div style={{
                      width: 40, height: 40, borderRadius: 8,
                      background: `${level.color}15`, border: `1px solid ${level.color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '0.875rem',
                    }}>
                      <Icon size={20} style={{ color: level.color }} />
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: level.color, marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                      {level.name}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                      LEVEL {level.level}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', letterSpacing: '0.06em' }}>REQUIREMENT</span>
                      <div style={{ marginTop: 2 }}>{level.requirement}</div>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', letterSpacing: '0.06em' }}>BENEFIT</span>
                      <div style={{ marginTop: 2 }}>{level.benefit}</div>
                    </div>

                    <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isUnlocked ? (
                        <>
                          <CheckCircle2 size={13} style={{ color: level.color }} />
                          <span style={{ fontSize: '0.65rem', color: level.color, fontWeight: 600 }}>
                            {isActive ? 'Active' : 'Unlocked'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock size={13} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Locked</span>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── CONTROLS TAB ──────────────────────────────────────── */}
        {tab === 'controls' && (
          <motion.div key="controls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Availability Toggle */}
              <div className="pinc-card">
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                  AVAILABILITY
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {sharingActive ? (
                      <Wifi size={18} style={{ color: 'var(--neon-green)' }} />
                    ) : (
                      <WifiOff size={18} style={{ color: 'var(--text-muted)' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Bandwidth Sharing
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {sharingActive ? 'Online — sharing bandwidth' : 'Offline — not sharing'}
                      </div>
                    </div>
                  </div>
                  <button
                    className={`pinc-btn ${sharingActive ? 'pinc-btn-danger' : 'pinc-btn-primary'}`}
                    onClick={toggleSharing}
                    disabled={loading}
                    style={{ fontSize: '0.72rem', padding: '0.4rem 1rem' }}
                  >
                    {loading ? (
                      <RefreshCw size={13} className="spin" />
                    ) : sharingActive ? (
                      <><WifiOff size={13} /> Stop</>
                    ) : (
                      <><Wifi size={13} /> Start</>
                    )}
                  </button>
                </div>
              </div>

              {/* Bandwidth Limit */}
              <div className="pinc-card">
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                  BANDWIDTH LIMIT
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Set maximum bandwidth to share (Mbps)
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      className="pinc-input"
                      type="number"
                      value={bandwidthLimit}
                      onChange={e => setBandwidthLimit(e.target.value)}
                      placeholder="e.g. 100"
                      style={{ flex: 1, fontSize: '0.82rem' }}
                    />
                    <button className="pinc-btn" style={{ fontSize: '0.72rem' }}>
                      Apply
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  Limit how much of your connection is shared with the network.
                </div>
              </div>

              {/* Pause / Resume */}
              <div className="pinc-card">
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                  QUICK ACTIONS
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="pinc-btn"
                    onClick={toggleSharing}
                    disabled={loading || !sharingActive}
                    style={{ flex: 1, fontSize: '0.72rem' }}
                  >
                    <Pause size={14} /> Pause Sharing
                  </button>
                  <button
                    className="pinc-btn pinc-btn-primary"
                    onClick={toggleSharing}
                    disabled={loading || sharingActive}
                    style={{ flex: 1, fontSize: '0.72rem' }}
                  >
                    <Play size={14} /> Resume Sharing
                  </button>
                </div>
              </div>

              {/* Auto-Reconnect Toggle */}
              <div className="pinc-card">
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>
                  CONNECTION
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <RefreshCw size={18} style={{ color: autoReconnect ? 'var(--neon-cyan)' : 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Auto-Reconnect
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {autoReconnect ? 'Enabled — reconnects on disconnect' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                  <button
                    className={`pinc-btn ${autoReconnect ? 'pinc-btn-primary' : ''}`}
                    onClick={() => setAutoReconnect(!autoReconnect)}
                    style={{
                      fontSize: '0.72rem', padding: '0.4rem 1rem',
                      borderColor: autoReconnect ? 'var(--neon-cyan)' : 'var(--border)',
                      color: autoReconnect ? 'var(--neon-cyan)' : 'var(--text-muted)',
                    }}
                  >
                    {autoReconnect ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
