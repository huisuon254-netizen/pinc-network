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
  main_node_id: string;
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

export type AdminSection =
  | 'dashboard' | 'network' | 'rentbit' | 'traffic' | 'treific'
  | 'sarai' | 'wagers' | 'challenges' | 'jobs' | 'globalmap'
  | 'security' | 'premium' | 'notifications' | 'analytics' | 'superadmin'
  | 'owner' | 'openmaestro'
  | 'fees' | 'wallets' | 'payments' | 'transactions';

interface AdminTransaction {
  id: string;
  from_node: string;
  to_node: string;
  amount: number;
  currency: string;
  tx_type: string;
  status: string;
  created_at: number;
}

interface FeeConfig {
  platform_fee_percent: number;
  withdrawal_fee: number;
  transaction_fee: number;
  minimum_withdrawal: number;
}

interface WalletTypeEntry {
  id: string;
  name: string;
  symbol: string;
  network: string;
  is_native: boolean;
  enabled: boolean;
  min_deposit: number;
  min_withdrawal: number;
}

interface WalletBalanceEntry {
  user_id: string;
  username: string;
  currency: string;
  balance: number;
  wallet_type: string;
}

interface PaymentSource {
  id: string;
  name: string;
  provider: string;
  api_key: string;
  api_secret: string;
  base_url: string;
  webhook_url: string;
  enabled: boolean;
  supported_currencies: string[];
  supported_countries: string[];
  fee_percent: number;
  min_amount: number;
  max_amount: number;
  created_at: number;
  updated_at: number;
}

interface AllTransaction {
  id: string;
  from_node: string;
  to_node: string;
  amount: number;
  currency: string;
  tx_type: string;
  status: string;
  created_at: number;
  from_username?: string;
  to_username?: string;
}

interface NotificationEntry {
  id: string;
  title: string;
  message: string;
  target: string;
  sent_at: string;
  status: string;
}

interface OpenMaestroChallenge {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  reward: number;
  participants: number;
  status: string;
}

interface AdminChallenge {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  reward: number;
  status: string;
}

interface AdminJob {
  id: string;
  title: string;
  budget: number;
  status: string;
  applicants: number;
  category: string;
}

interface SuperAdminFeature {
  id: string; name: string; enabled: boolean; description: string; requiresRestart: boolean;
}

interface GlobalFees {
  platform_fee: number;
  escrow_fee: number;
  listing_fee: number;
}

interface PremiumPlan {
  id: string; name: string; price: number; features: string[]; subscribers: number;
}

interface TreificCommunity {
  id: string; name: string; members: number; activity: string; type: string;
}

interface TreificTrafficStats {
  messages_per_minute: number;
  voice_active: number;
  video_active: number;
  file_transfers_active: number;
  total_data_gb: number;
  active_chats: number;
}

interface SecurityThreatStats {
  failed_logins: number; failed_recoveries: number; device_link_attempts: number;
  bot_networks: number; spam_networks: number; fake_nodes: number; fake_servers: number;
}

interface AnalyticsData {
  retention_rate: number;
  premium_revenue: number;
  hosting_revenue: number;
  treific_active: number;
  growth_history: number[];
}

interface SaraiFeeSettings {
  deposit_fee: number;
  withdrawal_fee: number;
  escrow_fee: number;
  marketplace_fee: number;
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
  transactions: AdminTransaction[];
  fees: FeeConfig;
  walletTypes: WalletTypeEntry[];
  walletBalances: WalletBalanceEntry[];
  paymentSources: PaymentSource[];
  allTransactions: AllTransaction[];
  notificationHistory: NotificationEntry[];
  challenges: OpenMaestroChallenge[];
  adminChallenges: AdminChallenge[];
  jobs: AdminJob[];
  filters: { txType: string; status: string; startDate: string; endDate: string; user: string };
  activeSection: AdminSection;
  superAdminFeatures: SuperAdminFeature[];
  globalFees: GlobalFees;
  premiumPlans: PremiumPlan[];
  treificCommunities: TreificCommunity[];
  treificTrafficStats: TreificTrafficStats;
  securityThreatStats: SecurityThreatStats;
  analyticsData: AnalyticsData;
  saraiFeeSettings: SaraiFeeSettings;
  setActiveSection: (s: AdminSection) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadDashboard: () => Promise<void>;
  loadNodes: () => Promise<void>;
  loadServers: () => Promise<void>;
  loadWalletStats: () => Promise<void>;
  loadTrafficStats: () => Promise<void>;
  loadGameStats: () => Promise<void>;
  loadSecurityEvents: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadFees: () => Promise<void>;
  setFees: (platformFee: number, withdrawalFee: number, transactionFee: number, minimumWithdrawal: number) => Promise<void>;
  loadWalletTypes: () => Promise<void>;
  loadWalletBalances: () => Promise<void>;
  loadPaymentSources: () => Promise<void>;
  addPaymentSource: (source: Omit<PaymentSource, 'created_at' | 'updated_at'>) => Promise<void>;
  updatePaymentSource: (id: string, updates: Partial<PaymentSource>) => Promise<void>;
  loadAllTransactions: () => Promise<void>;
  setFilters: (filters: Partial<AdminState['filters']>) => void;
  loadSuperAdminData: () => Promise<void>;
  toggleFeature: (id: string) => Promise<void>;
  applyGlobalChanges: (platformFee: number, escrowFee: number, listingFee: number) => Promise<void>;
  loadPremiumPlans: () => Promise<void>;
  createPlan: (plan: Omit<PremiumPlan, 'subscribers'>) => Promise<void>;
  updatePlan: (id: string, updates: Partial<PremiumPlan>) => Promise<void>;
  loadTreificData: () => Promise<void>;
  toggleCommunityFeature: (id: string) => Promise<void>;
  freezeCommunity: (id: string) => Promise<void>;
  removeCommunity: (id: string) => Promise<void>;
  loadSecurityThreatStats: () => Promise<void>;
  loadAnalyticsData: () => Promise<void>;
  loadSaraiFeeSettings: () => Promise<void>;
  saveSaraiFeeSettings: (settings: SaraiFeeSettings) => Promise<void>;
  loadNotificationHistory: () => Promise<void>;
  sendNotification: (title: string, message: string, target: string) => Promise<void>;
  loadChallenges: () => Promise<void>;
  createChallenge: (title: string, category: string, difficulty: string, reward: number) => Promise<void>;
  loadAdminChallenges: () => Promise<void>;
  publishChallenge: (title: string, category: string, difficulty: string, reward: number, description: string) => Promise<void>;
  deleteChallenge: (id: string) => Promise<void>;
  editChallenge: (id: string, data: Partial<AdminChallenge>) => Promise<void>;
  loadJobs: () => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  editJob: (id: string, data: Partial<AdminJob>) => Promise<void>;
}

const defaultStats: PlatformStats = {
  total_users: 0, online_users: 0, active_sessions: 0, new_users_today: 0,
  total_wallet_value: 0, total_sarai_volume: 0, active_games: 0,
  active_challenges: 0, active_jobs: 0, active_servers: 0,
  active_nodes: 0, active_bandwidth_providers: 0, main_node_id: '',
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
  transactions: [],
  fees: { platform_fee_percent: 2.5, withdrawal_fee: 0.5, transaction_fee: 0.1, minimum_withdrawal: 10.0 },
  walletTypes: [],
  walletBalances: [],
  paymentSources: [],
  allTransactions: [],
  notificationHistory: [],
  challenges: [],
  adminChallenges: [],
  jobs: [],
  filters: { txType: '', status: '', startDate: '', endDate: '', user: '' },
  activeSection: 'dashboard',
  superAdminFeatures: [],
  globalFees: { platform_fee: 2.5, escrow_fee: 2.5, listing_fee: 5.0 },
  premiumPlans: [],
  treificCommunities: [],
  treificTrafficStats: { messages_per_minute: 0, voice_active: 0, video_active: 0, file_transfers_active: 0, total_data_gb: 0, active_chats: 0 },
  securityThreatStats: { failed_logins: 0, failed_recoveries: 0, device_link_attempts: 0, bot_networks: 0, spam_networks: 0, fake_nodes: 0, fake_servers: 0 },
  analyticsData: { retention_rate: 0, premium_revenue: 0, hosting_revenue: 0, treific_active: 0, growth_history: [] },
  saraiFeeSettings: { deposit_fee: 0.01, withdrawal_fee: 0.02, escrow_fee: 0.025, marketplace_fee: 0.05 },

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
    get().loadWalletStats();
    get().loadTrafficStats();
    get().loadGameStats();
    get().loadTransactions();
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

  loadTransactions: async () => {
    try {
      const txns = await invoke<any[]>('cmd_admin_list_transactions');
      const mapped: AdminTransaction[] = txns.map((t: any) => ({
        id: t.id,
        from_node: t.from_node,
        to_node: t.to_node,
        amount: t.amount,
        currency: t.currency,
        tx_type: t.tx_type,
        status: t.status,
        created_at: t.created_at ?? 0,
      }));
      set({ transactions: mapped });
    } catch {
      set({ transactions: [] });
    }
  },

  loadFees: async () => {
    try {
      const f = await invoke<FeeConfig>('cmd_admin_get_fees');
      set({ fees: f });
    } catch { set({ fees: { platform_fee_percent: 2.5, withdrawal_fee: 0.5, transaction_fee: 0.1, minimum_withdrawal: 10.0 } }); }
  },

  setFees: async (platformFee, withdrawalFee, transactionFee, minimumWithdrawal) => {
    try {
      await invoke('cmd_admin_set_fees', { platformFee, withdrawalFee, transactionFee, minimumWithdrawal });
      set({ fees: { platform_fee_percent: platformFee, withdrawal_fee: withdrawalFee, transaction_fee: transactionFee, minimum_withdrawal: minimumWithdrawal } });
    } catch {}
  },

  loadWalletTypes: async () => {
    try {
      const types = await invoke<WalletTypeEntry[]>('cmd_admin_get_wallet_types');
      set({ walletTypes: Array.isArray(types) ? types : [] });
    } catch { set({ walletTypes: [] }); }
  },

  loadWalletBalances: async () => {
    try {
      const balances = await invoke<WalletBalanceEntry[]>('cmd_admin_get_wallet_balances');
      set({ walletBalances: Array.isArray(balances) ? balances : [] });
    } catch { set({ walletBalances: [] }); }
  },

  loadPaymentSources: async () => {
    try {
      const sources = await invoke<PaymentSource[]>('cmd_admin_get_payment_sources');
      set({ paymentSources: Array.isArray(sources) ? sources : [] });
    } catch { set({ paymentSources: [] }); }
  },

  addPaymentSource: async (source) => {
    try {
      await invoke('cmd_admin_add_payment_source', {
        id: source.id,
        name: source.name,
        provider: source.provider,
        apiKey: source.api_key,
        apiSecret: source.api_secret,
        baseUrl: source.base_url,
        webhookUrl: source.webhook_url,
        supportedCurrencies: source.supported_currencies,
        supportedCountries: source.supported_countries,
        feePercent: source.fee_percent,
        minAmount: source.min_amount,
        maxAmount: source.max_amount,
      });
      get().loadPaymentSources();
    } catch {}
  },

  updatePaymentSource: async (id, updates) => {
    try {
      await invoke('cmd_admin_update_payment_source', { id, ...updates });
      get().loadPaymentSources();
    } catch {}
  },

  loadAllTransactions: async () => {
    try {
      const { txType, status, startDate, endDate, user } = get().filters;
      const txns = await invoke<AllTransaction[]>('cmd_admin_get_all_transactions', {
        txType: txType || undefined,
        status: status || undefined,
        startDate: startDate ? parseInt(startDate) * 86400 : undefined,
        endDate: endDate ? (parseInt(endDate) + 86400) * 86400 : undefined,
        user: user || undefined,
      });
      set({ allTransactions: Array.isArray(txns) ? txns : [] });
    } catch { set({ allTransactions: [] }); }
  },

  setFilters: (partial) => set((s) => ({ filters: { ...s.filters, ...partial } })),

  loadSuperAdminData: async () => {
    try {
      const data = await invoke<{ features: SuperAdminFeature[]; fees: GlobalFees }>('cmd_admin_super_admin_data');
      set({
        superAdminFeatures: Array.isArray(data.features) ? data.features : [],
        globalFees: data.fees || { platform_fee: 2.5, escrow_fee: 2.5, listing_fee: 5.0 },
      });
    } catch {
      set({ superAdminFeatures: [], globalFees: { platform_fee: 2.5, escrow_fee: 2.5, listing_fee: 5.0 } });
    }
  },

  toggleFeature: async (id) => {
    try {
      await invoke('cmd_admin_toggle_feature', { id });
      set((s) => ({ superAdminFeatures: s.superAdminFeatures.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f) }));
    } catch {}
  },

  applyGlobalChanges: async (platformFee, escrowFee, listingFee) => {
    try {
      await invoke('cmd_admin_apply_global_changes', { platformFee, escrowFee, listingFee });
      set({ globalFees: { platform_fee: platformFee, escrow_fee: escrowFee, listing_fee: listingFee } });
    } catch {}
  },

  loadPremiumPlans: async () => {
    try {
      const plans = await invoke<PremiumPlan[]>('cmd_admin_premium_plans');
      set({ premiumPlans: Array.isArray(plans) ? plans : [] });
    } catch { set({ premiumPlans: [] }); }
  },

  createPlan: async (plan) => {
    try {
      await invoke('cmd_admin_create_plan', plan);
      get().loadPremiumPlans();
    } catch {}
  },

  updatePlan: async (id, updates) => {
    try {
      await invoke('cmd_admin_update_plan', { id, ...updates });
      get().loadPremiumPlans();
    } catch {}
  },

  loadTreificData: async () => {
    try {
      const data = await invoke<{ communities: TreificCommunity[]; traffic: TreificTrafficStats }>('cmd_admin_treific_data');
      set({
        treificCommunities: Array.isArray(data.communities) ? data.communities : [],
        treificTrafficStats: data.traffic || { messages_per_minute: 0, voice_active: 0, video_active: 0, file_transfers_active: 0, total_data_gb: 0, active_chats: 0 },
      });
    } catch {
      set({
        treificCommunities: [],
        treificTrafficStats: { messages_per_minute: 0, voice_active: 0, video_active: 0, file_transfers_active: 0, total_data_gb: 0, active_chats: 0 },
      });
    }
  },

  toggleCommunityFeature: async (id) => {
    try {
      await invoke('cmd_admin_toggle_community_feature', { id });
    } catch {}
  },

  freezeCommunity: async (id) => {
    try {
      await invoke('cmd_admin_freeze_community', { id });
    } catch {}
  },

  removeCommunity: async (id) => {
    try {
      await invoke('cmd_admin_remove_community', { id });
      set((s) => ({ treificCommunities: s.treificCommunities.filter(c => c.id !== id) }));
    } catch {}
  },

  loadSecurityThreatStats: async () => {
    try {
      const stats = await invoke<SecurityThreatStats>('cmd_admin_security_threat_stats');
      set({ securityThreatStats: stats });
    } catch {}
  },

  loadAnalyticsData: async () => {
    try {
      const data = await invoke<AnalyticsData>('cmd_admin_analytics_data');
      set({ analyticsData: data });
    } catch {}
  },

  loadSaraiFeeSettings: async () => {
    try {
      const settings = await invoke<SaraiFeeSettings>('cmd_admin_sarai_fee_settings');
      set({ saraiFeeSettings: settings });
    } catch {}
  },

  saveSaraiFeeSettings: async (settings) => {
    try {
      await invoke('cmd_admin_save_sarai_fee_settings', {
        depositFee: settings.deposit_fee,
        withdrawalFee: settings.withdrawal_fee,
        escrowFee: settings.escrow_fee,
        marketplaceFee: settings.marketplace_fee,
      });
      set({ saraiFeeSettings: settings });
    } catch {}
  },

  loadNotificationHistory: async () => {
    try {
      const data = await invoke<NotificationEntry[]>('cmd_admin_notification_history');
      set({ notificationHistory: Array.isArray(data) ? data : [] });
    } catch { set({ notificationHistory: [] }); }
  },

  sendNotification: async (title, message, target) => {
    try {
      await invoke('cmd_admin_send_notification', { title, message, target });
      get().loadNotificationHistory();
    } catch {}
  },

  loadChallenges: async () => {
    try {
      const data = await invoke<OpenMaestroChallenge[]>('cmd_admin_list_challenges');
      set({ challenges: Array.isArray(data) ? data : [] });
    } catch { set({ challenges: [] }); }
  },

  createChallenge: async (title, category, difficulty, reward) => {
    try {
      await invoke('cmd_admin_create_challenge', { title, category, difficulty, reward });
      get().loadChallenges();
    } catch {}
  },

  loadAdminChallenges: async () => {
    try {
      const data = await invoke<AdminChallenge[]>('cmd_admin_list_admin_challenges');
      set({ adminChallenges: Array.isArray(data) ? data : [] });
    } catch { set({ adminChallenges: [] }); }
  },

  publishChallenge: async (title, category, difficulty, reward, description) => {
    try {
      await invoke('cmd_admin_publish_challenge', { title, category, difficulty, reward, description });
      get().loadAdminChallenges();
    } catch {}
  },

  deleteChallenge: async (id) => {
    try {
      await invoke('cmd_admin_delete_challenge', { id });
      get().loadAdminChallenges();
    } catch {}
  },

  editChallenge: async (id, data) => {
    try {
      await invoke('cmd_admin_edit_challenge', { id, ...data });
      get().loadAdminChallenges();
    } catch {}
  },

  loadJobs: async () => {
    try {
      const data = await invoke<AdminJob[]>('cmd_admin_list_jobs');
      set({ jobs: Array.isArray(data) ? data : [] });
    } catch { set({ jobs: [] }); }
  },

  deleteJob: async (id) => {
    try {
      await invoke('cmd_admin_delete_job', { id });
      get().loadJobs();
    } catch {}
  },

  editJob: async (id, data) => {
    try {
      await invoke('cmd_admin_edit_job', { id, ...data });
      get().loadJobs();
    } catch {}
  },
}));
