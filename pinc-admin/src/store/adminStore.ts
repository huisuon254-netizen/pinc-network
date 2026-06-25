import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

interface AdminIdentity {
  id: string;
  username: string;
  role: string;
  permissions: string;
}

interface PlatformStats {
  total_users: number;
  online_users: number;
  active_sessions: number;
  new_users_today: number;
  total_wallet_value: number;
  total_sarai_volume: number;
  active_games: number;
  active_challenges: number;
  active_jobs: number;
  active_servers: number;
  active_nodes: number;
  active_bandwidth_providers: number;
}

interface NodeInfo {
  id: string;
  address: string;
  status: string;
  cpu_usage: number;
  ram_usage: number;
  bandwidth_mbps: number;
  trust_score: number;
  last_seen: number;
  online: boolean;
}

interface ServerInfo {
  id: string;
  owner_id: string;
  tier: string;
  status: string;
  cpu_usage: number;
  ram_usage: number;
  storage_usage: number;
  uptime_pct: number;
  revenue: number;
  health: string;
}

interface WalletStats {
  total_deposits: number;
  total_withdrawals: number;
  daily_volume: number;
  monthly_volume: number;
  fee_revenue: number;
}

interface TrafficStats {
  messages_per_minute: number;
  voice_calls_active: number;
  video_calls_active: number;
  file_transfers_active: number;
  total_data_usage_gb: number;
  regional_load: Record<string, number>;
  global_load: number;
}

interface GameStats {
  games_running: number;
  players_online: number;
  current_matches: number;
  top_players: Array<{ node_id: string; score: number; wins: number }>;
  tournaments_active: number;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  description: string;
  severity: string;
  timestamp: number;
}

interface AdminState {
  screen: 'login' | 'dashboard';
  identity: AdminIdentity | null;
  stats: PlatformStats;
  nodes: NodeInfo[];
  servers: ServerInfo[];
  walletStats: WalletStats;
  trafficStats: TrafficStats;
  gameStats: GameStats;
  securityEvents: SecurityEvent[];
  activeSection: string;
  setActiveSection: (s: string) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadDashboard: () => Promise<void>;
  loadNodes: () => Promise<void>;
  loadServers: () => Promise<void>;
  loadWalletStats: () => Promise<void>;
  loadTrafficStats: () => Promise<void>;
  loadGameStats: () => Promise<void>;
  loadSecurityEvents: () => Promise<void>;
}

const defaultStats: PlatformStats = {
  total_users: 0, online_users: 0, active_sessions: 0, new_users_today: 0,
  total_wallet_value: 0, total_sarai_volume: 0, active_games: 0,
  active_challenges: 0, active_jobs: 0, active_servers: 0,
  active_nodes: 0, active_bandwidth_providers: 0,
};

export const useAdminStore = create<AdminState>((set, get) => ({
  screen: 'login',
  identity: null,
  stats: defaultStats,
  nodes: [],
  servers: [],
  walletStats: { total_deposits: 0, total_withdrawals: 0, daily_volume: 0, monthly_volume: 0, fee_revenue: 0 },
  trafficStats: { messages_per_minute: 0, voice_calls_active: 0, video_calls_active: 0, file_transfers_active: 0, total_data_usage_gb: 0, regional_load: {}, global_load: 0 },
  gameStats: { games_running: 0, players_online: 0, current_matches: 0, top_players: [], tournaments_active: 0 },
  securityEvents: [],
  activeSection: 'dashboard',

  setActiveSection: (s) => set({ activeSection: s }),

  login: async (username, password) => {
    try {
      const result = await invoke<AdminIdentity>('cmd_admin_login', { username, password });
      set({ screen: 'dashboard', identity: result });
      get().loadDashboard();
      return true;
    } catch { return false; }
  },

  logout: () => set({ screen: 'login', identity: null, activeSection: 'dashboard' }),

  loadDashboard: async () => {
    try {
      const stats = await invoke<PlatformStats>('cmd_admin_platform_stats');
      set({ stats });
    } catch {}
    get().loadNodes();
    get().loadServers();
    get().loadSecurityEvents();
  },

  loadNodes: async () => {
    try {
      const nodes = await invoke<NodeInfo[]>('cmd_admin_list_nodes');
      set({ nodes: Array.isArray(nodes) ? nodes : [] });
    } catch { set({ nodes: [] }); }
  },

  loadServers: async () => {
    try {
      const servers = await invoke<ServerInfo[]>('cmd_admin_list_servers');
      set({ servers: Array.isArray(servers) ? servers : [] });
    } catch { set({ servers: [] }); }
  },

  loadWalletStats: async () => {
    try {
      const ws = await invoke<WalletStats>('cmd_admin_wallet_stats');
      set({ walletStats: ws });
    } catch {}
  },

  loadTrafficStats: async () => {
    try {
      const ts = await invoke<TrafficStats>('cmd_admin_traffic_stats');
      set({ trafficStats: ts });
    } catch {}
  },

  loadGameStats: async () => {
    try {
      const gs = await invoke<GameStats>('cmd_admin_game_stats');
      set({ gameStats: gs });
    } catch {}
  },

  loadSecurityEvents: async () => {
    try {
      const events = await invoke<SecurityEvent[]>('cmd_admin_security_events');
      set({ securityEvents: Array.isArray(events) ? events : [] });
    } catch { set({ securityEvents: [] }); }
  },
}));
