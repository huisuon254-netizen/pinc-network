import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface WatchOnly {
  address: string;
  coin: string;
  derivation_path: string;
  index: number;
  qr_png_base64: string;
  is_watch_only: boolean;
  encrypted_xpub: string;
}

export default function WatchOnlyAddress({ coin, index }: { coin: string; index?: number }) {
  const [watch, setWatch] = useState<WatchOnly | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res: any = await invoke('cmd_get_watch_address', { coin, index: index ?? null });
      setWatch(res.watch as WatchOnly);
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  const allocate = async () => {
    setLoading(true);
    try {
      const res: any = await invoke('cmd_allocate_watch_address', { coin });
      setWatch(res.watch as WatchOnly);
    } catch (e) {
      setErr(String(e));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [coin, index]);

  if (loading && !watch) return <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Generating your deposit address…</div>;
  if (err) return <div style={{ fontSize: '0.7rem', color: 'var(--neon-red)' }}>{err}</div>;
  if (!watch) return null;

  return (
    <div className="pinc-card" style={{ padding: '1rem', borderColor: 'rgba(0,212,255,0.25)' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
        DEPOSIT ADDRESS — {watch.coin}
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {/* QR rendered server-side from the address */}
        {watch.qr_png_base64 && (
          <img
            src={watch.qr_png_base64}
            alt={`QR for ${watch.address}`}
            width={160}
            height={160}
            style={{ borderRadius: 8, border: '1px solid var(--border)', background: '#fff', padding: 6, imageRendering: 'pixelated' }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Your {watch.coin} deposit address</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--neon-green)', wordBreak: 'break-all', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)' }}>
            {watch.address}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
            Send only {watch.coin} to this address · No reuse · Credited after <span style={{ color: 'var(--neon-green)' }}>12 confirmations</span>.
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button onClick={load} className="pinc-btn" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}>Refresh address</button>
            <button onClick={allocate} className="pinc-btn pinc-btn-primary" style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}>Get new address</button>
          </div>
        </div>
      </div>
    </div>
  );
}
