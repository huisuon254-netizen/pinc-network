import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { RefreshCw, Search, WalletCards, ShieldCheck, ShieldOff } from 'lucide-react';

const CRYPTO_SYMBOLS: Record<string, string> = {
  NATIVE: '#F7931A', BTC: '#F7931A', ETH: '#627EEA', USDT: '#26A17B',
  BNB: '#F3BA2F', SOL: '#9945FF', XRP: '#00AAE4', ADA: '#0033AD',
  DOGE: '#C2A633', AVAX: '#E84142', MATIC: '#8247E5', DOT: '#E6007A',
  LINK: '#2A5ADA', UNI: '#FF007A', LTC: '#BFBBBB', BCH: '#8DC351',
  XLM: '#14B6E7', ALGO: '#000000', ATOM: '#118C49', OP: '#FF0420',
};
const NATIVE_SYMBOLS = new Set(['NATIVE']);

export default function WalletManagementPage() {
  const { walletTypes, loadWalletTypes, walletBalances, loadWalletBalances } = useAdminStore();
  const [search, setSearch] = useState('');
  const [onlyEnabled, setOnlyEnabled] = useState(false);

  useEffect(() => {
    loadWalletTypes();
    loadWalletBalances();
  }, []);

  const filteredTypes = walletTypes.filter(w => {
    if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    if (onlyEnabled && !w.enabled) return false;
    return true;
  });

  const balanceMap = new Map<string, number>();
  walletBalances.forEach(b => {
    const key = b.currency.toLowerCase();
    balanceMap.set(key, (balanceMap.get(key) || 0) + b.balance);
  });

  const totalBalance = Array.from(balanceMap.values()).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Wallet Management</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{walletTypes.length} wallet types configured · Total platform balance: ${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
        <button onClick={() => { loadWalletTypes(); loadWalletBalances(); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: 'var(--neon-green)', cursor: 'pointer', fontSize: '0.65rem' }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            placeholder="Search wallets by name or symbol..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.5rem 0.4rem 1.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.65rem' }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.4rem 0.75rem', background: onlyEnabled ? 'rgba(16,185,129,0.1)' : 'var(--bg-tertiary)', border: `1px solid ${onlyEnabled ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`, borderRadius: 6, cursor: 'pointer', fontSize: '0.65rem', color: onlyEnabled ? 'var(--neon-green)' : 'var(--text-secondary)' }}>
          <input type="checkbox" checked={onlyEnabled} onChange={e => setOnlyEnabled(e.target.checked)} style={{ accentColor: 'var(--neon-green)' }} />
          Enabled only
        </label>
      </div>

      {/* Wallet Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem' }}>
        {filteredTypes.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }}>
            {search ? 'No wallets matching your search' : 'No wallet types configured'}
          </div>
        )}
        {filteredTypes.map(w => {
          const key = w.symbol.toUpperCase();
          const color = CRYPTO_SYMBOLS[key] || 'var(--neon-cyan)';
          const bal = balanceMap.get(w.symbol.toLowerCase()) || 0;
          const isNative = NATIVE_SYMBOLS.has(key);
          return (
            <div key={w.id} style={{ background: 'var(--bg-card)', border: `1px solid ${w.enabled ? 'var(--border)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 8, padding: '0.85rem', opacity: w.enabled ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color, fontFamily: 'monospace' }}>
                    {w.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{w.name}</div>
                    <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{w.network}</div>
                  </div>
                </div>
                {w.enabled ? <ShieldCheck size={14} color="var(--neon-green)" /> : <ShieldOff size={14} color="var(--accent-red)" />}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Platform Balance</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--neon-green)' }}>${bal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              {isNative && <div style={{ fontSize: '0.5rem', color: 'var(--accent-yellow)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 4, padding: '0.15rem 0.4rem', display: 'inline-block', marginTop: '0.35rem' }}>NATIVE CURRENCY</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
