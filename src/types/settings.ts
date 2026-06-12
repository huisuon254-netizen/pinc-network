export interface AccountSettings {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'authenticator' | 'sms' | 'email';
  sessionTimeout: number;
  loginAlerts: boolean;
  biometricLogin: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'contacts';
  showOnlineStatus: boolean;
  allowDataCollection: boolean;
  shareAnalytics: boolean;
  showWalletAddress: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  transactionAlerts: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
}

export interface AppearanceSettings {
  theme: 'dark' | 'light' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  compactMode: boolean;
  animationsEnabled: boolean;
}

export interface NetworkSettings {
  useProxy: boolean;
  proxyAddress: string;
  proxyPort: string;
  proxyType: 'http' | 'socks5';
  customDns: boolean;
  dnsServer: string;
  connectionTimeout: number;
  autoReconnect: boolean;
}

export interface AISettings {
  apiKey: string;
  groq_api_key: string;
  model: string;
  groq_model: string;
  temperature: number;
  maxTokens: number;
  streamingEnabled: boolean;
  autoSuggestions: boolean;
  customEndpoint: string;
}

export interface BackupSettings {
  lastBackupDate: string | null;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  encryptBackups: boolean;
}

export interface AllSettings {
  account: AccountSettings;
  security: SecuritySettings;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  network: NetworkSettings;
  ai: AISettings;
  backup: BackupSettings;
}

export const DEFAULT_SETTINGS: AllSettings = {
  account: {
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
  security: {
    twoFactorEnabled: false,
    twoFactorMethod: 'authenticator',
    sessionTimeout: 30,
    loginAlerts: true,
    biometricLogin: false,
  },
  privacy: {
    profileVisibility: 'contacts',
    showOnlineStatus: true,
    allowDataCollection: false,
    shareAnalytics: false,
    showWalletAddress: true,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    transactionAlerts: true,
    securityAlerts: true,
    marketingEmails: false,
    weeklyDigest: false,
  },
  appearance: {
    theme: 'dark',
    fontSize: 'medium',
    language: 'en',
    compactMode: false,
    animationsEnabled: true,
  },
  network: {
    useProxy: false,
    proxyAddress: '',
    proxyPort: '',
    proxyType: 'http',
    customDns: false,
    dnsServer: '1.1.1.1',
    connectionTimeout: 30,
    autoReconnect: true,
  },
  ai: {
    apiKey: '',
    groq_api_key: '',
    model: 'gpt-4',
    groq_model: 'llama-3.1-70b-8192',
    temperature: 0.7,
    maxTokens: 2048,
    streamingEnabled: true,
    autoSuggestions: true,
    customEndpoint: '',
  },
  backup: {
    lastBackupDate: null,
    autoBackup: false,
    backupFrequency: 'weekly',
    encryptBackups: true,
  },
};