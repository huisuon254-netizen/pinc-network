import type { ThemeId } from '../contexts/ThemeContext';

export interface AccountSettings {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  displayName: string;
  bio: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'authenticator' | 'sms' | 'email';
  sessionTimeout: number;
  loginAlerts: boolean;
  biometricLogin: boolean;
  passcodeEnabled: boolean;
  passcodeHash: string | null;
  autoLockEnabled: boolean;
  autoLockDelay: number; // seconds
  requirePasscodeOnStart: boolean;
  fingerprintEnabled: boolean;
  passwordLastChanged: number | null;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'contacts';
  showOnlineStatus: boolean;
  allowDataCollection: boolean;
  shareAnalytics: boolean;
  showWalletAddress: boolean;
  incognitoMode: boolean;
  hideBalances: boolean;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  transactionAlerts: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface AppearanceSettings {
  theme: ThemeId;
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  compactMode: boolean;
  animationsEnabled: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
}

export interface NetworkSettings {
  // Standalone wallet — connection basics only (no relay/peers/mesh)
  useProxy: boolean;
  proxyAddress: string;
  proxyPort: string;
  proxyType: 'http' | 'socks5';
  customDns: boolean;
  dnsServer: string;
  connectionTimeout: number;
}

export interface BackupSettings {
  lastBackupDate: string | null;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  encryptBackups: boolean;
  backupLocation: string;
  includeVault: boolean;
}

export interface AllSettings {
  account: AccountSettings;
  security: SecuritySettings;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  network: NetworkSettings;
  backup: BackupSettings;
}

export const DEFAULT_SETTINGS: AllSettings = {
  account: {
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    displayName: '',
    bio: '',
  },
  security: {
    twoFactorEnabled: false,
    twoFactorMethod: 'authenticator',
    sessionTimeout: 30,
    loginAlerts: true,
    biometricLogin: false,
    passcodeEnabled: false,
    passcodeHash: null,
    autoLockEnabled: true,
    autoLockDelay: 60,
    requirePasscodeOnStart: false,
    fingerprintEnabled: false,
    passwordLastChanged: null,
  },
  privacy: {
    profileVisibility: 'contacts',
    showOnlineStatus: true,
    allowDataCollection: false,
    shareAnalytics: false,
    showWalletAddress: true,
    incognitoMode: false,
    hideBalances: false,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    transactionAlerts: true,
    securityAlerts: true,
    marketingEmails: false,
    weeklyDigest: false,
    soundEnabled: true,
    vibrationEnabled: true,
  },
  appearance: {
    theme: 'light-luxe',
    fontSize: 'medium',
    language: 'en-US',
    compactMode: false,
    animationsEnabled: true,
    reduceMotion: false,
    highContrast: false,
  },
  network: {
    useProxy: false,
    proxyAddress: '',
    proxyPort: '',
    proxyType: 'http',
    customDns: false,
    dnsServer: '1.1.1.1',
    connectionTimeout: 30,
  },
  backup: {
    lastBackupDate: null,
    autoBackup: false,
    backupFrequency: 'weekly',
    encryptBackups: true,
    backupLocation: '',
    includeVault: true,
  },
};

export type SettingsSection = keyof AllSettings;
export type UserRole = 'user' | 'admin' | 'guest' | 'operator';
