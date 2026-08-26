import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAdminStore } from '../../store/adminStore';
import { DollarSign, TrendingUp, ArrowUpCircle, ArrowDownCircle, Shield, Percent, Wallet, Users, History, RefreshCw, Zap, Coins, Database, ArrowLeftRight } from 'lucide-react';

export default function SaraiControlPage() {
  const { walletStats, loadWalletStats, saraiFeeSettings, loadSaraiFeeSettings, saveSaraiFeeSettings } = useAdminStore();
  const [editableFees, setEditableFees] = useState(saraiFeeSettings);
  const [adminBalances, setAdminBalances] = useState<any>(null);
  const [adminClients, setAdminClients] = useState<any>(null);
  const [adminTxs, setAdminTxs] = useState<any[]>([]);
  const [feeCfg, setFeeCfg] = useState<any>({ haircut: 0.025, hot_limit: 50000, cold_limit: 500000, agent_commission: 0.005, bridge_selection: 'Auto', swap_selection: 'Auto', kyc_enabled: false, kyc_level: 0 });
  const [rebalanceBusy, setRebalanceBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const STABLES = ['USDT', 'USDC', 'DAI', 'FDUSD', 'PYUSD'] as const;
  const WALLET_TYPES = ['fee', 'hot', 'cold', 'swap'] as const;

  const loadAdminAll = async () => {
    try {
      const [bal, clients, txs] = await Promise.allSettled([
        invoke<any>('cmd_admin_get_all_balances'),
        invoke<any>('cmd_admin_list_clients'),
        invoke<any>('cmd_admin_list_transactions'),
      ]);
      if (bal.status === 'fulfilled') {
        setAdminBalances(bal.value);
        if (bal.value?.fee_config) setFeeCfg((s: any) => ({ ...s, ...bal.value.fee_config, haircut: bal.value.fee_config.haircut ?? s.haircut, hot_limit: bal.value.fee_config.hot_limit ?? s.hot_limit, cold_limit: bal.value.fee_config.cold_limit ?? s.cold_limit, agent_commission: bal.value.fee_config.agent_commission ?? s.agent_commission }));
        if (bal.value?.extra) setFeeCfg((s: any) => ({ ...s, bridge_selection: bal.value.extra.bridge_selection ?? s.bridge_selection, swap_selection: bal.value.extra.swap_selection ?? s.swap_selection, kyc_enabled: bal.value.extra.kyc_enabled ?? s.kyc_enabled }));
      }
      if (clients.status === 'fulfilled') setAdminClients(clients.value);
      if (txs.status === 'fulfilled') setAdminTxs(Array.isArray(txs.value) ? txs.value : []);
    } catch {}
  };

  useEffect(() => {
    loadWalletStats();
    loadSaraiFeeSettings();
    loadAdminAll();
    const t = setInterval(() => { loadWalletStats(); loadAdminAll(); }, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setEditableFees(saraiFeeSettings);
  }, [saraiFeeSettings]);

  const handleSaveAdvFee = async () => {
    try {
      if (feeCfg.haircut < 0.02 || feeCfg.haircut > 0.03) { setSaveMsg('haircut must be 2-3%'); return; }
      await invoke('cmd_admin_set_fee_config', { config: feeCfg });
      setSaveMsg(`Saved haircut ${(feeCfg.haircut * 100).toFixed(2)}% hot ${feeCfg.hot_limit} cold ${feeCfg.cold_limit}`);
      setTimeout(() => setSaveMsg(null), 2500);
      loadAdminAll();
    } catch (e: any) { setSaveMsg(String(e)); }
  };
  const handleRebalance = async () => {
    setRebalanceBusy(true);
    try { await invoke('cmd_admin_force_rebalance'); setSaveMsg('Rebalanced OK'); loadAdminAll(); } catch (e: any) { setSaveMsg(String(e)); } finally { setRebalanceBusy(false); setTimeout(() => setSaveMsg(null), 2500); }
  };

  const internalMap: Record<string, number> = adminBalances?.internal || {};
  const totals = adminBalances?.totals || {};
  const identities: any[] = adminClients?.identities || [];
  const peers: any[] = adminClients?.peers || [];

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1300 }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}><Wallet size={16} style={{ color: '#D4AF37' }} /> SARAI Control Center — Admin 20 Wallets + Sinks</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>All internal wallets (fee/hot/cold/swap ×5 =20 + 5 admin sinks) • all transactions • active clients • fee/bridge/KYC tuning</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={loadAdminAll} style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.62rem', display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={12} /> Refresh</button>
          <button onClick={handleRebalance} disabled={rebalanceBusy} style={{ padding: '0.4rem 0.8rem', border: '1px solid #D4AF37', borderRadius: 6, background: '#D4AF37', color: '#0a0a0f', cursor: 'pointer', fontSize: '0.62rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={12} />{rebalanceBusy ? '…' : 'Force Rebalance'}</button>
        </div>
      </div>
      {saveMsg && <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 6, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', fontSize: '0.62rem' }}>{saveMsg}</div>}
      {/* 20 GRID + 5 sinks */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}><Coins size={12} style={{ color: '#D4AF37' }} /> INTERNAL WALLETS — fee / hot / cold / swap ×5 =20 + 5 admin sinks <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>total {totals.internal_total?.toFixed(2) ?? '0.00'} • fee {totals.fee_total?.toFixed(2) ?? '0.00'} • hot {totals.hot_total?.toFixed(2) ?? '0.00'} • cold {totals.cold_total?.toFixed(2) ?? '0.00'} • swap {totals.swap_total?.toFixed(2) ?? '0.00'}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '0.5rem', marginBottom: '0.6rem' }}>
          {STABLES.flatMap(stable => WALLET_TYPES.map(wt => {
            const key = `sarai:${wt}:${stable}`;
            const bal = internalMap[key] ?? 0;
            const bar = wt === 'fee' ? '#D4AF37' : wt === 'hot' ? '#00d4ff' : wt === 'cold' ? '#a855f7' : '#39ff14';
            return (
              <div key={key} style={{ background: 'var(--bg-card)', border: `1px solid var(--border)`, borderLeft: `3px solid ${bar}`, borderRadius: 6, padding: '0.6rem' }}>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>{wt.toUpperCase()} • {stable}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>${bal.toFixed(2)}</div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: 1 }}>{key}</div>
              </div>
            );
          }))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '0.5rem' }}>
          {STABLES.map(stable => {
            const key = `sarai:admin_fee:${stable}`;
            const bal = internalMap[key] ?? 0;
            return (
              <div key={key} style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 6, padding: '0.6rem' }}>
                <div style={{ fontSize: '0.5rem', color: '#D4AF37', fontWeight: 700 }}>ADMIN_FEE • {stable}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 800, color: '#D4AF37', marginTop: 2 }}>${bal.toFixed(2)}</div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: 1 }}>{key} • $10 pile</div>
              </div>
            );
          })}
        </div>
      </div>
      {/* ACTIVE CLIENTS + TX FEED */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.85rem', maxHeight: 340, overflow: 'auto' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}><Users size={12} /> ACTIVE CLIENTS — {identities.length} identities • {peers.filter((p:any)=>p.online).length} online peers</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.62rem' }}>
            <thead><tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}><th style={{ padding: '0.3rem' }}>NODE</th><th style={{ padding: '0.3rem' }}>USER</th><th style={{ padding: '0.3rem' }}>CREATED</th></tr></thead>
            <tbody>
              {identities.length === 0 ? <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No clients yet</td></tr> :
                identities.slice(0, 12).map((c:any) => <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '0.3rem', fontFamily: 'monospace', color: '#00ffcc', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.node_id}</td><td style={{ padding: '0.3rem' }}>{c.username || '—'}</td><td style={{ padding: '0.3rem', fontFamily: 'monospace', fontSize: '0.58rem', color: 'var(--text-muted)' }}>{c.created_at ? new Date(c.created_at*1000).toLocaleDateString() : '—'}</td></tr>)}
            </tbody>
          </table>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{peers.length} peers known • {adminBalances?.user_count ?? 0} user wallets • {adminBalances?.token_count ?? 0} token holdings</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.85rem', maxHeight: 340, overflow: 'auto' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}><History size={12} /> TRANSACTIONS — {adminTxs.length} total</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {adminTxs.length === 0 ? <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.62rem' }}>No transactions yet</div> :
              adminTxs.slice(0, 12).map((tx:any) => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: 'var(--bg-tertiary)', borderRadius: 6, fontSize: '0.62rem' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{tx.id?.slice(0,8)}… • {tx.tx_type || tx.status || '—'}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.from_node || tx.from || '—'} → {tx.to_node || tx.to || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800 }}>${(tx.amount ?? tx.total_amount ?? 0).toFixed(2)} <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{tx.currency || ''}</span></div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{tx.created_at ? new Date(tx.created_at*1000).toLocaleDateString() : ''}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      {/* ADV FEE/BRIDGE/KYC */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.85rem' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}><Percent size={12} /> ADV FEE — haircut 2-3% • hot/cold • agent</div>
          <label style={{ display: 'block', fontSize: '0.58rem', color: 'var(--text-muted)' }}>HAIRCUT {(feeCfg.haircut*100).toFixed(2)}%</label>
          <input type="range" min={0.02} max={0.03} step={0.001} value={feeCfg.haircut} onChange={e=>setFeeCfg((s:any)=>({...s, haircut: parseFloat(e.target.value)}))} style={{ width: '100%', accentColor: '#D4AF37' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
            <label><span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>HOT LIMIT</span><input type="number" value={feeCfg.hot_limit} onChange={e=>setFeeCfg((s:any)=>({...s, hot_limit: parseFloat(e.target.value)||0}))} style={{ width: '100%', padding: '0.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.62rem', marginTop: 2 }} /></label>
            <label><span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>COLD LIMIT</span><input type="number" value={feeCfg.cold_limit} onChange={e=>setFeeCfg((s:any)=>({...s, cold_limit: parseFloat(e.target.value)||0}))} style={{ width: '100%', padding: '0.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.62rem', marginTop: 2 }} /></label>
          </div>
          <label style={{ display: 'block', marginTop: '0.5rem' }}><span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>AGENT COMMISSION {(feeCfg.agent_commission*100).toFixed(2)}%</span><input type="range" min={0} max={0.1} step={0.001} value={feeCfg.agent_commission} onChange={e=>setFeeCfg((s:any)=>({...s, agent_commission: parseFloat(e.target.value)}))} style={{ width: '100%', accentColor: '#a855f7' }} /></label>
          <button onClick={handleSaveAdvFee} style={{ width: '100%', marginTop: '0.6rem', padding: '0.4rem', background: '#D4AF37', border: '1px solid #D4AF37', borderRadius: 6, color: '#0a0a0f', fontWeight: 700, fontSize: '0.62rem', cursor: 'pointer' }}>Save Fee Config</button>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.85rem' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}><ArrowLeftRight size={12} /> BRIDGE / SWAP • KYC</div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}><span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>BRIDGE</span><select value={feeCfg.bridge_selection} onChange={e=>setFeeCfg((s:any)=>({...s, bridge_selection: e.target.value}))} style={{ width: '100%', padding: '0.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.62rem', marginTop: 2 }}><option>Auto</option><option>CCTP</option><option>Across</option><option>Stargate</option><option>Hyperlane</option><option>Curve+1inch</option></select></label>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}><span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>SWAP</span><select value={feeCfg.swap_selection} onChange={e=>setFeeCfg((s:any)=>({...s, swap_selection: e.target.value}))} style={{ width: '100%', padding: '0.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.62rem', marginTop: 2 }}><option>Auto</option><option>1inch</option><option>Curve</option><option>Uniswap</option><option>Jupiter</option></select></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: '0.5rem' }}><input type="checkbox" checked={!!feeCfg.kyc_enabled} onChange={e=>setFeeCfg((s:any)=>({...s, kyc_enabled: e.target.checked}))} style={{ accentColor: '#39ff14' }} /><span style={{ fontSize: '0.62rem', fontWeight: 700 }}>KYC Required</span></label>
          <label style={{ display: 'block' }}><span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>KYC LEVEL 0-3</span><select value={feeCfg.kyc_level ?? 0} onChange={e=>setFeeCfg((s:any)=>({...s, kyc_level: parseInt(e.target.value)}))} style={{ width: '100%', padding: '0.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.62rem', marginTop: 2 }} disabled={!feeCfg.kyc_enabled}><option value={0}>0 — No KYC</option><option value={1}>1 — Basic</option><option value={2}>2 — Intermediate</option><option value={3}>3 — Full</option></select></label>
          <button onClick={handleSaveAdvFee} style={{ width: '100%', marginTop: '0.6rem', padding: '0.4rem', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 6, color: '#00d4ff', fontWeight: 700, fontSize: '0.62rem', cursor: 'pointer' }}>Save Bridge/Swap/KYC</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'TOTAL DEPOSITS', value: `$${walletStats.total_deposits.toLocaleString()}`, color: 'var(--neon-green)' },
          { label: 'TOTAL WITHDRAWALS', value: `$${walletStats.total_withdrawals.toLocaleString()}`, color: 'var(--accent-red)' },
          { label: 'DAILY VOLUME', value: `$${walletStats.daily_volume.toLocaleString()}`, color: 'var(--neon-cyan)' },
          { label: 'MONTHLY VOLUME', value: `$${walletStats.monthly_volume.toLocaleString()}`, color: 'var(--accent-purple)' },
          { label: 'FEE REVENUE', value: `$${walletStats.fee_revenue.toLocaleString()}`, color: 'var(--accent-yellow)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.7rem 0.85rem',
          }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem', marginBottom: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Percent size={14} /> FEE CONTROLS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
          {[
            { key: 'deposit_fee', label: 'Deposit Fee', icon: <ArrowDownCircle size={12} /> },
            { key: 'withdrawal_fee', label: 'Withdrawal Fee', icon: <ArrowUpCircle size={12} /> },
            { key: 'escrow_fee', label: 'Escrow Fee', icon: <Shield size={12} /> },
            { key: 'marketplace_fee', label: 'Marketplace Fee', icon: <DollarSign size={12} /> },
          ].map(f => (
            <div key={f.key} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem',
              background: 'var(--bg-tertiary)', borderRadius: 6,
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{f.icon}</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', flex: 1 }}>{f.label}</span>
              <input type="number" step="0.001" min="0" max="0.5"
                value={(editableFees as any)[f.key]}
                onChange={e => setEditableFees(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                style={{
                  width: 60, padding: '0.3rem 0.4rem', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', borderRadius: 4, color: 'var(--neon-green)',
                  fontSize: '0.7rem', textAlign: 'right',
                }} />
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>%</span>
            </div>
          ))}
        </div>
        <button onClick={() => saveSaraiFeeSettings(editableFees)} style={{
          marginTop: '0.75rem', padding: '0.4rem 1rem', background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, color: 'var(--neon-green)',
          cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
        }}>Save Fee Settings</button>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={14} /> FRAUD DETECTION
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {[
            { label: 'SUSPICIOUS TX', value: 3, color: 'var(--accent-yellow)' },
            { label: 'BOT DETECTED', value: 1, color: 'var(--accent-red)' },
            { label: 'FLAGGED', value: 7, color: 'var(--accent-orange)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-tertiary)', borderRadius: 6, padding: '0.6rem 0.75rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
