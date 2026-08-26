import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Wallet,
  Users,
  History,
  Settings,
  RefreshCw,
  Shield,
  ArrowLeftRight,
  Coins,
  TrendingUp,
  Activity,
  Zap,
  Database,
  Eye,
} from 'lucide-react';

type AdminTab = 'wallets' | 'transactions' | 'clients' | 'settings';

const STABLES = ['USDT', 'USDC', 'DAI', 'FDUSD', 'PYUSD'] as const;
const WALLET_TYPES = ['fee', 'hot', 'cold', 'swap'] as const;
const ADMIN_SINK = 'admin_fee' as const;

function formatAmount(n: number | null | undefined, decimals = 2) {
  const v = n ?? 0;
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function walletKey(stable: string, type: string) {
  return `sarai:${type}:${stable}`;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('wallets');
  const [loading, setLoading] = useState(true);
  const [balancesData, setBalancesData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [clientsData, setClientsData] = useState<any>(null);
  const [feeConfig, setFeeConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [rebalanceLoading, setRebalanceLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    haircut: 0.025,
    hot_limit: 50000,
    cold_limit: 500000,
    agent_commission: 0.005,
    bridge_selection: 'Auto',
    swap_selection: 'Auto',
    kyc_enabled: false,
    kyc_level: 0,
  });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bal, txs, clients, fee] = await Promise.allSettled([
        invoke<any>('cmd_admin_get_all_balances'),
        invoke<any>('cmd_admin_list_transactions'),
        invoke<any>('cmd_admin_list_clients'),
        invoke<any>('cmd_admin_get_fee_config'),
      ]);
      if (bal.status === 'fulfilled') {
        setBalancesData(bal.value);
        // sync fee config from balances if available
        if (bal.value?.fee_config) {
          const fc = bal.value.fee_config;
          setFeeConfig(fc);
          setSettingsForm((s) => ({
            ...s,
            haircut: fc.haircut ?? s.haircut,
            hot_limit: fc.hot_limit ?? s.hot_limit,
            cold_limit: fc.cold_limit ?? s.cold_limit,
            agent_commission: fc.agent_commission ?? fc.agentCommision ?? s.agent_commission,
          }));
        }
      } else {
        console.warn('bal failed', bal.reason);
      }
      if (txs.status === 'fulfilled') {
        const v = txs.value;
        setTransactions(Array.isArray(v) ? v : []);
      }
      if (clients.status === 'fulfilled') {
        setClientsData(clients.value);
      }
      if (fee.status === 'fulfilled') {
        setFeeConfig(fee.value);
        const f = fee.value;
        setSettingsForm((s) => ({
          ...s,
          haircut: f.haircut ?? s.haircut,
          hot_limit: f.hot_limit ?? s.hot_limit,
          cold_limit: f.cold_limit ?? s.cold_limit,
          agent_commission: f.agent_commission ?? s.agent_commission,
          bridge_selection: f.bridge_selection ?? s.bridge_selection,
          swap_selection: f.swap_selection ?? s.swap_selection,
          kyc_enabled: f.kyc_enabled ?? s.kyc_enabled,
          kyc_level: f.kyc_level ?? s.kyc_level,
        }));
      }
    } catch (e: any) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleForceRebalance = async () => {
    setRebalanceLoading(true);
    try {
      const res = await invoke<any>('cmd_admin_force_rebalance');
      // reload balances
      const bal = await invoke<any>('cmd_admin_get_all_balances');
      setBalancesData(bal);
      setSaveStatus(`Rebalanced ${res.count} wallets at ${new Date(res.timestamp * 1000).toLocaleTimeString()}`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e: any) {
      setSaveStatus(`Rebalance failed: ${String(e)}`);
    } finally {
      setRebalanceLoading(false);
    }
  };

  const handleSaveFeeConfig = async () => {
    setSaveStatus(null);
    try {
      // validate haircut 2-3%
      if (settingsForm.haircut < 0.02 || settingsForm.haircut > 0.03) {
        setSaveStatus('haircut must be 0.02-0.03 (2-3%)');
        return;
      }
      const payload = {
        haircut: settingsForm.haircut,
        hot_limit: settingsForm.hot_limit,
        cold_limit: settingsForm.cold_limit,
        agent_commission: settingsForm.agent_commission,
        bridge_selection: settingsForm.bridge_selection,
        swap_selection: settingsForm.swap_selection,
        kyc_enabled: settingsForm.kyc_enabled,
        kyc_level: settingsForm.kyc_level,
      };
      const res = await invoke<any>('cmd_admin_set_fee_config', { config: payload });
      setFeeConfig(res.fee_config);
      setSaveStatus(`Saved: haircut ${(res.haircut_percent ?? settingsForm.haircut * 100).toFixed(2)}% hot ${res.hot_limit} cold ${res.cold_limit}`);
      setTimeout(() => setSaveStatus(null), 3000);
      // reload balances to reflect new fee config totals
      const bal = await invoke<any>('cmd_admin_get_all_balances');
      setBalancesData(bal);
    } catch (e: any) {
      setSaveStatus(`Save failed: ${String(e)}`);
    }
  };

  const internalMap: Record<string, number> = balancesData?.internal || {};
  const totals = balancesData?.totals || {};
  const userBalances: any[] = balancesData?.user_balances || [];
  const tokenBalances: any[] = balancesData?.token_balances || [];

  const identities: any[] = clientsData?.identities || [];
  const peers: any[] = clientsData?.peers || [];

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <img
            src="/assets/images/sarai-logo-circle.png"
            alt="SARAI Admin"
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #D4AF37', boxShadow: '0 0 16px rgba(212,175,55,0.35)' }}
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.35rem', fontWeight: 900, color: '#D4AF37', letterSpacing: '0.12em', textShadow: '0 0 12px rgba(212,175,55,0.4)' }}>
              SARAI Admin
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.14em' }}>
              ALL BALANCES • ALL CLIENTS • SECURELY — Powered by PINC Platform
            </div>
          </div>
          <span
            style={{
              marginLeft: '0.5rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 999,
              fontSize: '0.58rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              background: 'rgba(212,175,55,0.15)',
              color: '#D4AF37',
              border: '1px solid rgba(212,175,55,0.35)',
            }}
          >
            ADMIN • WATCH-ONLY SEPARATE APK
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={loadAll} className="pinc-btn" style={{ padding: '0.45rem 0.9rem', fontSize: '0.72rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleForceRebalance}
            disabled={rebalanceLoading}
            className="pinc-btn pinc-btn-primary"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.72rem', background: '#D4AF37', borderColor: '#D4AF37', color: '#0a0a0f' }}
          >
            <Zap size={14} /> {rebalanceLoading ? 'Rebalancing…' : 'Force Rebalance'}
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div className="pinc-card" style={{ borderLeft: '3px solid #D4AF37', padding: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.62rem', letterSpacing: '0.08em', marginBottom: 6 }}>
            <Database size={12} /> INTERNAL TOTAL (25 wallets)
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 800, color: '#D4AF37' }}>${formatAmount(totals.internal_total)}</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Fee ${formatAmount(totals.fee_total)} • Hot ${formatAmount(totals.hot_total)} • Cold ${formatAmount(totals.cold_total)} • Swap ${formatAmount(totals.swap_total)}
          </div>
        </div>
        <div className="pinc-card" style={{ borderLeft: '3px solid #00d4ff', padding: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.62rem', letterSpacing: '0.08em', marginBottom: 6 }}>
            <Users size={12} /> ACTIVE CLIENTS
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{identities.length} identities</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {clientsData?.online_peers ?? 0} online peers • {clientsData?.wallet_count ?? userBalances.length} wallets • {tokenBalances.length} token holdings
          </div>
        </div>
        <div className="pinc-card" style={{ borderLeft: '3px solid #39ff14', padding: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.62rem', letterSpacing: '0.08em', marginBottom: 6 }}>
            <History size={12} /> TRANSACTIONS
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{transactions.length} total</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4 }}>wallet + billing + P2P • last {Math.min(transactions.length, 500)}</div>
        </div>
        <div className="pinc-card" style={{ borderLeft: '3px solid #ff2255', padding: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.62rem', letterSpacing: '0.08em', marginBottom: 6 }}>
            <Shield size={12} /> FEE & KYC
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {(feeConfig?.haircut_percent ?? settingsForm.haircut * 100).toFixed(2)}% haircut
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Hot ${formatAmount(feeConfig?.hot_limit ?? settingsForm.hot_limit)} • Cold ${formatAmount(feeConfig?.cold_limit ?? settingsForm.cold_limit)} • Agent {(feeConfig?.agent_commission_percent ?? settingsForm.agent_commission * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 6, background: 'rgba(255,34,85,0.08)', border: '1px solid rgba(255,34,85,0.3)', color: '#ff7a9a', fontSize: '0.72rem' }}>
          {error}
        </div>
      )}
      {saveStatus && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 6, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', fontSize: '0.72rem' }}>
          {saveStatus}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 6, border: '1px solid var(--border)', overflowX: 'auto' }}>
        {[
          { id: 'wallets', label: '20 Internal Wallets', icon: <Wallet size={14} />, count: internalMap ? Object.keys(internalMap).length : 0 },
          { id: 'transactions', label: 'Transactions', icon: <History size={14} />, count: transactions.length },
          { id: 'clients', label: 'Active Clients', icon: <Users size={14} />, count: identities.length },
          { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as AdminTab)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 4,
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              background: activeTab === t.id ? '#D4AF37' : 'transparent',
              color: activeTab === t.id ? '#0a0a0f' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t.icon} {t.label} {t.count !== undefined ? `(${t.count})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>Loading SARAI Admin data…</div>
      ) : (
        <>
          {/* WALLETS GRID */}
          {activeTab === 'wallets' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Coins size={14} style={{ color: '#D4AF37' }} /> INTERNAL WALLETS — fee / hot / cold / swap ×5 stables = 20 + 5 admin sinks
                </h3>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  hot_limit ${formatAmount(feeConfig?.hot_limit ?? settingsForm.hot_limit)} • cold_limit ${formatAmount(feeConfig?.cold_limit ?? settingsForm.cold_limit)} • pile ${formatAmount(feeConfig?.fee_pile_threshold ?? 10)}
                </span>
              </div>

              {/* 20 GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
                {STABLES.map((stable) =>
                  WALLET_TYPES.map((wt) => {
                    const key = walletKey(stable, wt);
                    const bal = internalMap[key] ?? 0;
                    const isHot = wt === 'hot';
                    const isCold = wt === 'cold';
                    const isFee = wt === 'fee';
                    const isSwap = wt === 'swap';
                    const limit = isHot ? feeConfig?.hot_limit ?? settingsForm.hot_limit : isCold ? feeConfig?.cold_limit ?? settingsForm.cold_limit : undefined;
                    const pct = limit ? Math.min(100, (bal / limit) * 100) : 0;
                    const barColor = isHot ? '#00d4ff' : isCold ? '#a855f7' : isFee ? '#D4AF37' : '#39ff14';
                    return (
                      <div key={key} className="pinc-card" style={{ padding: '0.75rem', borderLeft: `3px solid ${barColor}`, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.58rem', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                            {wt} • {stable}
                          </span>
                          <span style={{ fontSize: '0.58rem', padding: '0.15rem 0.4rem', borderRadius: 4, background: isFee ? 'rgba(212,175,55,0.15)' : isHot ? 'rgba(0,212,255,0.12)' : isCold ? 'rgba(168,85,247,0.12)' : 'rgba(57,255,20,0.1)', color: barColor, border: `1px solid ${barColor}33`, fontWeight: 700 }}>
                            {key}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>${formatAmount(bal, 2)}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{stable} • {wt} wallet • {stable === 'USDT' || stable === 'USDC' ? '6 dec' : '18 dec'}</div>
                        {limit && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ height: 4, borderRadius: 999, background: 'var(--bg-secondary)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct > 90 ? '#ff2255' : barColor, transition: 'width 0.3s' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                              <span>{pct.toFixed(1)}% of limit</span>
                              <span>limit ${formatAmount(limit)}</span>
                            </div>
                          </div>
                        )}
                        <div style={{ position: 'absolute', top: 6, right: 6, opacity: 0.08 }}>
                          {isFee ? <Coins size={28} /> : isHot ? <Zap size={28} /> : isCold ? <Database size={28} /> : <ArrowLeftRight size={28} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ADMIN SINKS */}
              <h4 style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', color: '#D4AF37', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={12} /> ADMIN SINKS — fee pile $10 per stable → admin_fee wallets (5)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
                {STABLES.map((stable) => {
                  const key = walletKey(stable, ADMIN_SINK);
                  const bal = internalMap[key] ?? 0;
                  return (
                    <div key={key} className="pinc-card" style={{ padding: '0.75rem', border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(212,175,55,0.04)', borderLeft: '3px solid #D4AF37' }}>
                      <div style={{ fontSize: '0.58rem', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.1em' }}>{ADMIN_SINK} • {stable}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 800, color: '#D4AF37', marginTop: 4 }}>${formatAmount(bal, 2)}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{key} • sink for $10 pile-ups</div>
                    </div>
                  );
                })}
              </div>

              {/* USER WALLET BALANCES */}
              <h4 style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={12} /> USER WALLET BALANCES — all crypto wallets (wallet_balances + wallet_balances_tokens)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.6rem' }}>
                {userBalances.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', border: '1px dashed var(--border)', borderRadius: 6 }}>
                    No user wallet balances yet — users appear after first identity • faucet
                  </div>
                ) : (
                  userBalances.slice(0, 12).map((u: any) => (
                    <div key={u.node_id} className="pinc-card" style={{ padding: '0.65rem' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.node_id}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>balance</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#39ff14' }}>${formatAmount(u.balance)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                        <span>escrow {formatAmount(u.escrow_locked)}</span>
                        <span>pending {formatAmount((u.pending_in ?? 0) + (u.pending_out ?? 0))}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {tokenBalances.length > 0 && (
                <>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', margin: '0.75rem 0 0.35rem', letterSpacing: '0.06em' }}>
                    TOKEN HOLDINGS (150 countries • wallet_balances_tokens) — {tokenBalances.length} entries
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
                    {tokenBalances.slice(0, 12).map((t: any) => (
                      <div key={`${t.node_id}-${t.token_symbol}`} className="pinc-card" style={{ padding: '0.6rem' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t.token_symbol}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{t.name} • {t.token_type}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 800, marginTop: 4 }}>${formatAmount(t.balance, t.token_symbol === 'BTC' ? 8 : 2)}</div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.node_id}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <History size={14} style={{ color: '#D4AF37' }} /> ALL TRANSACTIONS — wallet + billing + P2P (active clients)
                </h3>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{transactions.length} records • sorted desc</span>
              </div>
              <div className="pinc-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ maxHeight: 560, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                      <tr style={{ textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '0.6rem 0.75rem' }}>TIME</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>ID</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>FROM → TO</th>
                        <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>AMOUNT</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>TYPE</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>STATUS</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>SOURCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No transactions yet — faucet / transfer / P2P will appear here
                          </td>
                        </tr>
                      ) : (
                        transactions.slice(0, 200).map((tx: any) => (
                          <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,212,255,0.04)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.62rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {tx.created_at ? new Date(tx.created_at * 1000).toLocaleString() : '—'}
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.62rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.id?.slice(0, 12)}…</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.62rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{tx.from_node || tx.from || tx.buyer_node_id || tx.payer_node_id || '—'}</span>
                              <span style={{ color: 'var(--text-muted)', margin: '0 0.3rem' }}>→</span>
                              <span style={{ color: 'var(--text-primary)' }}>{tx.to_node || tx.to || tx.agent_id || tx.payee_node_id || tx.peer_id || '—'}</span>
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: tx.amount > 1000 ? '#D4AF37' : 'var(--text-primary)' }}>
                              ${formatAmount(tx.amount ?? tx.total_amount ?? 0)}
                              <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginLeft: 4 }}>{tx.currency || 'PINC'}</span>
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <span style={{ padding: '0.15rem 0.35rem', borderRadius: 4, fontSize: '0.58rem', fontWeight: 700, background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.25)' }}>
                                {tx.tx_type || tx.type || '—'}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <span
                                style={{
                                  padding: '0.15rem 0.35rem',
                                  borderRadius: 4,
                                  fontSize: '0.58rem',
                                  fontWeight: 700,
                                  background: String(tx.status).toLowerCase().includes('confirm') || String(tx.status).toLowerCase().includes('complete') ? 'rgba(57,255,20,0.1)' : 'rgba(255,230,0,0.1)',
                                  color: String(tx.status).toLowerCase().includes('confirm') || String(tx.status).toLowerCase().includes('complete') ? '#39ff14' : '#ffe600',
                                  border: `1px solid ${String(tx.status).toLowerCase().includes('confirm') ? 'rgba(57,255,20,0.3)' : 'rgba(255,230,0,0.3)'}`,
                                }}
                              >
                                {tx.status || '—'}
                              </span>
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.58rem', color: 'var(--text-muted)' }}>{tx.source || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CLIENTS */}
          {activeTab === 'clients' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="pinc-card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>IDENTITIES COUNT</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 900, color: '#D4AF37', marginTop: 4 }}>{identities.length}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>total clients ever created</div>
                </div>
                <div className="pinc-card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>ONLINE PEERS</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 900, color: '#39ff14', marginTop: 4 }}>{peers.filter((p: any) => p.online).length}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{peers.length} total peers known</div>
                </div>
                <div className="pinc-card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>WALLETS TRACKED</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 900, color: '#00d4ff', marginTop: 4 }}>{userBalances.length + tokenBalances.length}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{userBalances.length} PINC • {tokenBalances.length} tokens</div>
                </div>
              </div>

              <h3 style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={14} style={{ color: '#D4AF37' }} /> ACTIVE CLIENTS — identities (PINC IDs)
              </h3>
              <div className="pinc-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ maxHeight: 380, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                      <tr style={{ textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '0.6rem 0.75rem' }}>NODE ID / PINC</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>USERNAME</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>NAME</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>CREATED</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>FINGERPRINT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {identities.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No identities yet — clients appear after onboarding
                          </td>
                        </tr>
                      ) : (
                        identities.map((c: any) => (
                          <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#00ffcc', fontSize: '0.68rem' }}>{c.node_id}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{c.username || '—'}</td>
                            <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.62rem', color: 'var(--text-muted)' }}>{c.created_at ? new Date(c.created_at * 1000).toLocaleDateString() : '—'}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.58rem', color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.fingerprint?.slice(0, 16)}…</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <h3 style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={14} style={{ color: '#39ff14' }} /> ONLINE PEERS — mesh registry
              </h3>
              <div className="pinc-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ maxHeight: 320, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                      <tr style={{ textAlign: 'left', fontSize: '0.62rem', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '0.6rem 0.75rem' }}>PEER ID</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>ADDRESS</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>TRUST</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>LAST SEEN</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>ONLINE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {peers.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No peers yet — mesh will populate after P2P connects
                          </td>
                        </tr>
                      ) : (
                        peers.map((p: any) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.id}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.62rem', color: 'var(--text-muted)' }}>{p.address}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace' }}>{(p.trust_score ?? 0).toFixed(2)}</td>
                            <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.62rem', color: 'var(--text-muted)' }}>{p.last_seen ? new Date(p.last_seen * 1000).toLocaleString() : '—'}</td>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <span className={p.online ? 'badge badge-online' : 'badge badge-offline'} style={{ fontSize: '0.58rem' }}>{p.online ? 'online' : 'offline'}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1rem' }}>
              <div className="pinc-card" style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={14} style={{ color: '#D4AF37' }} /> FEE TUNING — 2-3% haircut
                </h3>
                <label style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.06em' }}>
                  HAIRCUT (0.02 — 0.03) — {(settingsForm.haircut * 100).toFixed(2)}%
                </label>
                <input
                  type="range"
                  min={0.02}
                  max={0.03}
                  step={0.001}
                  value={settingsForm.haircut}
                  onChange={(e) => setSettingsForm((s) => ({ ...s, haircut: parseFloat(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#D4AF37' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                  <span>2.00%</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#D4AF37' }}>{(settingsForm.haircut * 100).toFixed(2)}%</span>
                  <span>3.00%</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.85rem' }}>
                  <label style={{ display: 'block' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>HOT LIMIT (per stable)</span>
                    <input
                      type="number"
                      value={settingsForm.hot_limit}
                      onChange={(e) => setSettingsForm((s) => ({ ...s, hot_limit: parseFloat(e.target.value) || 0 }))}
                      className="pinc-input"
                      style={{ marginTop: 4, fontFamily: 'monospace' }}
                    />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>COLD LIMIT (per stable)</span>
                    <input
                      type="number"
                      value={settingsForm.cold_limit}
                      onChange={(e) => setSettingsForm((s) => ({ ...s, cold_limit: parseFloat(e.target.value) || 0 }))}
                      className="pinc-input"
                      style={{ marginTop: 4, fontFamily: 'monospace' }}
                    />
                  </label>
                </div>
                <label style={{ display: 'block', marginTop: '0.85rem' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>AGENT COMMISSION — {(settingsForm.agent_commission * 100).toFixed(2)}% (platform slice 0-10%)</span>
                  <input
                    type="range"
                    min={0}
                    max={0.1}
                    step={0.001}
                    value={settingsForm.agent_commission}
                    onChange={(e) => setSettingsForm((s) => ({ ...s, agent_commission: parseFloat(e.target.value) }))}
                    style={{ width: '100%', marginTop: 4, accentColor: '#a855f7' }}
                  />
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                  <span>0%</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>${formatAmount(settingsForm.agent_commission * 100000)} per 100k</span>
                  <span>10%</span>
                </div>
              </div>

              <div className="pinc-card" style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ArrowLeftRight size={14} style={{ color: '#00d4ff' }} /> BRIDGE / SWAP SELECTION
                </h3>
                <label style={{ display: 'block', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>BRIDGE (cheapest route • CCTP V2 gas $0.24-0.5)</span>
                  <select
                    value={settingsForm.bridge_selection}
                    onChange={(e) => setSettingsForm((s) => ({ ...s, bridge_selection: e.target.value }))}
                    className="pinc-input"
                    style={{ marginTop: 4 }}
                  >
                    <option value="Auto">Auto — cheapest_quote (CCTP/Across/Stargate/Hyperlane)</option>
                    <option value="CCTP">CCTP V2 — USDC only, $0.30 gas, 0% fee</option>
                    <option value="Across">Across — 0.04% + $0.18 gas</option>
                    <option value="Stargate">Stargate — 0.06% + $0.22 gas</option>
                    <option value="Hyperlane">Hyperlane — 0.08% + $0.28 gas</option>
                    <option value="Curve+1inch">Curve+1inch — 0.04% + $0.30</option>
                  </select>
                </label>
                <label style={{ display: 'block', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>SWAP (DEX aggregator)</span>
                  <select
                    value={settingsForm.swap_selection}
                    onChange={(e) => setSettingsForm((s) => ({ ...s, swap_selection: e.target.value }))}
                    className="pinc-input"
                    style={{ marginTop: 4 }}
                  >
                    <option value="Auto">Auto — 1inch Fusion / LI.FI net_out</option>
                    <option value="1inch">1inch Fusion — best price</option>
                    <option value="Curve">Curve — stable pools low slippage</option>
                    <option value="Uniswap">Uniswap V3</option>
                    <option value="Jupiter">Jupiter — Solana</option>
                  </select>
                </label>
                <div style={{ marginTop: '0.85rem', padding: '0.65rem', borderRadius: 6, background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.18)', fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: '#00d4ff' }}>Cheapest quote logic:</strong> net_out = quoted − gas − fee • pick min total_fee where profit &gt; 0 (haircut × amount − fee). See InternalWalletEngine::cheapest_quote.
                </div>
              </div>

              <div className="pinc-card" style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={14} style={{ color: '#39ff14' }} /> KYC & COMPLIANCE
                </h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginBottom: '0.65rem' }}>
                  <input
                    type="checkbox"
                    checked={settingsForm.kyc_enabled}
                    onChange={(e) => setSettingsForm((s) => ({ ...s, kyc_enabled: e.target.checked }))}
                    style={{ accentColor: '#39ff14', width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>KYC Required for new clients</span>
                </label>
                <label style={{ display: 'block', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>KYC LEVEL (0-3)</span>
                  <select
                    value={settingsForm.kyc_level}
                    onChange={(e) => setSettingsForm((s) => ({ ...s, kyc_level: parseInt(e.target.value) }))}
                    className="pinc-input"
                    style={{ marginTop: 4 }}
                    disabled={!settingsForm.kyc_enabled}
                  >
                    <option value={0}>0 — No KYC (watch-only)</option>
                    <option value={1}>1 — Basic (phone + email)</option>
                    <option value={2}>2 — Intermediate (ID + selfie)</option>
                    <option value={3}>3 — Full (ID + address + liveness)</option>
                  </select>
                </label>
                <div style={{ marginTop: '0.85rem', padding: '0.65rem', borderRadius: 6, background: 'rgba(57,255,20,0.06)', border: '1px solid rgba(57,255,20,0.18)', fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  KYC is admin-controlled. SARAI APK is watch-only; ADMIN APK holds xpub in HSM and verifies KYC before allocating watch addresses. Gap limit 20 • no reuse.
                </div>
                <button
                  onClick={handleSaveFeeConfig}
                  className="pinc-btn pinc-btn-primary"
                  style={{ width: '100%', marginTop: '1rem', background: '#D4AF37', borderColor: '#D4AF37', color: '#0a0a0f', fontWeight: 800, letterSpacing: '0.06em' }}
                >
                  <Settings size={14} /> Save Fee • Bridge • Swap • KYC
                </button>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                  Persisted in app_settings • sarai_admin_fee_config • sarai_bridge_selection • sarai_kyc_enabled
                </div>
              </div>

              <div className="pinc-card" style={{ padding: '1rem' }}>
                <h3 style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={14} style={{ color: '#a855f7' }} /> STAFF & AUDIT
                </h3>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <p>• Admin sees <strong style={{ color: '#D4AF37' }}>all 25 internal wallets</strong> (20 + 5 sinks) — read-only ledger, SARAI APK cannot generate.</p>
                  <p style={{ marginTop: 6 }}>• All transactions feed merges wallet_transactions + billing_transactions + p2p_deposit_orders.</p>
                  <p style={{ marginTop: 6 }}>• Active clients = identities count + online peers from peer registry.</p>
                  <p style={{ marginTop: 6 }}>• Force Rebalance drains excess hot {'>'} 50k and cold {'>'} 500k → swap; then pile $10 fee → admin_fee.</p>
                  <p style={{ marginTop: 6 }}>• Bridge/swap selection influences cheapest_quote route priority.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button onClick={loadAll} className="pinc-btn" style={{ flex: 1, fontSize: '0.68rem' }}>
                    <RefreshCw size={12} /> Reload
                  </button>
                  <button onClick={handleForceRebalance} disabled={rebalanceLoading} className="pinc-btn" style={{ flex: 1, fontSize: '0.68rem' }}>
                    <Zap size={12} /> {rebalanceLoading ? '…' : 'Rebalance'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <footer style={{ marginTop: '1.5rem', padding: '0.75rem', textAlign: 'center', fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.08em', borderTop: '1px solid var(--border)' }}>
        SARAI Admin v3.0 • productName SARAI Admin • identifier com.pinc.sarai.admin • separate from SARAI APK • icons circular gold • Tauri • © PINC Platform
      </footer>
    </div>
  );
}
