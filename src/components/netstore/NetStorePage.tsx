import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Zap, Star, Clock, Shield, RefreshCw, ShoppingCart, Package } from 'lucide-react';
import { useI18n } from '../../i18n';

interface StoreListing {
  id: string;
  provider_node_id: string;
  bandwidth_mbps: number;
  price_per_hour: number;
  location: string;
  rating: number;
  status: string;
}

interface BandwidthPurchase {
  id: string;
  listing_id: string;
  provider_node_id: string;
  bandwidth_mbps: number;
  price_paid: number;
  purchased_at: number;
  expires_at: number;
  active: boolean;
}

export default function NetStorePage() {
  const { t } = useI18n();
  const [listings, setListings] = useState<StoreListing[]>([]);
  const [purchases, setPurchases] = useState<BandwidthPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'browse' | 'purchases'>('browse');

  const loadListings = async () => {
    setLoading(true);
    try {
      const data = await invoke<StoreListing[]>('cmd_get_store_listings');
      setListings(data);
    } catch {
      setListings([
        { id: '1', provider_node_id: 'node_a1b2c3d4', bandwidth_mbps: 100, price_per_hour: 0.5, location: 'US-East', rating: 4.8, status: 'available' },
        { id: '2', provider_node_id: 'node_e5f6g7h8', bandwidth_mbps: 500, price_per_hour: 1.2, location: 'EU-West', rating: 4.5, status: 'available' },
        { id: '3', provider_node_id: 'node_i9j0k1l2', bandwidth_mbps: 1000, price_per_hour: 2.0, location: 'AP-South', rating: 4.2, status: 'available' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadPurchases = async () => {
    try {
      const data = await invoke<BandwidthPurchase[]>('cmd_get_bandwidth_purchases');
      setPurchases(data);
    } catch {
      setPurchases([]);
    }
  };

  useEffect(() => {
    loadListings();
    loadPurchases();
  }, []);

  const purchaseBandwidth = async (listing: StoreListing) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('cmd_purchase_bandwidth', { listingId: listing.id });
      loadPurchases();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts: number) => new Date(ts * 1000).toLocaleString();

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} style={{ color: 'var(--lion-gold)' }} />
            {t('netstore.title') || 'NET STORE'}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginTop: 4 }}>
            {t('netstore.subtitle') || 'Purchase bandwidth from the decentralized network'}
          </div>
        </div>
        <button className="pinc-btn" onClick={loadListings} disabled={loading} style={{ fontSize: '0.72rem' }}>
          <RefreshCw size={12} /> {t('netstore.refresh') || 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
        {(['browse', 'purchases'] as const).map(id => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '0.6rem', fontSize: '0.72rem', fontFamily: 'monospace',
            background: tab === id ? 'rgba(0,212,255,0.08)' : 'transparent',
            border: 'none', borderBottom: tab === id ? '2px solid var(--electric-blue)' : '2px solid transparent',
            color: tab === id ? 'var(--electric-blue)' : 'var(--text-muted)',
            cursor: 'pointer', letterSpacing: '0.06em',
          }}>
            {id === 'browse' ? (t('netstore.browse') || 'Browse Listings') : (t('netstore.purchases') || 'My Purchases')}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: '0.5rem', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
          borderRadius: 4, fontSize: '0.7rem', color: 'var(--neon-red)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {tab === 'browse' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {listings.map(listing => (
            <div key={listing.id} className="pinc-card" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Zap size={18} style={{ color: 'var(--electric-blue)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {listing.bandwidth_mbps} Mbps
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Shield size={10} /> {listing.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Star size={10} style={{ color: 'var(--lion-gold)' }} /> {listing.rating.toFixed(1)}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    {listing.provider_node_id.slice(0, 12)}...
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--lion-gold)' }}>
                    {listing.price_per_hour.toFixed(2)} PINC
                  </div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>per hour</div>
                </div>
                <button className="pinc-btn pinc-btn-primary" onClick={() => purchaseBandwidth(listing)}
                  disabled={loading} style={{ fontSize: '0.72rem', padding: '0.5rem 0.875rem' }}>
                  <ShoppingCart size={12} /> {t('netstore.buy') || 'Buy'}
                </button>
              </div>
            </div>
          ))}
          {listings.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Package size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              {t('netstore.noListings') || 'No listings available'}
            </div>
          )}
        </div>
      )}

      {tab === 'purchases' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {purchases.map(p => (
            <div key={p.id} className="pinc-card" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: p.active ? 'rgba(0,212,255,0.1)' : 'rgba(100,100,122,0.1)',
                  border: `1px solid ${p.active ? 'rgba(0,212,255,0.2)' : 'rgba(100,100,122,0.2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Zap size={18} style={{ color: p.active ? 'var(--electric-blue)' : 'var(--text-muted)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {p.bandwidth_mbps} Mbps
                  </div>
                  <div style={{ fontSize: '0.65rem', color: p.active ? 'var(--neon-green)' : 'var(--text-muted)', marginTop: 2 }}>
                    {p.active ? (t('netstore.active') || 'Active') : (t('netstore.expired') || 'Expired')}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--lion-gold)', fontWeight: 600 }}>{p.price_paid.toFixed(2)} PINC</div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, justifyContent: 'flex-end' }}>
                  <Clock size={10} /> {formatTime(p.purchased_at)}
                </div>
              </div>
            </div>
          ))}
          {purchases.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Package size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              {t('netstore.noPurchases') || 'No purchases yet'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
