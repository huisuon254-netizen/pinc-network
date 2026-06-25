import React, { useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store/appStore';
import { DEFAULT_SETTINGS, AllSettings } from '../../types/settings';

type SettingsSection = keyof AllSettings;

interface SectionConfig {
  key: SettingsSection;
  title: string;
  icon: string;
  description: string;
}

const SECTIONS: SectionConfig[] = [
  { key: 'account', title: 'Account', icon: '\u{1F464}', description: 'Username, email, and password' },
  { key: 'security', title: 'Security', icon: '\u{1F512}', description: '2FA, sessions, and login alerts' },
  { key: 'privacy', title: 'Privacy', icon: '\u{1F6E1}\u{FE0F}', description: 'Profile visibility and data sharing' },
  { key: 'notifications', title: 'Notifications', icon: '\u{1F514}', description: 'Email, push, and in-app alerts' },
  { key: 'appearance', title: 'Appearance', icon: '\u{1F3A8}', description: 'Theme, font size, and language' },
  { key: 'network', title: 'Network', icon: '\u{1F310}', description: 'Proxy, DNS, and connection settings' },
  { key: 'ai', title: 'AI Settings', icon: '\u{1F916}', description: 'API keys and model preferences' },
  { key: 'backup', title: 'Backup & Restore', icon: '\u{1F4BE}', description: 'Wallet backup and data export' },
];

const DANGER_ACTIONS = [
  {
    id: 'delete-account',
    title: 'Delete Account',
    description: 'Permanently delete your account and all associated data. This action cannot be undone.',
    confirmText: 'DELETE',
    action: 'deleteAccount',
  },
  {
    id: 'reset-wallet',
    title: 'Reset Wallet',
    description: 'Remove all wallet data and start fresh. Make sure you have a backup of your keys.',
    confirmText: 'RESET',
    action: 'resetWallet',
  },
  {
    id: 'clear-data',
    title: 'Clear All Data',
    description: 'Remove all local data including settings, cache, and session information.',
    confirmText: 'CLEAR',
    action: 'clearData',
  },
];

const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
] as const;

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
] as const;

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espanol' },
  { value: 'fr', label: 'Francais' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
] as const;

const AI_MODEL_OPTIONS = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'local', label: 'Local Model' },
] as const;

const BACKUP_FREQ_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

const TWO_FA_METHOD_OPTIONS = [
  { value: 'authenticator', label: 'Authenticator App' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
] as const;

const PROFILE_VIS_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'contacts', label: 'Contacts Only' },
] as const;

const PROXY_TYPE_OPTIONS = [
  { value: 'http', label: 'HTTP' },
  { value: 'socks5', label: 'SOCKS5' },
] as const;

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
        checked ? 'bg-purple-600' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { readonly value: string; readonly label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RangeInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-sm text-purple-400 font-mono">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
      />
    </div>
  );
}

function SectionWrapper({
  isExpanded,
  onToggle,
  children,
  title,
  description,
  icon,
  isDirty,
}: {
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  title: string;
  description: string;
  icon: string;
  isDirty: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-700/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold">{title}</h3>
              {isDirty && <span className="h-2 w-2 rounded-full bg-yellow-400" />}
            </div>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="p-4 bg-gray-900/50 border-t border-gray-700/50">
          {children}
        </div>
      )}
    </div>
  );
}

function SaveBar({
  section,
  saving,
  onSave,
  onReset,
}: {
  section: SettingsSection;
  saving: SettingsSection | null;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-700">
      <button
        onClick={onReset}
        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        Reset to Defaults
      </button>
      <button
        onClick={onSave}
        disabled={saving === section}
        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {saving === section ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}

function SettingsPage() {
  const { settings, saveSettings } = useAppStore();
  const [expandedSections, setExpandedSections] = useState<Set<SettingsSection>>(new Set(['account']));
  const [dirtySections, setDirtySections] = useState<Set<SettingsSection>>(new Set());
  const [saving, setSaving] = useState<SettingsSection | null>(null);
  const [dangerConfirmId, setDangerConfirmId] = useState<string | null>(null);
  const [dangerInput, setDangerInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = useCallback((section: SettingsSection) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const markDirty = useCallback((section: SettingsSection) => {
    setDirtySections((prev) => new Set(prev).add(section));
  }, []);

  const showStatus = useCallback((type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  }, []);

  const handleSave = useCallback(
    async (section: SettingsSection) => {
      setSaving(section);
      try {
        await saveSettings();
        setDirtySections((prev) => {
          const next = new Set(prev);
          next.delete(section);
          return next;
        });
        showStatus('success', `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved`);
      } catch (err) {
        showStatus('error', `Failed to save: ${err}`);
      } finally {
        setSaving(null);
      }
    },
    [settings, saveSettings, showStatus]
  );

  const handleReset = useCallback(
    async (section: SettingsSection) => {
      try {
        await invoke('save_settings', { section, settings: DEFAULT_SETTINGS[section] });
        showStatus('success', `${section.charAt(0).toUpperCase() + section.slice(1)} reset to defaults`);
      } catch {
        showStatus('error', 'Failed to persist reset');
      }
    },
    [showStatus]
  );

  const handleDangerAction = useCallback(
    async (action: string) => {
      try {
        await invoke(action);
        showStatus('success', 'Action completed successfully');
      } catch (err) {
        showStatus('error', `Action failed: ${err}`);
      }
      setDangerConfirmId(null);
      setDangerInput('');
    },
    [showStatus]
  );

  const handleExport = useCallback(() => {
    try {
      const exportData = JSON.stringify(settings, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pinc-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus('success', 'Settings exported');
    } catch (err) {
      showStatus('error', `Export failed: ${err}`);
    }
  }, [settings, showStatus]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text) as AllSettings;
        await saveSettings();
        showStatus('success', 'Settings imported');
      } catch (err) {
        showStatus('error', `Import failed: ${err}`);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [saveSettings, showStatus]
  );

  const handleResetAll = useCallback(async () => {
    try {
      await invoke('save_settings', { section: 'all', settings: DEFAULT_SETTINGS });
      showStatus('success', 'All settings reset to defaults');
    } catch {
      showStatus('error', 'Failed to persist reset');
    }
    setDirtySections(new Set());
  }, [showStatus]);

  const update = useCallback(
    (section: SettingsSection, field: string, value: any) => {
      const newSettings = { ...settings };
      if (!newSettings[section]) {
        newSettings[section] = {} as any;
      }
      (newSettings[section] as any)[field] = value;
      markDirty(section);
    },
    [settings, markDirty]
  );

  const handleBackupNow = useCallback(async () => {
    try {
      await invoke('create_backup');
      update('backup', 'lastBackupDate', new Date().toISOString());
      showStatus('success', 'Backup created successfully');
    } catch (err) {
      showStatus('error', `Backup failed: ${err}`);
    }
  }, [update, showStatus]);

  const handleRestore = useCallback(async () => {
    try {
      await invoke('restore_backup');
      showStatus('success', 'Backup restored successfully');
    } catch (err) {
      showStatus('error', `Restore failed: ${err}`);
    }
  }, [showStatus]);

  const renderAccountSection = () => (
    <div className="space-y-4">
      <TextInput
        label="Username"
        value={settings.account.username}
        onChange={(v) => update('account', 'username', v)}
        placeholder="Enter username"
      />
      <TextInput
        label="Email"
        value={settings.account.email}
        onChange={(v) => update('account', 'email', v)}
        type="email"
        placeholder="user@example.com"
      />
      <div className="pt-2 border-t border-gray-700/50">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Change Password</h4>
        <div className="space-y-3">
          <TextInput
            label="Current Password"
            value={settings.account.currentPassword}
            onChange={(v) => update('account', 'currentPassword', v)}
            type="password"
            placeholder="Enter current password"
          />
          <TextInput
            label="New Password"
            value={settings.account.newPassword}
            onChange={(v) => update('account', 'newPassword', v)}
            type="password"
            placeholder="Enter new password"
          />
          <TextInput
            label="Confirm New Password"
            value={settings.account.confirmPassword}
            onChange={(v) => update('account', 'confirmPassword', v)}
            type="password"
            placeholder="Confirm new password"
          />
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-4">
      <ToggleRow
        label="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
        checked={settings.security.twoFactorEnabled}
        onChange={(v) => update('security', 'twoFactorEnabled', v)}
      />
      {settings.security.twoFactorEnabled && (
        <Select
          label="2FA Method"
          value={settings.security.twoFactorMethod}
          onChange={(v) => update('security', 'twoFactorMethod', v)}
          options={TWO_FA_METHOD_OPTIONS}
        />
      )}
      <RangeInput
        label="Session Timeout"
        value={settings.security.sessionTimeout}
        onChange={(v) => update('security', 'sessionTimeout', v)}
        min={5}
        max={120}
        step={5}
        unit=" min"
      />
      <ToggleRow
        label="Login Alerts"
        description="Get notified when someone logs into your account"
        checked={settings.security.loginAlerts}
        onChange={(v) => update('security', 'loginAlerts', v)}
      />
      <ToggleRow
        label="Biometric Login"
        description="Use fingerprint or face recognition to log in"
        checked={settings.security.biometricLogin}
        onChange={(v) => update('security', 'biometricLogin', v)}
      />
    </div>
  );

  const renderPrivacySection = () => (
    <div className="space-y-4">
      <Select
        label="Profile Visibility"
        value={settings.privacy.profileVisibility}
        onChange={(v) => update('privacy', 'profileVisibility', v)}
        options={PROFILE_VIS_OPTIONS}
      />
      <ToggleRow
        label="Show Online Status"
        description="Let others see when you are online"
        checked={settings.privacy.showOnlineStatus}
        onChange={(v) => update('privacy', 'showOnlineStatus', v)}
      />
      <ToggleRow
        label="Show Wallet Address"
        description="Display your wallet address on your profile"
        checked={settings.privacy.showWalletAddress}
        onChange={(v) => update('privacy', 'showWalletAddress', v)}
      />
      <ToggleRow
        label="Allow Data Collection"
        description="Help improve the app by sharing usage data"
        checked={settings.privacy.allowDataCollection}
        onChange={(v) => update('privacy', 'allowDataCollection', v)}
      />
      <ToggleRow
        label="Share Analytics"
        description="Share anonymous analytics with the community"
        checked={settings.privacy.shareAnalytics}
        onChange={(v) => update('privacy', 'shareAnalytics', v)}
      />
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="space-y-4">
      <ToggleRow
        label="Email Notifications"
        description="Receive notifications via email"
        checked={settings.notifications.emailNotifications}
        onChange={(v) => update('notifications', 'emailNotifications', v)}
      />
      <ToggleRow
        label="Push Notifications"
        description="Receive push notifications on your device"
        checked={settings.notifications.pushNotifications}
        onChange={(v) => update('notifications', 'pushNotifications', v)}
      />
      <ToggleRow
        label="In-App Notifications"
        description="Show notifications within the app"
        checked={settings.notifications.inAppNotifications}
        onChange={(v) => update('notifications', 'inAppNotifications', v)}
      />
      <div className="pt-2 border-t border-gray-700/50">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Alert Types</h4>
        <div className="space-y-1">
          <ToggleRow
            label="Transaction Alerts"
            description="Notify on outgoing and incoming transactions"
            checked={settings.notifications.transactionAlerts}
            onChange={(v) => update('notifications', 'transactionAlerts', v)}
          />
          <ToggleRow
            label="Security Alerts"
            description="Notify on suspicious activity"
            checked={settings.notifications.securityAlerts}
            onChange={(v) => update('notifications', 'securityAlerts', v)}
          />
        </div>
      </div>
      <div className="pt-2 border-t border-gray-700/50">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Marketing</h4>
        <div className="space-y-1">
          <ToggleRow
            label="Marketing Emails"
            description="Receive emails about new features and promotions"
            checked={settings.notifications.marketingEmails}
            onChange={(v) => update('notifications', 'marketingEmails', v)}
          />
          <ToggleRow
            label="Weekly Digest"
            description="Get a weekly summary of your activity"
            checked={settings.notifications.weeklyDigest}
            onChange={(v) => update('notifications', 'weeklyDigest', v)}
          />
        </div>
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="space-y-4">
      <Select
        label="Theme"
        value={settings.appearance.theme}
        onChange={(v) => update('appearance', 'theme', v)}
        options={THEME_OPTIONS}
      />
      <Select
        label="Font Size"
        value={settings.appearance.fontSize}
        onChange={(v) => update('appearance', 'fontSize', v)}
        options={FONT_SIZE_OPTIONS}
      />
      <Select
        label="Language"
        value={settings.appearance.language}
        onChange={(v) => update('appearance', 'language', v)}
        options={LANGUAGE_OPTIONS}
      />
      <ToggleRow
        label="Compact Mode"
        description="Use a more compact layout"
        checked={settings.appearance.compactMode}
        onChange={(v) => update('appearance', 'compactMode', v)}
      />
      <ToggleRow
        label="Animations"
        description="Enable smooth animations and transitions"
        checked={settings.appearance.animationsEnabled}
        onChange={(v) => update('appearance', 'animationsEnabled', v)}
      />
    </div>
  );

  const renderNetworkSection = () => (
    <div className="space-y-4">
      <ToggleRow
        label="Use Proxy"
        description="Route connections through a proxy server"
        checked={settings.network.useProxy}
        onChange={(v) => update('network', 'useProxy', v)}
      />
      {settings.network.useProxy && (
        <div className="space-y-3 pl-4 border-l-2 border-purple-600/30">
          <TextInput
            label="Proxy Address"
            value={settings.network.proxyAddress}
            onChange={(v) => update('network', 'proxyAddress', v)}
            placeholder="192.168.1.1"
          />
          <TextInput
            label="Proxy Port"
            value={settings.network.proxyPort}
            onChange={(v) => update('network', 'proxyPort', v)}
            placeholder="8080"
          />
          <Select
            label="Proxy Type"
            value={settings.network.proxyType}
            onChange={(v) => update('network', 'proxyType', v)}
            options={PROXY_TYPE_OPTIONS}
          />
        </div>
      )}
      <ToggleRow
        label="Custom DNS"
        description="Use a custom DNS server"
        checked={settings.network.customDns}
        onChange={(v) => update('network', 'customDns', v)}
      />
      {settings.network.customDns && (
        <div className="pl-4 border-l-2 border-purple-600/30">
          <TextInput
            label="DNS Server"
            value={settings.network.dnsServer}
            onChange={(v) => update('network', 'dnsServer', v)}
            placeholder="1.1.1.1"
          />
        </div>
      )}
      <RangeInput
        label="Connection Timeout"
        value={settings.network.connectionTimeout}
        onChange={(v) => update('network', 'connectionTimeout', v)}
        min={5}
        max={60}
        step={5}
        unit="s"
      />
      <ToggleRow
        label="Auto Reconnect"
        description="Automatically reconnect when connection is lost"
        checked={settings.network.autoReconnect}
        onChange={(v) => update('network', 'autoReconnect', v)}
      />
    </div>
  );

  const renderAISection = () => (
    <div className="space-y-4">
      <TextInput
        label="API Key"
        value={settings.ai.apiKey}
        onChange={(v) => update('ai', 'apiKey', v)}
        type="password"
        placeholder="sk-..."
      />
      <TextInput
        label="Custom Endpoint"
        value={settings.ai.customEndpoint}
        onChange={(v) => update('ai', 'customEndpoint', v)}
        placeholder="https://api.example.com/v1"
      />
      <Select
        label="Model"
        value={settings.ai.model}
        onChange={(v) => update('ai', 'model', v)}
        options={AI_MODEL_OPTIONS}
      />
      <RangeInput
        label="Temperature"
        value={settings.ai.temperature}
        onChange={(v) => update('ai', 'temperature', v)}
        min={0}
        max={2}
        step={0.1}
      />
      <RangeInput
        label="Max Tokens"
        value={settings.ai.maxTokens}
        onChange={(v) => update('ai', 'maxTokens', v)}
        min={256}
        max={8192}
        step={256}
      />
      <ToggleRow
        label="Streaming"
        description="Stream AI responses in real-time"
        checked={settings.ai.streamingEnabled}
        onChange={(v) => update('ai', 'streamingEnabled', v)}
      />
      <ToggleRow
        label="Auto Suggestions"
        description="Show AI suggestions as you type"
        checked={settings.ai.autoSuggestions}
        onChange={(v) => update('ai', 'autoSuggestions', v)}
      />
    </div>
  );

  const renderBackupSection = () => (
    <div className="space-y-4">
      {settings.backup.lastBackupDate && (
        <div className="p-3 rounded-lg bg-gray-800 border border-gray-700">
          <p className="text-xs text-gray-400">Last Backup</p>
          <p className="text-sm text-white font-mono">
            {settings.backup.lastBackupDate ? new Date(settings.backup.lastBackupDate).toLocaleString() : 'Never'}
          </p>
        </div>
      )}
      <ToggleRow
        label="Auto Backup"
        description="Automatically back up your data"
        checked={settings.backup.autoBackup}
        onChange={(v) => update('backup', 'autoBackup', v)}
      />
      {settings.backup.autoBackup && (
        <Select
          label="Backup Frequency"
          value={settings.backup.backupFrequency}
          onChange={(v) => update('backup', 'backupFrequency', v)}
          options={BACKUP_FREQ_OPTIONS}
        />
      )}
      <ToggleRow
        label="Encrypt Backups"
        description="Encrypt backup files for extra security"
        checked={settings.backup.encryptBackups}
        onChange={(v) => update('backup', 'encryptBackups', v)}
      />
      <div className="pt-2 border-t border-gray-700/50">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Export / Import</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleBackupNow}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Backup Now
          </button>
          <button
            onClick={handleRestore}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Restore
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Export Settings
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Import Settings
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );

  const renderSectionContent = (section: SettingsSection) => {
    switch (section) {
      case 'account': return renderAccountSection();
      case 'security': return renderSecuritySection();
      case 'privacy': return renderPrivacySection();
      case 'notifications': return renderNotificationsSection();
      case 'appearance': return renderAppearanceSection();
      case 'network': return renderNetworkSection();
      case 'ai': return renderAISection();
      case 'backup': return renderBackupSection();
      default: return null;
    }
  };

  const renderDangerZone = () => (
    <div className="rounded-xl border border-red-500/30 overflow-hidden">
      <div className="p-4 bg-red-500/5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{'\u{26A0}\u{FE0F}'}</span>
          <div>
            <h3 className="text-red-400 font-semibold">Danger Zone</h3>
            <p className="text-sm text-gray-400">Irreversible actions that affect your account and data</p>
          </div>
        </div>
      </div>
      <div className="p-4 bg-gray-900/50 border-t border-red-500/20 space-y-3">
        {DANGER_ACTIONS.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
          >
            <div className="flex-1 mr-4">
              <p className="text-sm font-medium text-red-300">{item.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
            </div>
            {dangerConfirmId === item.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={dangerInput}
                  onChange={(e) => setDangerInput(e.target.value)}
                  placeholder={`Type ${item.confirmText}`}
                  className="w-32 rounded-lg border border-red-500/50 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button
                  onClick={() => handleDangerAction(item.action)}
                  disabled={dangerInput !== item.confirmText}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setDangerConfirmId(null);
                    setDangerInput('');
                  }}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setDangerConfirmId(item.id);
                  setDangerInput('');
                }}
                className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 text-sm font-medium rounded-lg transition-colors"
              >
                {item.title}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-gray-400 mt-1">Manage your account, security, and preferences</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700"
            >
              Export
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700"
            >
              Import
            </button>
            <button
              onClick={handleResetAll}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700"
            >
              Reset All
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mb-6 p-3 rounded-lg text-sm font-medium ${
              statusMessage.type === 'success'
                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <div className="space-y-3">
          {SECTIONS.map((section) => (
            <SectionWrapper
              key={section.key}
              title={section.title}
              description={section.description}
              icon={section.icon}
              isExpanded={expandedSections.has(section.key)}
              onToggle={() => toggleSection(section.key)}
              isDirty={dirtySections.has(section.key)}
            >
              {renderSectionContent(section.key)}
              <SaveBar
                section={section.key}
                saving={saving}
                onSave={() => handleSave(section.key)}
                onReset={() => handleReset(section.key)}
              />
            </SectionWrapper>
          ))}
        </div>

        <div className="mt-6">
          {renderDangerZone()}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">PINC Settings v1.0</p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
