export interface Identity {
  id: string;
  node_id: string;
  username: string;
  public_key: string;
  fingerprint: string;
  recovery_hash: string;
  created_at: number;
}

export interface StartupCheck {
  name: string;
  passed: boolean;
  message: string;
}

export interface StartupReport {
  all_passed: boolean;
  checks: StartupCheck[];
  failed_component: string | null;
}

export interface NodeStatus {
  online: boolean;
  peer_count: number;
  vault_file_count: number;
  bandwidth_up_kbps: number;
  bandwidth_down_kbps: number;
  messages_relayed: number;
  vault_operations: number;
  peer_connections: number;
}

export interface VaultFile {
  id: string;
  name: string;
  hash: string;
  encrypted: boolean;
  size_bytes: number;
  created_at: number;
}

export interface PeerInfo {
  id: string;
  address: string;
  public_key: string;
  latency_ms: number;
  trust_score: number;
  relay_score: number;
  online: boolean;
  last_seen: number;
}

export interface NetworkStatus {
  online: boolean;
  peer_count: number;
  relay_count: number;
  bandwidth_up_kbps: number;
  bandwidth_down_kbps: number;
  mesh_ready: boolean;
  nat_traversal: boolean;
}

export interface PincSettings {
  theme: string;
  language: string;
  relay_enabled: boolean;
  bandwidth_cap_kbps: number;
  vault_auto_compress: boolean;
  vault_auto_encrypt: boolean;
  notifications_enabled: boolean;
  telemetry_enabled: boolean;
  network_port: number;
  max_peers: number;
  storage_limit_gb: number;
  auto_backup: boolean;
  groq_api_key: string;
}

export type AppScreen = 'splash' | 'login' | 'dashboard';
export type DashTab = 'home' | 'treific' | 'sarai' | 'starteran' | 'rentbit' | 'zeroflipper' | 'openmaestro' | 'security' | 'notifications' | 'networld';

export type UserRole = 'admin' | 'operator' | 'user' | 'guest';

export interface RolePermissions {
  canManageNodes: boolean;
  canAccessVault: boolean;
  canRelayTraffic: boolean;
  canAccessMarketplace: boolean;
  canAccessWallet: boolean;
  canModerateContent: boolean;
  canManageUsers: boolean;
  canViewMetrics: boolean;
  canAllocateResources: boolean;
  canAccessAI: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canManageNodes: true, canAccessVault: true, canRelayTraffic: true,
    canAccessMarketplace: true, canAccessWallet: true, canModerateContent: true,
    canManageUsers: true, canViewMetrics: true, canAllocateResources: true, canAccessAI: true,
  },
  operator: {
    canManageNodes: true, canAccessVault: true, canRelayTraffic: true,
    canAccessMarketplace: true, canAccessWallet: true, canModerateContent: true,
    canManageUsers: false, canViewMetrics: true, canAllocateResources: true, canAccessAI: true,
  },
  user: {
    canManageNodes: false, canAccessVault: true, canRelayTraffic: true,
    canAccessMarketplace: true, canAccessWallet: true, canModerateContent: false,
    canManageUsers: false, canViewMetrics: false, canAllocateResources: false, canAccessAI: false,
  },
  guest: {
    canManageNodes: false, canAccessVault: false, canRelayTraffic: false,
    canAccessMarketplace: false, canAccessWallet: false, canModerateContent: false,
    canManageUsers: false, canViewMetrics: false, canAllocateResources: false, canAccessAI: false,
  },
};

export interface NetWorldListing {
  id: string;
  node_id: string;
  location: string;
  speed_mbps: number;
  price_per_gb: number;
  available_hours: number;
  reputation: number;
  online: boolean;
}

export interface SpeedTestResult {
  download_kbps: number;
  upload_kbps: number;
  latency_ms: number;
  jitter_ms: number;
  timestamp: number;
}

export interface GhostOriginStatus {
  active: boolean;
  exit_node_region: string | null;
  circuit_hops: number;
  data_saved_mb: number;
  latency_overhead_ms: number;
  anonymity_score: number;
}

export interface ResourceAllocation {
  cpuCores: number;
  ramMb: number;
  bandwidthUpKbps: number;
  bandwidthDownKbps: number;
  storageGb: number;
  relayCapacity: number;
  maxConnections: number;
  priority: 'realtime' | 'high' | 'normal' | 'low';
}

// ─── SARAI (Wallet) ──────────────────────────────────────────────────────────
export interface WalletBalance {
  balance: number;
  pending: number;
  total_earned: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'earning';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  from: string;
  to: string;
  timestamp: number;
  description: string;
}

export interface WalletNotification {
  id: string;
  type: 'incoming' | 'outgoing' | 'completed' | 'failed';
  amount: number;
  from_to: string;
  timestamp: number;
  read: boolean;
}

// ─── STARTERAN (Bandwidth) ───────────────────────────────────────────────────
export interface StarteranStatus {
  sharing_active: boolean;
  active_connections: number;
  traffic_shared_gb: number;
  earnings: number;
  reliability_score: number;
  approval_level: string;
}

export interface SpeedScanResult {
  download_mbps: number;
  upload_mbps: number;
  stability: number;
  latency_ms: number;
  packet_loss: number;
  device_reliability: number;
}

// ─── RENTBIT (Servers) ───────────────────────────────────────────────────────
export interface RentbitStatus {
  active_rentals: number;
  cpu_usage: number;
  ram_usage: number;
  storage_usage: number;
  earnings: number;
  host_rating: number;
  qualified: boolean;
}

export interface DeviceScanResult {
  cpu_cores: number;
  cpu_speed_ghz: number;
  ram_gb: number;
  storage_gb: number;
  network_mbps: number;
  uptime_hours: number;
  security_status: string;
}

// ─── CONTACTS ────────────────────────────────────────────────────────────────
export interface Contact {
  id: string;
  contact_node_id: string;
  contact_username: string;
  nickname: string;
  service_name: string;
  share_code: string;
  pinc_id: string;
  status: string;
  created_at: number;
}

// ─── FORUM (Anonymous public forum) ─────────────────────────────────────────
export interface ForumPost {
  id: string;
  author_pinc_id: string;
  display_name: string;
  content: string;
  post_type: string;
  visibility: string;
  like_count: number;
  reply_count: number;
  reply_to: string | null;
  tags: string[];
  encrypted: boolean;
  created_at: number;
  edited_at: number | null;
}

export interface ForumComment {
  id: string;
  post_id: string;
  author_pinc_id: string;
  display_name: string;
  content: string;
  like_count: number;
  created_at: number;
}

export interface ForumProfile {
  pinc_id: string;
  handle: string;
  display_name: string;
  bio: string;
  avatar_hash: string | null;
  is_verified: boolean;
  created_at: number;
}

// ─── COMMUNITIES ─────────────────────────────────────────────────────────────
export interface Community {
  id: string;
  name: string;
  type: 'public' | 'private' | 'gaming' | 'coding' | 'business';
  member_ids: string[];
  member_count: number;
  description: string;
  icon: string;
  created_at: number;
}

export interface Conversation {
  id: string;
  name: string;
  type: 'private' | 'group' | 'family' | 'business';
  last_message: string;
  last_message_at: number;
  unread_count: number;
  avatar_color: string;
}

export interface CallRecord {
  id: string;
  contact: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  duration_secs: number;
  timestamp: number;
}

export interface Community {
  id: string;
  name: string;
  type: 'public' | 'private' | 'gaming' | 'coding' | 'business';
  member_count: number;
  description: string;
  icon: string;
}

export interface StatusUpdate {
  id: string;
  author_id: string;
  content: string;
  type: 'text' | 'image' | 'video';
  timestamp: number;
  reactions: number;
}

// ─── WAGERS (Gaming) ─────────────────────────────────────────────────────────
export interface Game {
  id: string;
  name: string;
  category: 'single_player' | 'multiplayer' | 'family';
  icon: string;
  players: number;
  rating: number;
}

export interface GDGame {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  category: string;
  provider: string;
  rating: number;
  plays: number;
}

export interface GameSession {
  session_id: string;
  game_id: string;
  game_title: string;
  player_ids: string[];
  bet_amount: number;
  status: 'waiting' | 'active' | 'completed';
  scores: Record<string, number>;
  winner_id: string | null;
  result: 'win' | 'loss' | 'draw' | null;
  started_at: number;
  ended_at: number | null;
}

export interface GameResult {
  session_id: string;
  game_id: string;
  player_id: string;
  score: number;
  result: 'win' | 'loss' | 'draw';
  bet_amount: number;
  payout: number;
  timestamp: number;
}

export interface GDGameEvent {
  type: "game_ready" | "game_start" | "game_pause" | "game_end" | "ad_start" | "ad_end" | "error" | "GAME_READY" | "GAME_START" | "GAME_PAUSE" | "GAME_END" | "GD_SDK_ERROR" | string;
  gameId?: string;
  name?: string;
  description?: string;
  errordomain?: string;
  errorcode?: number;
  timestamp: number;
}

export interface LeaderboardPlayer {
  user_id: string;
  username: string;
  avatar_url: string;
  score: number;
  games_won: number;
  games_played: number;
  win_rate: number;
}

export interface Tournament {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'annual';
  prize_pool: number;
  participants: number;
  max_participants: number;
  starts_at: number;
  status: 'upcoming' | 'active' | 'completed';
}

export interface Challenge {
  id: string;
  title: string;
  category: 'gaming' | 'coding' | 'cybersecurity' | 'ai' | 'design' | 'content' | 'business' | 'innovation';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  reward_points: number;
  participants: number;
  status: 'open' | 'in_progress' | 'completed';
}

// ─── JOBS ────────────────────────────────────────────────────────────────────
export interface Job {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  budget: number;
  skills: string[];
  posted_at: number;
  applicants: number;
  status: 'open' | 'in_progress' | 'completed';
  employer: string;
}

// ─── RANKINGS ────────────────────────────────────────────────────────────────
export interface RankingEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  country: string;
  avatar_color: string;
}

// ─── SECURITY ────────────────────────────────────────────────────────────────
export interface SecurityLog {
  id: string;
  action: string;
  details: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: number;
  ip_address: string;
}

export interface Device {
  id: string;
  name: string;
  type: 'primary' | 'linked';
  added_at: number;
  last_active: number;
  is_current: boolean;
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  category: 'wallet' | 'games' | 'challenges' | 'jobs' | 'network' | 'server' | 'security' | 'platform';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// ─── NEW TYPES ───────────────────────────────────────────────────────────────
export interface ProblemPost {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: 'open' | 'urgent' | 'critical';
  timeRemaining: string;
  postedBy: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  seller: string;
  type: string;
}

export interface DuelChallenge {
  id: string;
  type: string;
  entryFee: number;
  prizePool: number;
  playersOnline: number;
}
