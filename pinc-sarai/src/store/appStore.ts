import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { AllSettings, DEFAULT_SETTINGS } from '../types/settings';
import {
  Identity, StartupReport, NodeStatus, VaultFile, UserRole,
  WalletBalance, Transaction, Conversation,
  AppNotification, SecurityLog, Device,
} from '../types';

type AppScreen = 'splash' | 'language' | 'login' | 'setup' | 'dashboard';

interface AppState {
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;

  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;

  isLocked: boolean;
  failedAttempts: number;
  setLocked: (v: boolean) => void;
  incrementFailed: () => void;
  resetFailed: () => void;
  lockApp: () => void;
  unlockApp: (passcode: string) => Promise<boolean>;
  unlockWithPassword: (password: string) => Promise<boolean>;

  identity: Identity | null;
  setIdentity: (identity: Identity | null) => void;

  nodeStatus: NodeStatus;
  startupReport: StartupReport | null;
  startupDone: boolean;

  vaultFiles: VaultFile[];
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

  // SARAI core — wallet / messages / history only
  walletBalance: WalletBalance | null;
  transactions: Transaction[];
  conversations: Conversation[];
  notifications: AppNotification[];
  securityLogs: SecurityLog[];
  devices: Device[];

  // compatibility placeholders (stripped)
  // starteranStatus, rentbitStatus, jobs etc removed

  homeLoading: boolean;

  refreshWallet: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshSecurity: () => Promise<void>;

  createAccount: (data: { masterKey: string; username: string; firstName: string; lastName: string; dateOfBirth: string; passcode?: string }) => Promise<Identity>;
  loadVault: () => void;
  deleteFile: (fileId: string) => void;

  initialize: () => void;

  // settings persistence helpers (backend)
  loadSettings: () => Promise<void>;
  persistSettings: () => Promise<void>;
  setPasscode: (passcode: string) => Promise<void>;
  verifyPasscode: (passcode: string) => Promise<boolean>;
  enableBiometric: () => Promise<boolean>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'splash' as const,
      setScreen: (screen) => set({ screen }),

      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (v) => set({ hasCompletedOnboarding: v }),

      isLocked: false,
      failedAttempts: 0,
      setLocked: (v) => set({ isLocked: v }),
      incrementFailed: () => set(s => ({ failedAttempts: s.failedAttempts + 1 })),
      resetFailed: () => set({ failedAttempts: 0 }),
      lockApp: () => set({ isLocked: true }),
      unlockApp: async (passcode: string) => {
        try {
          const ok = await invoke<boolean>('cmd_verify_passcode', { passcode });
          if (ok) { set({ isLocked: false, failedAttempts: 0 }); return true; }
          set(s => ({ failedAttempts: s.failedAttempts + 1 }));
          return false;
        } catch {
          const sec = get().settings.security;
          if (!sec.passcodeEnabled || !sec.passcodeHash) { set({ isLocked: false }); return true; }
          set(s => ({ failedAttempts: s.failedAttempts + 1 }));
          return false;
        }
      },

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
      vaultFiles: [],
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
        get().persistSettings().catch(()=>{});
      },

      setError: (error) => set({ error }),
      loadVault: () => {},
      deleteFile: (_fileId: string) => {},

      walletBalance: null,
      transactions: [],
      conversations: [],
      notifications: [],
      securityLogs: [],
      devices: [],
      homeLoading: false,

      refreshWallet: async () => {
        try {
          const raw = await invoke<any>('cmd_get_wallet_balance');
          const balance: WalletBalance = {
            balance: raw.balance ?? 0,
            pending: (raw.pending_deposits ?? 0) + (raw.pending_withdrawals ?? raw.pending ?? 0),
            total_earned: raw.balance ?? 0,
          };
          const txs = await invoke<Transaction[]>('cmd_get_transactions');
          set({ walletBalance: balance, transactions: txs });
        } catch {}
      },

      refreshConversations: async () => {
        try {
          // try real messages polling via get_messages for empty peer (returns all for current identity if supported)
          // fallback to cmd_get_conversations if exists
          const convs = await invoke<Conversation[]>('cmd_get_conversations').catch(() => []);
          if (convs && convs.length) set({ conversations: convs });
          else {
            // attempt to derive conversations from messages table via generic call
            const msgs = await invoke<any[]>('cmd_get_messages', { peerId: '' }).catch(() => []);
            if (Array.isArray(msgs) && msgs.length) {
              // synthesize conversations from distinct peer ids
              const map = new Map<string, Conversation>();
              for (const m of msgs) {
                const peer = m.recipient_id || m.peer_id || 'unknown';
                if (!map.has(peer)) {
                  map.set(peer, {
                    id: peer,
                    name: peer,
                    type: 'private',
                    last_message: m.content || '',
                    last_message_at: m.timestamp || m.sent_at || Date.now()/1000,
                    unread_count: 0,
                    avatar_color: '#00d4ff',
                  });
                }
              }
              set({ conversations: Array.from(map.values()) });
            }
          }
        } catch {}
      },

      refreshNotifications: async () => {
        try {
          const notifs = await invoke<AppNotification[]>('cmd_get_app_notifications').catch(() => []);
          if (Array.isArray(notifs)) set({ notifications: notifs });
        } catch {}
      },

      refreshSecurity: async () => {
        try {
          const logs = await invoke<SecurityLog[]>('cmd_get_security_logs').catch(() => []);
          const devs = await invoke<Device[]>('cmd_get_devices').catch(() => []);
          set({ securityLogs: logs || [], devices: devs || [] });
        } catch {}
      },

      refreshNodeStatus: async () => {
        try {
          const status = await invoke<NodeStatus>('cmd_get_node_status').catch(() => null);
          if (status) set({ nodeStatus: status as NodeStatus });
        } catch {}
      },
      loadSettings: async () => {
        try {
          const s = await invoke<AllSettings>('cmd_get_app_settings');
          if (s) set({ settings: { ...DEFAULT_SETTINGS, ...s } as AllSettings });
        } catch {}
      },
      persistSettings: async () => {
        try {
          await invoke('cmd_set_app_settings', { settings: get().settings });
        } catch {}
      },
      setPasscode: async (passcode: string) => {
        try {
          await invoke('cmd_set_passcode', { passcode });
          set(s => ({ settings: { ...s.settings, security: { ...s.settings.security, passcodeEnabled: true } } }));
        } catch (e) {
          throw e;
        }
      },
      verifyPasscode: async (passcode: string) => {
        try { return await invoke<boolean>('cmd_verify_passcode', { passcode }); } catch { return false; }
      },
      createAccount: async (data) => {
        const identity = await invoke<Identity>('cmd_create_identity', {
          masterKey: data.masterKey,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
        });
        // Mandatory PIN — a wallet without a passcode is invalid
        if (data.passcode) {
          await invoke('cmd_set_passcode', { passcode: data.passcode }).catch(() => {});
        }
        // Persist names + DOB in app_settings (backend DB)
        set(s => ({
          settings: {
            ...s.settings,
            account: { ...s.settings.account, firstName: data.firstName, lastName: data.lastName, dateOfBirth: data.dateOfBirth, displayName: s.settings.account.displayName || data.username },
            security: { ...s.settings.security, ...(data.passcode ? { passcodeEnabled: true } : {}) },
          },
        }));
        get().persistSettings().catch(() => {});
        set({ identity, screen: 'dashboard', activeTab: 'home', hasCompletedOnboarding: true });
        try { localStorage.setItem('sarai-onboarded', 'true'); } catch {}
        return identity;
      },

      unlockWithPassword: async (password: string) => {
        try {
          const ok = await invoke<boolean>('cmd_verify_login', { password });
          if (ok) { set({ isLocked: false, failedAttempts: 0 }); return true; }
          set(s => ({ failedAttempts: s.failedAttempts + 1 }));
          return false;
        } catch {
          set(s => ({ failedAttempts: s.failedAttempts + 1 }));
          return false;
        }
      },
      enableBiometric: async () => {
        try { return await invoke<boolean>('cmd_biometric_auth'); } catch { return false; }
      },

      initialize: () => {
        setTimeout(async () => {
          try { await get().loadSettings(); } catch {}
          const state = get();

          const hasOnboarded = state.hasCompletedOnboarding;
          const hasLang = (() => {
            try {
              if (localStorage.getItem('sarai-onboarded') === 'true') return true;
              if (hasOnboarded) return true;
              return false;
            } catch { return hasOnboarded; }
          })();

          if (!hasOnboarded && !hasLang) {
            try {
              const backendOnboarded = await invoke<boolean>('cmd_has_completed_onboarding').catch(()=> null);
              if (backendOnboarded === false) {
                set({ screen: 'language' });
                return;
              }
              if (backendOnboarded === true) {
                set({ hasCompletedOnboarding: true });
              } else if (!hasOnboarded) {
                set({ screen: 'language' });
                return;
              }
            } catch {
              set({ screen: 'language' });
              return;
            }
          }
          if (!get().hasCompletedOnboarding) {
            try {
              const persisted = localStorage.getItem('pinc-settings');
              if (persisted) {
                const p = JSON.parse(persisted);
                if (p?.state?.hasCompletedOnboarding) {
                  set({ hasCompletedOnboarding: true });
                } else {
                  set({ screen: 'language' });
                  return;
                }
              }
            } catch {}
            if (!get().hasCompletedOnboarding) {
              set({ screen: 'language' });
              return;
            }
          }

          // AUTH ENFORCEMENT: resolve identity from backend before deciding route
          let existingIdentity: Identity | null = state.identity;
          if ((window as any).__TAURI__) {
            try {
              const existing = await invoke<Identity | null>('cmd_get_identity').catch(() => null);
              if (existing) {
                existingIdentity = existing as Identity;
                set({ identity: existing as Identity });
              }
            } catch {}
          }

          if (!existingIdentity) {
            // No account yet — ALWAYS gate through setup (names + DOB + password + PIN) before dashboard
            set({ screen: 'setup' });
            get().refreshWallet().catch(()=>{});
            get().refreshConversations().catch(()=>{});
            return;
          }

          if (state.settings.security.passcodeEnabled && state.settings.security.requirePasscodeOnStart) {
            set({ isLocked: true });
          } else {
            try {
              const hasPass = await invoke<boolean>('cmd_has_passcode').catch(()=> false);
              if (hasPass && state.settings.security.requirePasscodeOnStart) set({ isLocked: true });
            } catch {}
          }

          set({ screen: 'dashboard', activeTab: state.activeTab || 'home' });
          // also refresh wallet/messages in background
          get().refreshWallet().catch(()=>{});
          get().refreshConversations().catch(()=>{});
        }, 1200);
      },
    }),
    {
      name: 'pinc-settings',
      partialize: (state) => ({
        settings: state.settings,
        identity: state.identity,
        activeTab: state.activeTab,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState>;
        const merged: AppState = {
          ...currentState,
          ...(persisted as any),
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
            backup: { ...currentState.settings.backup, ...(persisted.settings.backup || {}) },
          };
        }
        if (!merged.hasCompletedOnboarding) {
          merged.screen = 'splash';
        } else if (persisted?.identity) {
          merged.screen = 'dashboard';
        } else {
          merged.screen = currentState.screen;
        }
        return merged;
      },
    }
  )
);
