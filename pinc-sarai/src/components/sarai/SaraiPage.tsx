import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Send,
  MessageSquare,
  History,
  Settings,
  Inbox,
  ArrowRightLeft,
  Coins,
  TrendingUp,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store/appStore';
import { useI18n } from '../../i18n';

import DashboardPage from './pages/DashboardPage';
import DepositPage from './pages/DepositPage';
import WithdrawPage from './pages/WithdrawPage';
import SendPage from './pages/SendPage';
import RequestPage from './pages/RequestPage';
import MessagesPage from './pages/MessagesPage';
import HistoryPage from './pages/HistoryPage';
import SettingPage from './pages/SettingPage';
import CryptoPage from './pages/CryptoPage';
import MarketPage from './pages/MarketPage';
import WalletPage from './pages/WalletPage';

export type Tab = 'dashboard' | 'wallet' | 'deposit' | 'withdraw' | 'send' | 'request' | 'messages' | 'history' | 'crypto' | 'market' | 'setting';

export const TABS: { id: Tab; labelKey: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', labelKey: 'app.dashboard', icon: <Wallet size={14} /> },
  { id: 'wallet', labelKey: 'app.wallet', icon: <Coins size={14} /> },
  { id: 'deposit', labelKey: 'app.deposit', icon: <ArrowDownToLine size={14} /> },
  { id: 'withdraw', labelKey: 'app.withdraw', icon: <ArrowUpFromLine size={14} /> },
  { id: 'send', labelKey: 'app.send', icon: <Send size={14} /> },
  { id: 'request', labelKey: 'app.request', icon: <Inbox size={14} /> },
  { id: 'messages', labelKey: 'app.messages', icon: <MessageSquare size={14} /> },
  { id: 'history', labelKey: 'app.history', icon: <History size={14} /> },
  { id: 'crypto', labelKey: 'app.crypto', icon: <Coins size={14} /> },
  { id: 'market', labelKey: 'app.market', icon: <TrendingUp size={14} /> },
  { id: 'setting', labelKey: 'app.settings', icon: <Settings size={14} /> },
];

// Keep silver badge map for other pages that import it
export const statusBadge: Record<string, { bg: string; fg: string; border: string }> = {
  completed: { bg: 'rgba(57,255,20,0.1)', fg: 'var(--neon-green)', border: 'rgba(57,255,20,0.3)' },
  pending: { bg: 'rgba(255,230,0,0.1)', fg: 'var(--neon-yellow)', border: 'rgba(255,230,0,0.3)' },
  failed: { bg: 'rgba(255,34,85,0.1)', fg: 'var(--neon-red)', border: 'rgba(255,34,85,0.3)' },
  EscrowHeld: { bg: 'rgba(192,192,192,0.15)', fg: '#C0C0C0', border: 'rgba(192,192,192,0.4)' },
  PaymentConfirmed: { bg: 'rgba(192,192,192,0.15)', fg: '#C0C0C0', border: 'rgba(192,192,192,0.4)' },
  Disputed: { bg: 'rgba(255,34,85,0.15)', fg: 'var(--neon-red)', border: 'rgba(255,34,85,0.5)' },
  Cancelled: { bg: 'rgba(74,85,104,0.15)', fg: 'var(--text-muted)', border: 'rgba(74,85,104,0.3)' },
  Completed: { bg: 'rgba(57,255,20,0.1)', fg: 'var(--neon-green)', border: 'rgba(57,255,20,0.3)' },
  PendingPayment: { bg: 'rgba(255,230,0,0.1)', fg: 'var(--neon-yellow)', border: 'rgba(255,230,0,0.3)' },
};

// Re-export helpers for legacy imports if any
export const formatAmount = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SaraiPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [balance, setBalance] = useState<{ balance: number; pending: number; total_earned: number } | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [b, txs] = await Promise.allSettled([
          invoke<{ balance: number; pending: number; total_earned: number }>('cmd_get_wallet_balance'),
          invoke<any[]>('cmd_get_transactions'),
        ]);
        if (b.status === 'fulfilled') setBalance(b.value as any);
        if (txs.status === 'fulfilled') setTransactions(txs.value as any);
        // also sync to store for history
        try {
          const store = useAppStore.getState();
          if (txs.status === 'fulfilled') store.transactions = txs.value as any;
          if (b.status === 'fulfilled') {
            const raw: any = b.value;
            store.walletBalance = {
              balance: raw.balance ?? 0,
              pending: (raw.pending_deposits ?? 0) + (raw.pending_withdrawals ?? raw.pending ?? 0),
              total_earned: raw.balance ?? 0,
            };
          }
        } catch {}
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>
          DECENTRALIZED FINANCE SYSTEM — Stable 2: USDT / USDC
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/assets/images/sarai-logo.png"
            alt="SARAI logo"
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', boxShadow: '0 0 10px rgba(212,175,55,0.35)' }}
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.08em' }}>SARAI</div>
          <div
            style={{
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.6rem',
              fontWeight: 600,
              background: 'rgba(0,212,255,0.1)',
              color: 'var(--electric-blue)',
              border: '1px solid rgba(0,212,255,0.3)',
            }}
          >
            v3.0 · escrow inbuilt
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1.5rem',
          background: 'var(--bg-secondary)',
          padding: '0.25rem',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          overflowX: 'auto',
          flexWrap: 'nowrap',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
              background: activeTab === tab.id ? 'var(--electric-blue)' : 'transparent',
              color: activeTab === tab.id ? 'var(--bg-primary)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon}
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('common.loading')}</div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardPage balance={balance} transactions={transactions} />}
              {activeTab === 'wallet' && <WalletPage />}
              {activeTab === 'deposit' && <DepositPage />}
              {activeTab === 'withdraw' && <WithdrawPage />}
              {activeTab === 'send' && <SendPage />}
              {activeTab === 'request' && <RequestPage />}
              {activeTab === 'messages' && <MessagesPage />}
              {activeTab === 'history' && <HistoryPage />}
              {activeTab === 'crypto' && <CryptoPage />}
              {activeTab === 'market' && <MarketPage />}
              {activeTab === 'setting' && <SettingPage />}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Unused legacy icons kept for statusBadge reference
void ArrowRightLeft;
void Coins;
