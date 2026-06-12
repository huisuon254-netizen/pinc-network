export interface Identity {
  id: string;
  node_id: string;
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
}

export type AppScreen = 'splash' | 'login' | 'dashboard';
export type DashTab = 'home' | 'vault' | 'network' | 'messages' | 'settings' | 'marketplace' | 'wallet';

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
