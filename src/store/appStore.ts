import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type {
  Identity, StartupReport, NodeStatus, VaultFile,
  PeerInfo, NetworkStatus, PincSettings, AppScreen, DashTab,
  UserRole, ResourceAllocation,
} from '../types';

interface AppState {
  screen: AppScreen;
  activeTab: DashTab;
  setScreen: (s: AppScreen) => void;
  setActiveTab: (t: DashTab) => void;

  startupReport: StartupReport | null;
  startupDone: boolean;

  identity: Identity | null;
  hasIdentity: boolean;

  nodeStatus: NodeStatus | null;
  vaultFiles: VaultFile[];
  networkStatus: NetworkStatus | null;
  peers: PeerInfo[];
  settings: PincSettings | null;
  role: UserRole;
  resources: ResourceAllocation;

  loading: boolean;
  error: string | null;
  setError: (e: string | null) => void;

  initialize: () => Promise<void>;
  createIdentity: (masterKeyHex: string) => Promise<void>;
  recoverIdentity: (phrase: string, masterKeyHex: string) => Promise<void>;
  loadVault: () => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: (s: PincSettings) => Promise<void>;
  refreshNodeStatus: () => Promise<void>;
  refreshNetwork: () => Promise<void>;
  setRole: (r: UserRole) => void;
  updateResources: (r: Partial<ResourceAllocation>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'splash',
  activeTab: 'home',
  setScreen: (s) => set({ screen: s }),
  setActiveTab: (t) => set({ activeTab: t }),

  startupReport: null,
  startupDone: false,
  identity: null,
  hasIdentity: false,
  nodeStatus: null,
  vaultFiles: [],
  networkStatus: null,
  peers: [],
  settings: null,
  role: 'admin',
  resources: {
    cpuCores: 2,
    ramMb: 2048,
    bandwidthUpKbps: 10000,
    bandwidthDownKbps: 10000,
    storageGb: 10,
    relayCapacity: 50,
    maxConnections: 20,
    priority: 'normal',
  },
  loading: false,
  error: null,
  setError: (e) => set({ error: e }),

  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const report: StartupReport = await invoke('cmd_run_startup');
      const hasId: boolean = await invoke('cmd_has_identity');
      set({ startupReport: report, startupDone: true, hasIdentity: hasId });

      if (hasId) {
        const identity: Identity | null = await invoke('cmd_get_identity');
        if (identity) {
          set({ identity });
        }
        await get().refreshNodeStatus();
        await get().loadSettings();
      }

      set({ screen: hasId ? 'dashboard' : 'login' });
    } catch (e) {
      console.error('Initialize error:', e);
      set({ error: String(e), screen: 'login' });
    } finally {
      set({ loading: false });
    }
  },

  createIdentity: async (masterKeyHex) => {
    set({ loading: true, error: null });
    try {
      const identity: Identity = await invoke('cmd_create_identity', {
        master_key_hex: masterKeyHex,
      });
      set({ identity, hasIdentity: true });
      await get().refreshNodeStatus();
      await get().loadSettings();
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ loading: false });
    }
  },

  recoverIdentity: async (phrase, masterKeyHex) => {
    set({ loading: true, error: null });
    try {
      const identity: Identity = await invoke('cmd_recover_identity', {
        phrase,
        master_key_hex: masterKeyHex,
      });
      set({ identity, hasIdentity: true });
      await get().refreshNodeStatus();
      await get().loadSettings();
    } catch (e) {
      set({ error: String(e) });
    } finally {
      set({ loading: false });
    }
  },

  loadVault: async () => {
    try {
      const files: VaultFile[] = await invoke('cmd_list_vault');
      set({ vaultFiles: files });
    } catch (e) {
      console.warn('vault load error', e);
    }
  },

  deleteFile: async (id) => {
    try {
      await invoke('cmd_delete_file', { file_id: id });
      set((s) => ({ vaultFiles: s.vaultFiles.filter((f) => f.id !== id) }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  loadSettings: async () => {
    try {
      const settings: PincSettings = await invoke('cmd_get_settings');
      set({ settings });
    } catch (e) {
      console.warn('settings load error', e);
    }
  },

  saveSettings: async (s) => {
    try {
      await invoke('cmd_update_settings', { settings: s });
      set({ settings: s });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  refreshNodeStatus: async () => {
    try {
      const nodeStatus: NodeStatus = await invoke('cmd_get_node_status');
      set({ nodeStatus });
    } catch (e) {
      console.warn('node status error', e);
    }
  },

  refreshNetwork: async () => {
    try {
      const networkStatus: NetworkStatus = await invoke('cmd_get_network_status');
      const peers: PeerInfo[] = await invoke('cmd_get_peers');
      set({ networkStatus, peers });
    } catch (e) {
      console.warn('network refresh error', e);
    }
  },

  setRole: (r) => set({ role: r }),

  updateResources: (r) => set((s) => ({ resources: { ...s.resources, ...r } })),
}));
