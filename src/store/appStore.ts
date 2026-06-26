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

  refreshWallet: () => void;
  refreshStarteran: () => void;
  refreshRentbit: () => void;
  refreshConversations: () => void;
  refreshNotifications: () => void;
  refreshSecurity: () => void;
  refreshJobs: () => void;
  refreshOpenMaestro: () => void;
  refreshZeroFlipper: () => void;

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

      activeTab: 'home',
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

      refreshWallet: async () => {
        try {
          const balance = await invoke<WalletBalance>('cmd_get_wallet_balance');
          const txs = await invoke<Transaction[]>('cmd_get_transactions');
          set({ walletBalance: balance, transactions: txs });
        } catch {}
      },

      refreshStarteran: async () => {
        try {
          const status = await invoke<StarteranStatus>('cmd_get_starteran_status');
          set({ starteranStatus: status });
        } catch {}
      },

      refreshRentbit: async () => {
        try {
          const status = await invoke<RentbitStatus>('cmd_get_rentbit_status');
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
          const products = await invoke<Product[]>('cmd_list_products').catch(() => []);
          set({ products });
        } catch {}
      },

      refreshNodeStatus: () => {},
      refreshNetwork: () => {},

      initialize: () => {
        setTimeout(() => {
          set({ screen: 'login' });
        }, 3000);
      },
    }),
    {
      name: 'pinc-settings',
      partialize: (state) => ({
        settings: state.settings,
        identity: state.identity,
        screen: state.screen,
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
        return merged;
      },
    }
  )
);
