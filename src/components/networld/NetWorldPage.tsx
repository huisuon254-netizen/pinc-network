import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import {
  Globe, Gauge, Wifi, MapPin, Clock,
  RefreshCw, ArrowUpDown, Activity, Share2, Zap
} from 'lucide-react';
import type { SpeedTestResult } from '../../types';

interface NetWorldListing {
  listing_id: string;
  node_id: string;
  location: string;
  bandwidth_mbps: number;
  price_per_gb: number;
  available_hours: number;
  reputation: number;
  online: boolean;
}

type NetWorldTab = 'speed' | 'marketplace' | 'sell';

export default function NetWorldPage() {
  const [tab, setTab] = useState<NetWorldTab>('speed');
  const [speedResult, setSpeedResult] = useState<SpeedTestResult | null>(null);
  const [speedRunning, setSpeedRunning] = useState(false);
  const [listings, setListings] = useState<NetWorldListing[]>([]);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [sellBandwidth, setSellBandwidth] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellLocation, setSellLocation] = useState('');

  const loadListings = useCallback(async () => {
    try {
      const l = await invoke<any[]>('cmd_list_net_store_listings');
      setListings(l.map((x: any) => ({
        listing_id: x.listing_id ?? x.id ?? '',
        node_id: x.node_id ?? '',
        location: x.location ?? 'Unknown',
        bandwidth_mbps: x.bandwidth_mbps ?? x.speed_mbps ?? 0,
        price_per_gb: x.price_per_gb ?? 0,
        available_hours: x.available_hours ?? 0,
        reputation: x.reputation ?? 0,
        online: x.online ?? true,
      })));
    } catch { /* ok */ }
  }, []);

  const loadMyListings = useCallback(async () => {
    try {
      const l = await invoke<any[]>('cmd_get_my_listings');
      setMyListings(l);
    } catch { /* ok */ }
  }, []);

  useEffect(() => {
    loadListings();
    loadMyListings();
  }, [loadListings, loadMyListings]);

  const runSpeedTest = async () => {
    setSpeedRunning(true);
    setSpeedResult(null);
    try {
      const result = await invoke<SpeedTestResult>('cmd_run_speed_test');
      setSpeedResult(result);
    } catch (e) {
      console.error('Speed test failed:', e);
    }
    setSpeedRunning(false);
  };

  const createListing = async () => {
    const bw = parseInt(sellBandwidth);
    const price = parseFloat(sellPrice);
    if (isNaN(bw) || isNaN(price) || !sellLocation) return;
    try {
      await invoke('cmd_create_net_store_listing', {
        bandwidthMbps: bw,
        pricePerGb: price,
        location: sellLocation,
      });
      setSellBandwidth('');
      setSellPrice('');
      setSellLocation('');
      loadMyListings();
      loadListings();
    } catch (e) {
      console.error('Create listing failed:', e);
    }
  };

  const purchaseBandwidth = async (listingId: string) => {
    try {
      await invoke('cmd_purchase_bandwidth', { listingId, hours: 24 });
      loadListings();
    } catch (e) {
      console.error('Purchase failed:', e);
    }
  };

  const TABS: { id: NetWorldTab; label: string; icon: React.ReactNode }[] = [
    { id: 'speed', label: 'SPEED TEST', icon: <Gauge size={14} /> },
    { id: 'marketplace', label: 'MARKETPLACE', icon: <Globe size={14} /> },
    { id: 'sell', label: 'SELL BANDWIDTH', icon: <Share2 size={14} /> },
  ];

  const dlMbps = ((speedResult?.download_kbps ?? 0) / 1000).toFixed(1);
  const ulMbps = ((speedResult?.upload_kbps ?? 0) / 1000).toFixed(1);

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>NET WORLD</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Network Marketplace
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Buy/sell bandwidth on the PINC network
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.9rem', borderRadius: '4px',
            background: tab === t.id ? 'rgba(0,212,255,0.12)' : 'var(--bg-secondary)',
            border: `1px solid ${tab === t.id ? 'var(--electric-blue)' : 'var(--border)'}`,
            color: tab === t.id ? 'var(--electric-blue)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'monospace',
            letterSpacing: '0.06em', transition: 'all 0.15s',
          }}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Speed Test Tab */}
      {tab === 'speed' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="pinc-card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>NETWORK SPEED TEST</div>
              <span className="badge badge-info">REAL CDN</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Tests your actual connection speed against Cloudflare CDN endpoints. Measures download, upload, latency, and jitter.
            </div>

            <button onClick={runSpeedTest} disabled={speedRunning} className="pinc-btn" style={{ marginBottom: '1.5rem' }}>
              {speedRunning ? <RefreshCw size={14} className="pulse-glow" /> : <Gauge size={14} />}
              {speedRunning ? 'TESTING...' : 'RUN SPEED TEST'}
            </button>

            {speedResult && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                <SpeedCard label="DOWNLOAD" value={dlMbps} unit="Mbps" color="var(--neon-green)" icon={<ArrowUpDown size={14} />} />
                <SpeedCard label="UPLOAD" value={ulMbps} unit="Mbps" color="var(--electric-blue)" icon={<ArrowUpDown size={14} style={{ transform: 'rotate(180deg)' }} />} />
                <SpeedCard label="LATENCY" value={String(speedResult.latency_ms ?? 0)} unit="ms" color="var(--neon-yellow)" icon={<Clock size={14} />} />
                <SpeedCard label="JITTER" value={String(speedResult.jitter_ms ?? 0)} unit="ms" color="var(--soft-purple)" icon={<Activity size={14} />} />
              </div>
            )}

            {!speedResult && !speedRunning && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                Click "Run Speed Test" to measure your real connection speed
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Marketplace Tab */}
      {tab === 'marketplace' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="pinc-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>BANDWIDTH MARKETPLACE</div>
              <span className="badge badge-online">{listings.length} LISTINGS</span>
            </div>

            {listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <Globe size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <div>No bandwidth listings available yet.</div>
                <div style={{ marginTop: '0.5rem' }}>Be the first to sell your bandwidth on the network.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {listings.map(l => (
                  <div key={l.listing_id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
                    borderRadius: '4px', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: l.online ? 'rgba(57,255,20,0.1)' : 'rgba(255,34,85,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Wifi size={14} style={{ color: l.online ? 'var(--neon-green)' : 'var(--neon-red)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {l.location}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {(l.node_id ?? '').slice(0, 12)}...
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', fontWeight: 600, fontFamily: 'monospace' }}>
                          {l.bandwidth_mbps} Mbps
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          ${(l.price_per_gb ?? 0).toFixed(4)}/GB · {l.available_hours}h left
                        </div>
                      </div>
                      <button onClick={() => purchaseBandwidth(l.listing_id)} className="pinc-btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.65rem' }}>
                        BUY
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Sell Bandwidth Tab */}
      {tab === 'sell' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="pinc-card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>SELL YOUR BANDWIDTH</div>
              <span className="badge badge-pending">NET SHARE</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Share your internet connection with the PINC network. Set your price, define your bandwidth allocation, and earn tokens.
            </div>

            <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '400px' }}>
              <div>
                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>BANDWIDTH (Mbps)</label>
                <input type="number" value={sellBandwidth} onChange={e => setSellBandwidth(e.target.value)}
                  placeholder="100" className="pinc-input" />
              </div>
              <div>
                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>PRICE PER GB ($)</label>
                <input type="number" step="0.0001" value={sellPrice} onChange={e => setSellPrice(e.target.value)}
                  placeholder="0.001" className="pinc-input" />
              </div>
              <div>
                <label style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: '0.35rem' }}>LOCATION</label>
                <input type="text" value={sellLocation} onChange={e => setSellLocation(e.target.value)}
                  placeholder="us-east" className="pinc-input" />
              </div>
              <button onClick={createListing} className="pinc-btn pinc-btn-primary" disabled={!sellBandwidth || !sellPrice || !sellLocation}>
                <Share2 size={14} />
                CREATE LISTING
              </button>
            </div>
          </div>

          {myListings.length > 0 && (
            <div className="pinc-card">
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem' }}>MY LISTINGS</div>
              {myListings.map((l: any, i: number) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0',
                  borderBottom: i < myListings.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {l.location ?? 'Unknown'} — {l.bandwidth_mbps ?? 0} Mbps
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)', fontFamily: 'monospace' }}>
                    ${(l.price_per_gb ?? 0)}/GB
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function SpeedCard({ label, value, unit, color, icon }: {
  label: string; value: string; unit: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="pinc-card" style={{ padding: '0.75rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color, fontFamily: 'monospace' }}>
        {value} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{unit}</span>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${color}44, ${color}88, ${color}44)` }} />
    </div>
  );
}
