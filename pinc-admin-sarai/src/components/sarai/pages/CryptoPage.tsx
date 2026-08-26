import { useState } from 'react';
import WatchOnlyAddress from '../shared/WatchOnlyAddress';
import { invoke } from '@tauri-apps/api/core';

export default function CryptoPage() {
  const [fxFrom, setFxFrom] = useState('USD');
  const [fxTo, setFxTo] = useState('KES');
  const [fxAmount, setFxAmount] = useState('1');
  const [fxQuote, setFxQuote] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchFx = async () => {
    try {
      const q = await invoke('cmd_get_fx_rate', { from: fxFrom, to: fxTo, amount: parseFloat(fxAmount) || 0 });
      setFxQuote(q);
      setErr(null);
    } catch (e) { setErr(String(e)); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>CRYPTO — WATCH-ONLY ADDRESSES & DEPOSIT INFO</div>

      <WatchOnlyAddress coin="BTC" />
      <WatchOnlyAddress coin="ETH" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <WatchOnlyAddress coin="USDT" />
        <WatchOnlyAddress coin="USDC" />
      </div>

      <div className="pinc-card" style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.5rem' }}>Currency Converter</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Live mid-market rates for 150 countries via CoinGecko/frankfurter.
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input value={fxFrom} onChange={e => setFxFrom(e.target.value.toUpperCase())} placeholder="USD" className="pinc-input" style={{ width: 80, fontFamily: 'monospace' }} />
          <span style={{ alignSelf: 'center', color: 'var(--text-muted)' }}>→</span>
          <input value={fxTo} onChange={e => setFxTo(e.target.value.toUpperCase())} placeholder="KES" className="pinc-input" style={{ width: 80, fontFamily: 'monospace' }} />
          <input value={fxAmount} onChange={e => setFxAmount(e.target.value)} placeholder="1" className="pinc-input" style={{ flex: 1, fontFamily: 'monospace' }} />
          <button onClick={fetchFx} className="pinc-btn pinc-btn-primary" style={{ fontSize: '0.7rem' }}>Convert</button>
        </div>
        {fxQuote && (
          <pre style={{ fontSize: '0.65rem', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 6, overflow: 'auto' }}>{JSON.stringify(fxQuote, null, 2)}</pre>
        )}
      </div>

      {err && <div style={{ fontSize: '0.7rem', color: 'var(--neon-red)' }}>{err}</div>}
    </div>
  );
}
