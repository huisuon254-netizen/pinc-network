import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { AllSettings, DEFAULT_SETTINGS } from '../types/settings';
import {
  Identity, StartupReport, NodeStatus, PeerInfo, NetworkStatus, VaultFile, UserRole,
  WalletBalance, Transaction, StarteranStatus, RentbitStatus, Conversation,
  AppNotification, SecurityLog, Device, Job, Tournament, Challenge, RankingEntry,
  ProblemPost, Product, DuelChallenge,
} from '../types';

interface AppState {
  screen: 'splash' | 'login' | 'dashboard';
  setScreen: (screen: AppState['screen']) => void;

  identity: Identity | null;
  setIdentity: (identity: Identity | null) => void;

  nodeStatus: NodeStatus;
  startupReport: StartupReport | null;
  startupDone: boolean;

  peers: PeerInfo[];
  vaultFiles: VaultFile[];
  networkStatus: NetworkStatus | null;
  error: string | null;

  activeTab: string;
  setActiveTab: (tab: string) => void;

  role: UserRole;
  setRole: (role: UserRole) => void;

  settings: AllSettings;
  updateSettings: (section: keyof AllSettings, values: Partial<AllSettings[keyof AllSettings]>) => void;
  resetSection: (section: keyof AllSettings) => void;
  resetAll: () => void;
  setSettings: (settings: AllSettings) => void;
  saveSettings: () => void;
  setError: (error: string | null) => void;

  walletBalance: WalletBalance | null;
  transactions: Transaction[];
  starteranStatus: StarteranStatus | null;
  rentbitStatus: RentbitStatus | null;
  conversations: Conversation[];
  notifications: AppNotification[];
  securityLogs: SecurityLog[];
  devices: Device[];
  jobs: Job[];
  tournaments: Tournament[];
  challenges: Challenge[];
  rankings: RankingEntry[];
  products: Product[];
  duels: DuelChallenge[];
  problems: ProblemPost[];

  wagers: any[];
  gameSessions: any[];
  gameStats: any | null;
  netShareStatus: any | null;
  reputation: any | null;
  aiAgents: any[];
  leaderboard: any[];
  homeLoading: boolean;

  refreshWallet: () => void;
  refreshStarteran: () => void;
  refreshRentbit: () => void;
  refreshConversations: () => void;
  refreshNotifications: () => void;
  refreshSecurity: () => void;
  refreshJobs: () => void;
  refreshOpenMaestro: () => void;
  refreshZeroFlipper: () => void;
  refreshHomeStats: () => Promise<void>;

  refreshNodeStatus: () => void;
  refreshNetwork: () => void;
  loadVault: () => void;
  deleteFile: (fileId: string) => void;

  initialize: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'splash' as const,
      setScreen: (screen) => set({ screen }),

      identity: null,
      setIdentity: (identity) => set({ identity }),

      nodeStatus: {
        online: false,
        peer_count: 0,
        vault_file_count: 0,
        bandwidth_up_kbps: 0,
        bandwidth_down_kbps: 0,
        messages_relayed: 0,
        vault_operations: 0,
        peer_connections: 0,
      } as NodeStatus,

      startupReport: null,
      startupDone: false,
      peers: [],
      vaultFiles: [],
      networkStatus: null,
      error: null,

      activeTab: 'identity',
      setActiveTab: (tab) => set({ activeTab: tab }),

      role: 'user' as UserRole,
      setRole: (role) => set({ role }),

      settings: { ...DEFAULT_SETTINGS },

      updateSettings: (section, values) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [section]: {
              ...state.settings[section],
              ...values,
            },
          },
        })),

      resetSection: (section) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [section]: { ...(DEFAULT_SETTINGS[section] as any) },
          },
        })),

      resetAll: () => set({ settings: { ...DEFAULT_SETTINGS } }),

      setSettings: (settings) => set({ settings }),

      saveSettings: () => {
        const state = get();
        set({ settings: state.settings });
      },

      setError: (error) => set({ error }),
      loadVault: () => {},
      deleteFile: (_fileId: string) => {},

      walletBalance: null,
      transactions: [],
      starteranStatus: null,
      rentbitStatus: null,
      conversations: [],
      notifications: [],
      securityLogs: [],
      devices: [],
      jobs: [],
      tournaments: [],
      challenges: [],
      rankings: [],
      products: [],
      duels: [],
      problems: [],
      wagers: [],
      gameSessions: [],
      gameStats: null,
      netShareStatus: null,
      reputation: null,
      aiAgents: [],
      leaderboard: [],
      homeLoading: false,

      refreshWallet: async () => {
        try {
          const raw = await invoke<any>('cmd_get_wallet_balance');
          const balance: WalletBalance = {
            balance: raw.balance ?? 0,
            pending: (raw.pending_deposits ?? 0) + (raw.pending_withdrawals ?? 0),
            total_earned: raw.balance ?? 0,
          };
          const txs = await invoke<Transaction[]>('cmd_get_transactions');
          set({ walletBalance: balance, transactions: txs });
        } catch {}
      },

      refreshStarteran: async () => {
        try {
          const status = await invoke<any>('cmd_get_starteran_status');
          set({ starteranStatus: status });
        } catch {}
      },

      refreshRentbit: async () => {
        try {
          const status = await invoke<any>('cmd_get_rentbit_status');
          set({ rentbitStatus: status });
        } catch {}
      },

      refreshConversations: async () => {
        try {
          const convs = await invoke<Conversation[]>('cmd_get_conversations');
          set({ conversations: convs });
        } catch {}
      },

      refreshNotifications: async () => {
        try {
          const notifs = await invoke<AppNotification[]>('cmd_get_app_notifications');
          set({ notifications: notifs });
        } catch {}
      },

      refreshSecurity: async () => {
        try {
          const logs = await invoke<SecurityLog[]>('cmd_get_security_logs');
          const devs = await invoke<Device[]>('cmd_get_devices');
          set({ securityLogs: logs, devices: devs });
        } catch {}
      },

      refreshJobs: async () => {
        try {
          const jobs = await invoke<Job[]>('cmd_get_jobs');
          set({ jobs });
        } catch {}
      },

      refreshOpenMaestro: async () => {
        try {
          const [challenges, rankings, problems, duels] = await Promise.all([
            invoke<Challenge[]>('cmd_list_challenges').catch(() => []),
            invoke<RankingEntry[]>('cmd_list_rankings').catch(() => []),
            invoke<ProblemPost[]>('cmd_list_problems').catch(() => []),
            invoke<DuelChallenge[]>('cmd_list_duels').catch(() => []),
          ]);
          set({ challenges, rankings, problems, duels });
        } catch {}
      },

      refreshZeroFlipper: async () => {
        try {
          const [products, wagers, gameStats] = await Promise.all([
            invoke<Product[]>('cmd_list_products').catch(() => []),
            invoke<any[]>('cmd_get_wagers').catch(() => []),
            invoke<any>('cmd_get_user_game_stats').catch(() => null),
          ]);
          set({ products, wagers, gameStats });
        } catch {}
      },

      refreshHomeStats: async () => {
        set({ homeLoading: true });
        try {
          const fetchedIdentity = await invoke<Identity>('cmd_get_identity').catch(() => null);

          const [
            walletRaw,
            starteranStatus,
            rentbitStatus,
            conversations,
            netShareStatus,
          ] = await Promise.all([
            invoke<any>('cmd_get_wallet_balance').catch(() => null),
            invoke<any>('cmd_get_starteran_status').catch(() => null),
            invoke<any>('cmd_get_rentbit_status').catch(() => null),
            invoke<Conversation[]>('cmd_get_conversations').catch(() => []),
            invoke<any>('cmd_get_net_share_status').catch(() => null),
          ]);

          const identity = fetchedIdentity !== null ? fetchedIdentity : get().identity;

          let reputation: any = null;
          if (identity?.node_id) {
            reputation = await invoke<any>('cmd_get_reputation', { node_id: identity.node_id }).catch(() => null);
          }

          const walletBalance: WalletBalance | null = walletRaw
            ? {
                balance: walletRaw.balance ?? 0,
                pending: (walletRaw.pending_deposits ?? 0) + (walletRaw.pending_withdrawals ?? 0),
                total_earned: walletRaw.balance ?? 0,
              }
            : null;

          set({
            identity,
            walletBalance,
            starteranStatus,
            rentbitStatus,
            conversations: conversations || [],
            netShareStatus,
            reputation,
            homeLoading: false,
          });
        } catch {
          set({ homeLoading: false });
        }
      },

      refreshNodeStatus: async () => {
        try {
          const status = await invoke<NodeStatus>('cmd_get_node_status');
          set({ nodeStatus: status });
        } catch {}
      },
      refreshNetwork: async () => {
        try {
          const ns = await invoke<NetworkStatus>('cmd_get_network_status');
          set({ networkStatus: ns });
        } catch {}
      },

      initialize: () => {
        setTimeout(async () => {
          const state = get();
          if (state.identity) {
            set({ screen: 'dashboard', activeTab: 'identity' });
            if (window.__TAURI__) {
              try {
                const existing = await invoke<Identity | null>('cmd_get_identity');
                if (!existing && state.identity) {
                  await invoke('cmd_create_identity', {
                    masterKey: 'default_master_key',
                    username: state.identity.username || 'QWEN',
                  });
                }
              } catch {}
            }
          } else {
            set({ screen: 'login' });
          }
        }, 3000);
      },
    }),
    {
      name: 'pinc-settings',
      partialize: (state) => ({
        settings: state.settings,
        identity: state.identity,
        activeTab: state.activeTab,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState>;
        const merged = {
          ...currentState,
          ...persisted,
        };
        if (persisted?.settings) {
          merged.settings = {
            ...currentState.settings,
            ...persisted.settings,
            account: { ...currentState.settings.account, ...(persisted.settings.account || {}) },
            security: { ...currentState.settings.security, ...(persisted.settings.security || {}) },
            privacy: { ...currentState.settings.privacy, ...(persisted.settings.privacy || {}) },
            notifications: { ...currentState.settings.notifications, ...(persisted.settings.notifications || {}) },
            appearance: { ...currentState.settings.appearance, ...(persisted.settings.appearance || {}) },
            network: { ...currentState.settings.network, ...(persisted.settings.network || {}) },
            ai: { ...currentState.settings.ai, ...(persisted.settings.ai || {}) },
            backup: { ...currentState.settings.backup, ...(persisted.settings.backup || {}) },
          };
        }
        if (persisted?.identity) {
          merged.screen = 'dashboard';
        } else {
          merged.screen = currentState.screen;
        }
        return merged;
      },
    }
  )
);
