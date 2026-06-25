import { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useI18n } from '../../i18n';
import { useAppStore } from '../../store/appStore';
import { User, Mail, Shield, Bell, Eye, Edit3, Save, X, Camera, Lock, Globe, Users } from 'lucide-react';

interface ProfileData {
  displayName: string;
  email: string;
  bio: string;
  avatarUrl: string;
}

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

const PROFILE_VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'contacts', label: 'Contacts Only' },
] as const;

export default function ProfilePage() {
  const { t } = useI18n();
  const identity = useAppStore((s) => s.identity);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'privacy' | 'notifications'>('profile');
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: identity?.id || '',
    email: '',
    bio: '',
    avatarUrl: '',
  });

  useEffect(() => {
    invoke<{ display_name?: string; email?: string; bio?: string }>('cmd_get_identity')
      .then(data => {
        setProfileData(prev => ({
          ...prev,
          displayName: data.display_name || prev.displayName,
          email: data.email || prev.email,
          bio: data.bio || prev.bio,
        }));
      })
      .catch(() => {});
  }, []);
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    biometricLogin: false,
  });
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    showWalletAddress: false,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    profileUpdates: true,
  });

  const handleSave = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setProfileData({
      displayName: identity?.id || '',
      email: '',
      bio: '',
      avatarUrl: '',
    });
  }, [identity]);

  const sections = [
    { key: 'profile' as const, icon: User, label: t('profile.settings') },
    { key: 'security' as const, icon: Shield, label: t('profile.security') },
    { key: 'privacy' as const, icon: Eye, label: t('profile.privacy') },
    { key: 'notifications' as const, icon: Bell, label: t('profile.notifications') },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('profile.title')}</h1>
            <p className="text-sm text-gray-400 mt-1">{t('profile.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700 flex items-center gap-2"
                >
                  <X size={14} />
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save size={14} />
                  {t('common.save')}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Edit3 size={14} />
                {t('profile.edit')}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-48 flex-shrink-0">
            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeSection === section.key
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                  >
                    <Icon size={16} />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6">
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-mono font-bold">
                        {profileData.displayName.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                      {isEditing && (
                        <button className="absolute bottom-0 right-0 p-2 bg-gray-800 rounded-full border border-gray-600 hover:bg-gray-700 transition-colors">
                          <Camera size={14} className="text-gray-300" />
                        </button>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {profileData.displayName || identity?.node_id?.slice(0, 8) || 'User'}
                      </h2>
                      <p className="text-sm text-gray-400">{identity?.node_id}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <TextInput
                      label={t('profile.name')}
                      value={profileData.displayName}
                      onChange={(v) => setProfileData({ ...profileData, displayName: v })}
                      placeholder={t('profile.name_placeholder')}
                      disabled={!isEditing}
                    />
                    <TextInput
                      label={t('profile.email')}
                      value={profileData.email}
                      onChange={(v) => setProfileData({ ...profileData, email: v })}
                      type="email"
                      placeholder={t('profile.email_placeholder')}
                      disabled={!isEditing}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">{t('profile.bio')}</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        placeholder={t('profile.bio_placeholder')}
                        disabled={!isEditing}
                        rows={4}
                        className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">{t('profile.security')}</h3>
                  <ToggleRow
                    label={t('profile.two_factor')}
                    description={t('profile.two_factor_desc')}
                    checked={securitySettings.twoFactorEnabled}
                    onChange={(v) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: v })}
                  />
                  <ToggleRow
                    label={t('profile.login_alerts')}
                    description={t('profile.login_alerts_desc')}
                    checked={securitySettings.loginAlerts}
                    onChange={(v) => setSecuritySettings({ ...securitySettings, loginAlerts: v })}
                  />
                  <ToggleRow
                    label={t('profile.biometric')}
                    description={t('profile.biometric_desc')}
                    checked={securitySettings.biometricLogin}
                    onChange={(v) => setSecuritySettings({ ...securitySettings, biometricLogin: v })}
                  />
                </div>
              )}

              {activeSection === 'privacy' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">{t('profile.privacy')}</h3>
                  <Select
                    label={t('profile.visibility')}
                    value={privacySettings.profileVisibility}
                    onChange={(v) => setPrivacySettings({ ...privacySettings, profileVisibility: v })}
                    options={PROFILE_VISIBILITY_OPTIONS}
                  />
                  <ToggleRow
                    label={t('profile.show_online')}
                    description={t('profile.show_online_desc')}
                    checked={privacySettings.showOnlineStatus}
                    onChange={(v) => setPrivacySettings({ ...privacySettings, showOnlineStatus: v })}
                  />
                  <ToggleRow
                    label={t('profile.show_wallet')}
                    description={t('profile.show_wallet_desc')}
                    checked={privacySettings.showWalletAddress}
                    onChange={(v) => setPrivacySettings({ ...privacySettings, showWalletAddress: v })}
                  />
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">{t('profile.notifications')}</h3>
                  <ToggleRow
                    label={t('profile.email_notifs')}
                    description={t('profile.email_notifs_desc')}
                    checked={notificationSettings.emailNotifications}
                    onChange={(v) => setNotificationSettings({ ...notificationSettings, emailNotifications: v })}
                  />
                  <ToggleRow
                    label={t('profile.push_notifs')}
                    description={t('profile.push_notifs_desc')}
                    checked={notificationSettings.pushNotifications}
                    onChange={(v) => setNotificationSettings({ ...notificationSettings, pushNotifications: v })}
                  />
                  <ToggleRow
                    label={t('profile.profile_updates_notifs')}
                    description={t('profile.profile_updates_notifs_desc')}
                    checked={notificationSettings.profileUpdates}
                    onChange={(v) => setNotificationSettings({ ...notificationSettings, profileUpdates: v })}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
