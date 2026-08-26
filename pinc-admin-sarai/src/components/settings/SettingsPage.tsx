import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import {
  User, Shield, Eye, Bell, Palette, Wifi, HardDrive,
  Save, RotateCcw, KeyRound, Lock, Fingerprint, EyeOff, Mail, Smartphone, Globe, Database, Cpu,
  Sun, Moon, Monitor, Languages, Check, AlertTriangle, Download, Upload, Trash2, Users, Gem,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useTheme, THEME_META, type ThemeId } from '../../contexts/ThemeContext';
import { useI18n } from '../../i18n';
import LanguageSelector from '../language/LanguageSelector';
import GlassCard, { GlassCardHeader } from '../ui/GlassCard';
import Pill from '../ui/Pill';
import { statusBadgeMap } from '../sarai/shared/EscrowInline';
import { P2P_COUNTRIES } from '../sarai/shared/AgentSelector';

type Section = 'account' | 'security' | 'privacy' | 'notifications' | 'appearance' | 'network' | 'backup' | 'agent';

const SECTIONS: { id: Section; labelKey: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'account', labelKey: 'settings.account', icon: <User size={14} />, desc: 'Profile & credentials' },
  { id: 'security', labelKey: 'settings.security', icon: <Shield size={14} />, desc: 'Password · Passcode · Biometric' },
  { id: 'privacy', labelKey: 'settings.privacy', icon: <Eye size={14} />, desc: 'Visibility & data' },
  { id: 'notifications', labelKey: 'settings.notifications', icon: <Bell size={14} />, desc: 'Alerts & sounds' },
  { id: 'appearance', labelKey: 'settings.appearance', icon: <Palette size={14} />, desc: 'Theme · Language · UI' },
  { id: 'network', labelKey: 'nav.network', icon: <Wifi size={14} />, desc: 'Proxy · DNS basics' },
  { id: 'backup', labelKey: 'settings.backup', icon: <HardDrive size={14} />, desc: 'Export · Restore · Vault' },
  { id: 'agent', labelKey: 'app.agent', icon: <Users size={14} />, desc: 'Become a deposit agent' },
];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{hint}</span>}
    </label>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}>
      <span style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
      <span
        onClick={() => onChange(!checked)}
        style={{
          width: 38, height: 22, borderRadius: 999, background: checked ? 'var(--theme-accent)' : 'var(--border-bright)',
          position: 'relative', transition: 'all 0.2s', flexShrink: 0, display: 'inline-block',
          boxShadow: checked ? 'var(--theme-glow)' : 'none', cursor: 'pointer',
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2, width: 18, height: 18, borderRadius: 999, background: '#fff',
          transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }} />
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, resetSection, saveSettings } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [active, setActive] = useState<Section>('account');
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcode2, setPasscode2] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  // Deep-link: Deposit/Withdraw "Become an Agent →" opens this section (#p2p-agent)
  useEffect(() => {
    const applyHash = () => {
      if (window.location.hash === '#p2p-agent' || window.location.hash === '#agent') setActive('agent');
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  const handleSave = async () => {
    saveSettings();
    try { const { invoke } = await import('@tauri-apps/api/core'); await invoke('cmd_set_app_settings', { settings }); } catch {}
    setSavedFlash(active);
    setTimeout(()=>setSavedFlash(null), 1600);
  };

  const handleTheme = (id: ThemeId) => {
    setTheme(id);
    updateSettings('appearance', { theme: id } as any);
  };

  const handleSetPasscode = async () => {
    if (passcode.length < 4 || passcode.length > 8) { setPwdMsg('PIN must be 4–8 digits'); return; }
    if (passcode !== passcode2) { setPwdMsg('PINs do not match'); return; }
    if (!/^\d+$/.test(passcode)) { setPwdMsg('PIN must be digits only'); return; }
    try {
      await useAppStore.getState().setPasscode(passcode);
      setPwdMsg('Passcode set ✓');
      setPasscode(''); setPasscode2('');
      setTimeout(()=>setPwdMsg(null), 2000);
    } catch (e) { setPwdMsg(String(e)); }
  };

  const handleChangePassword = async () => {
    const acc = settings.account;
    if (!acc.currentPassword || !acc.newPassword) { setPwdMsg('Fill current and new password'); return; }
    if (acc.newPassword !== acc.confirmPassword) { setPwdMsg('New passwords do not match'); return; }
    if (acc.newPassword.length < 8) { setPwdMsg('Password must be ≥8 characters'); return; }
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('cmd_change_password', { currentPassword: acc.currentPassword, newPassword: acc.newPassword });
      updateSettings('account', { currentPassword: '', newPassword: '', confirmPassword: '' });
      updateSettings('security', { passwordLastChanged: Date.now() } as any);
      setPwdMsg('Password changed ✓');
      setTimeout(()=>setPwdMsg(null), 2000);
    } catch (e) {
      setPwdMsg(String(e));
    }
  };

  const handleFingerprint = async () => {
    const next = !settings.security.fingerprintEnabled;
    updateSettings('security', { fingerprintEnabled: next, biometricLogin: next } as any);
    if (next) {
      try { const { invoke } = await import('@tauri-apps/api/core'); await invoke('cmd_biometric_auth'); } catch {}
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>{t('app.settings')}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Manage your SARAI preferences — all settings persist securely.</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Pill onClick={()=>{ if (active !== 'agent') (resetSection as (s: string) => void)(active); }} style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}><RotateCcw size={12} /> Reset {active}</Pill>
          <Pill active onClick={handleSave}><Save size={12} /> Save</Pill>
        </div>
      </div>

      {/* Section nav — pills */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', padding: '4px', borderRadius: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border)', width: 'fit-content', maxWidth: '100%' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={()=>setActive(s.id)} style={{
            padding: '0.5rem 0.85rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            border: active===s.id? '1px solid var(--theme-accent)' : '1px solid transparent',
            background: active===s.id? 'var(--theme-accent)' : 'transparent',
            color: active===s.id? '#0a0a0f' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.18s',
            boxShadow: active===s.id? 'var(--theme-glow)' : 'none',
          }}>
            {s.icon} {t(s.labelKey)}
          </button>
        ))}
      </div>

      {savedFlash && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--neon-green)', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.22)', borderRadius: 999, padding: '0.35rem 0.7rem', width: 'fit-content' }}>
          <Check size={12} /> Saved {savedFlash} settings
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {active === 'account' && (
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <GlassCardHeader title="Account" subtitle="Profile & credentials — powered by PINC identity" icon={<User size={16} />} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '0.75rem' }}>
                <Field label="USERNAME"><input className="pinc-input" value={settings.account.username} onChange={e=>updateSettings('account', { username: e.target.value })} placeholder="QWEN" /></Field>
                <Field label="DISPLAY NAME"><input className="pinc-input" value={settings.account.displayName} onChange={e=>updateSettings('account', { displayName: e.target.value })} placeholder="Your display name" /></Field>
                <Field label="EMAIL"><input className="pinc-input" type="email" value={settings.account.email} onChange={e=>updateSettings('account', { email: e.target.value })} placeholder="you@example.com" /></Field>
                <Field label="BIO"><input className="pinc-input" value={settings.account.bio} onChange={e=>updateSettings('account', { bio: e.target.value })} placeholder="Short bio…" /></Field>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                Credentials are local-only. Changing password re-encrypts your private key with Argon2id.
              </div>
            </GlassCard>
          )}

          {active === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Password */}
              <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <GlassCardHeader title="Password" subtitle="Argon2-hashed, never stored in plaintext" icon={<KeyRound size={16} />} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '0.75rem' }}>
                  <Field label="CURRENT PASSWORD">
                    <div style={{ position: 'relative' }}>
                      <input className="pinc-input" type={showPwd?'text':'password'} value={settings.account.currentPassword} onChange={e=>updateSettings('account', { currentPassword: e.target.value })} placeholder="••••••••" />
                      <button onClick={()=>setShowPwd(v=>!v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>{showPwd? <EyeOff size={14} /> : <Eye size={14} />}</button>
                    </div>
                  </Field>
                  <Field label="NEW PASSWORD"><input className="pinc-input" type={showPwd?'text':'password'} value={settings.account.newPassword} onChange={e=>updateSettings('account', { newPassword: e.target.value })} placeholder="Min 8 characters" /></Field>
                  <Field label="CONFIRM NEW PASSWORD"><input className="pinc-input" type={showPwd?'text':'password'} value={settings.account.confirmPassword} onChange={e=>updateSettings('account', { confirmPassword: e.target.value })} placeholder="Repeat new password" /></Field>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Pill active onClick={handleChangePassword} style={{ fontSize: '0.75rem' }}><Lock size={12} /> Change password</Pill>
                  {settings.security.passwordLastChanged && <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Last changed {new Date(settings.security.passwordLastChanged).toLocaleDateString()}</span>}
                </div>
                {pwdMsg && <div style={{ fontSize: '0.7rem', color: pwdMsg.includes('✓')? 'var(--neon-green)' : 'var(--neon-red)', background: pwdMsg.includes('✓')? 'rgba(57,255,20,0.08)' : 'rgba(255,34,85,0.08)', border: `1px solid ${pwdMsg.includes('✓')? 'rgba(57,255,20,0.2)' : 'rgba(255,34,85,0.2)'}`, borderRadius: 8, padding: '0.45rem 0.6rem' }}>{pwdMsg}</div>}
              </GlassCard>

              {/* Passcode */}
              <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <GlassCardHeader title="Passcode (PIN)" subtitle="4–8 digit PIN, Argon2 hashed + app lock" icon={<Lock size={16} />} />
                <Toggle checked={settings.security.passcodeEnabled} onChange={v=>updateSettings('security', { passcodeEnabled: v } as any)} label="Enable passcode lock" />
                <Toggle checked={settings.security.requirePasscodeOnStart} onChange={v=>updateSettings('security', { requirePasscodeOnStart: v } as any)} label="Require PIN on app start" />
                <Toggle checked={settings.security.autoLockEnabled} onChange={v=>updateSettings('security', { autoLockEnabled: v } as any)} label="Auto-lock when idle" />
                {settings.security.autoLockEnabled && (
                  <Field label={`AUTO-LOCK DELAY — ${settings.security.autoLockDelay}s`}><input type="range" min={15} max={300} step={15} value={settings.security.autoLockDelay} onChange={e=>updateSettings('security', { autoLockDelay: Number(e.target.value) } as any)} style={{ width: '100%', accentColor: 'var(--theme-accent)' }} /></Field>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Field label="NEW PIN (digits)"><input className="pinc-input" type="password" inputMode="numeric" maxLength={8} value={passcode} onChange={e=>setPasscode(e.target.value.replace(/\D/g,''))} placeholder="••••" /></Field>
                  <Field label="CONFIRM PIN"><input className="pinc-input" type="password" inputMode="numeric" maxLength={8} value={passcode2} onChange={e=>setPasscode2(e.target.value.replace(/\D/g,''))} placeholder="••••" /></Field>
                </div>
                <Pill active onClick={handleSetPasscode}><Shield size={12} /> Set / update PIN</Pill>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>PIN is Argon2-hashed via backend <code>cmd_set_passcode</code> and stored in <code>auth_secrets</code>. Failed attempts throttle with exponential backoff.</div>
              </GlassCard>

              {/* Fingerprint / Biometric */}
              <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <GlassCardHeader title="Fingerprint / Biometric" subtitle="Uses OS biometric via Tauri plugin stub — falls back to PIN" icon={<Fingerprint size={16} />} />
                <Toggle checked={settings.security.fingerprintEnabled} onChange={handleFingerprint} label="Enable fingerprint unlock" />
                <Toggle checked={settings.security.biometricLogin} onChange={v=>updateSettings('security', { biometricLogin: v } as any)} label="Use biometric for login" />
                <Toggle checked={settings.security.loginAlerts} onChange={v=>updateSettings('security', { loginAlerts: v } as any)} label="Login alerts (email/push on new device)" />
                <Field label="SESSION TIMEOUT (minutes)"><input className="pinc-input" type="number" value={settings.security.sessionTimeout} onChange={e=>updateSettings('security', { sessionTimeout: Number(e.target.value) } as any)} /></Field>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Pill onClick={async()=>{ try{ const {invoke}=await import('@tauri-apps/api/core'); await invoke('cmd_biometric_auth'); setPwdMsg('Biometric test ✓'); setTimeout(()=>setPwdMsg(null),1500);} catch(e){ setPwdMsg(String(e)); } }}><Fingerprint size={12} /> Test biometric</Pill>
                  <Pill onClick={()=>useAppStore.getState().lockApp()} style={{ border: '1px solid var(--neon-yellow)', color: 'var(--neon-yellow)', background: 'transparent' }}><Lock size={12} /> Lock now</Pill>
                </div>
                <Toggle checked={settings.security.twoFactorEnabled} onChange={v=>updateSettings('security', { twoFactorEnabled: v } as any)} label="Two-factor authentication" />
                {settings.security.twoFactorEnabled && (
                  <Field label="2FA METHOD">
                    <select className="pinc-input" value={settings.security.twoFactorMethod} onChange={e=>updateSettings('security', { twoFactorMethod: e.target.value as any } as any)}>
                      <option value="authenticator">Authenticator app</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </select>
                  </Field>
                )}
              </GlassCard>
            </div>
          )}

          {active === 'privacy' && (
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <GlassCardHeader title="Privacy" subtitle="Control what others see and what data is collected" icon={<Eye size={16} />} />
              <Field label="PROFILE VISIBILITY">
                <select className="pinc-input" value={settings.privacy.profileVisibility} onChange={e=>updateSettings('privacy', { profileVisibility: e.target.value as any } as any)}>
                  <option value="public">Public</option>
                  <option value="contacts">Contacts only</option>
                  <option value="private">Private</option>
                </select>
              </Field>
              <Toggle checked={settings.privacy.showOnlineStatus} onChange={v=>updateSettings('privacy', { showOnlineStatus: v } as any)} label="Show online status" />
              <Toggle checked={settings.privacy.showWalletAddress} onChange={v=>updateSettings('privacy', { showWalletAddress: v } as any)} label="Show wallet address to contacts" />
              <Toggle checked={settings.privacy.hideBalances} onChange={v=>updateSettings('privacy', { hideBalances: v } as any)} label="Hide balances (incognito balances)" />
              <Toggle checked={settings.privacy.incognitoMode} onChange={v=>updateSettings('privacy', { incognitoMode: v } as any)} label="Incognito mode" />
              <Toggle checked={settings.privacy.allowDataCollection} onChange={v=>updateSettings('privacy', { allowDataCollection: v } as any)} label="Allow data collection" />
              <Toggle checked={settings.privacy.shareAnalytics} onChange={v=>updateSettings('privacy', { shareAnalytics: v } as any)} label="Share analytics" />
            </GlassCard>
          )}

          {active === 'notifications' && (
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <GlassCardHeader title="Notifications" subtitle="Email · Push · In-app" icon={<Bell size={16} />} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: '0.6rem' }}>
                <Toggle checked={settings.notifications.emailNotifications} onChange={v=>updateSettings('notifications', { emailNotifications: v } as any)} label="Email notifications" />
                <Toggle checked={settings.notifications.pushNotifications} onChange={v=>updateSettings('notifications', { pushNotifications: v } as any)} label="Push notifications" />
                <Toggle checked={settings.notifications.inAppNotifications} onChange={v=>updateSettings('notifications', { inAppNotifications: v } as any)} label="In-app notifications" />
                <Toggle checked={settings.notifications.transactionAlerts} onChange={v=>updateSettings('notifications', { transactionAlerts: v } as any)} label="Transaction alerts" />
                <Toggle checked={settings.notifications.securityAlerts} onChange={v=>updateSettings('notifications', { securityAlerts: v } as any)} label="Security alerts" />
                <Toggle checked={settings.notifications.marketingEmails} onChange={v=>updateSettings('notifications', { marketingEmails: v } as any)} label="Marketing emails" />
                <Toggle checked={settings.notifications.weeklyDigest} onChange={v=>updateSettings('notifications', { weeklyDigest: v } as any)} label="Weekly digest" />
                <Toggle checked={settings.notifications.soundEnabled} onChange={v=>updateSettings('notifications', { soundEnabled: v } as any)} label="Sound" />
                <Toggle checked={settings.notifications.vibrationEnabled} onChange={v=>updateSettings('notifications', { vibrationEnabled: v } as any)} label="Vibration" />
              </div>
            </GlassCard>
          )}

          {active === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <GlassCardHeader title="Theme" subtitle="5 beautiful themes — Silver Luxe · Onyx Gold · Dark Tech · Cyber Vibrant · Matrix" icon={<Palette size={16} />} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '0.6rem' }}>
                  {(Object.keys(THEME_META) as ThemeId[]).map(id => {
                    const meta = THEME_META[id];
                    const activeTheme = theme===id;
                    return (
                      <button key={id} onClick={()=>handleTheme(id)} style={{
                        borderRadius: 14, overflow: 'hidden', border: activeTheme? '2px solid var(--theme-accent)' : '1px solid var(--border)',
                        background: 'var(--bg-card)', cursor: 'pointer', textAlign: 'left', position: 'relative',
                        boxShadow: activeTheme? 'var(--theme-glow)' : 'none', transition: 'all 0.2s',
                      }}>
                        <div style={{ height: 72, background: meta.preview, borderBottom: '1px solid var(--border)' }} />
                        <div style={{ padding: '0.6rem 0.7rem' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {id==='dark-tech' && <Moon size={12} />}
                            {id==='cyber-wave' && <Globe size={12} />}
                            {id==='light-luxe' && <Sun size={12} />}
                            {id==='onyx-gold' && <Gem size={12} />}
                            {id==='matrix-green' && <Cpu size={12} />}
                            {meta.label}
                            {activeTheme && <Check size={12} style={{ color: 'var(--theme-accent)', marginLeft: 'auto' }} />}
                          </div>
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>{meta.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '0.6rem' }}>
                  <Field label="FONT SIZE">
                    <select className="pinc-input" value={settings.appearance.fontSize} onChange={e=>updateSettings('appearance', { fontSize: e.target.value as any } as any)}>
                      <option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
                    </select>
                  </Field>
                  <Field label="COMPACT MODE"><div style={{ paddingTop: '0.35rem' }}><Toggle checked={settings.appearance.compactMode} onChange={v=>updateSettings('appearance', { compactMode: v } as any)} label="Compact mode" /></div></Field>
                  <Field label="ANIMATIONS"><div style={{ paddingTop: '0.35rem' }}><Toggle checked={settings.appearance.animationsEnabled} onChange={v=>updateSettings('appearance', { animationsEnabled: v } as any)} label="Animations" /></div></Field>
                  <Field label="REDUCE MOTION"><div style={{ paddingTop: '0.35rem' }}><Toggle checked={settings.appearance.reduceMotion} onChange={v=>updateSettings('appearance', { reduceMotion: v } as any)} label="Reduce motion" /></div></Field>
                  <Field label="HIGH CONTRAST"><div style={{ paddingTop: '0.35rem' }}><Toggle checked={settings.appearance.highContrast} onChange={v=>updateSettings('appearance', { highContrast: v } as any)} label="High contrast" /></div></Field>
                </div>
              </GlassCard>

              <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <GlassCardHeader title="Language" subtitle="33 languages — changes apply instantly (RTL aware)" icon={<Languages size={16} />} />
                <LanguageSelector />
              </GlassCard>
            </div>
          )}

          {active === 'network' && (
            <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <GlassCardHeader title="Connection" subtitle="Proxy · DNS — standalone wallet connection basics" icon={<Wifi size={16} />} />
              <Field label="CONNECTION TIMEOUT (s)"><input className="pinc-input" type="number" value={settings.network.connectionTimeout} onChange={e=>updateSettings('network', { connectionTimeout: Number(e.target.value) } as any)} /></Field>
              <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={12} /> Proxy</div>
              <Toggle checked={settings.network.useProxy} onChange={v=>updateSettings('network', { useProxy: v } as any)} label="Use proxy" />
              {settings.network.useProxy && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', gap: '0.75rem' }}>
                  <Field label="PROXY ADDRESS"><input className="pinc-input" value={settings.network.proxyAddress} onChange={e=>updateSettings('network', { proxyAddress: e.target.value } as any)} placeholder="127.0.0.1" /></Field>
                  <Field label="PORT"><input className="pinc-input" value={settings.network.proxyPort} onChange={e=>updateSettings('network', { proxyPort: e.target.value } as any)} placeholder="1080" /></Field>
                  <Field label="TYPE">
                    <select className="pinc-input" value={settings.network.proxyType} onChange={e=>updateSettings('network', { proxyType: e.target.value as any } as any)}>
                      <option value="http">HTTP</option><option value="socks5">SOCKS5</option>
                    </select>
                  </Field>
                </div>
              )}
              <Toggle checked={settings.network.customDns} onChange={v=>updateSettings('network', { customDns: v } as any)} label="Custom DNS" />
              {settings.network.customDns && (
                <Field label="DNS SERVER"><input className="pinc-input" value={settings.network.dnsServer} onChange={e=>updateSettings('network', { dnsServer: e.target.value } as any)} placeholder="1.1.1.1" /></Field>
              )}
            </GlassCard>
          )}

          {active === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <GlassCardHeader title="Backup & Restore" subtitle="Encrypted vault backup — local file + optional cloud" icon={<HardDrive size={16} />} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '0.75rem' }}>
                  <Field label="AUTO BACKUP"><div style={{ paddingTop: '0.35rem' }}><Toggle checked={settings.backup.autoBackup} onChange={v=>updateSettings('backup', { autoBackup: v } as any)} label="Auto backup" /></div></Field>
                  <Field label="FREQUENCY">
                    <select className="pinc-input" value={settings.backup.backupFrequency} onChange={e=>updateSettings('backup', { backupFrequency: e.target.value as any } as any)}>
                      <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                    </select>
                  </Field>
                  <Field label="ENCRYPT BACKUPS"><div style={{ paddingTop: '0.35rem' }}><Toggle checked={settings.backup.encryptBackups} onChange={v=>updateSettings('backup', { encryptBackups: v } as any)} label="Encrypt" /></div></Field>
                  <Field label="INCLUDE VAULT"><div style={{ paddingTop: '0.35rem' }}><Toggle checked={settings.backup.includeVault} onChange={v=>updateSettings('backup', { includeVault: v } as any)} label="Include vault files" /></div></Field>
                </div>
                <Field label="BACKUP LOCATION"><input className="pinc-input" value={settings.backup.backupLocation} onChange={e=>updateSettings('backup', { backupLocation: e.target.value } as any)} placeholder="/path/to/backup or leave empty for default" /></Field>
                {settings.backup.lastBackupDate && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Last backup: {new Date(settings.backup.lastBackupDate).toLocaleString()}</div>}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Pill active onClick={async()=>{ try{ const {invoke}=await import('@tauri-apps/api/core'); const r:any = await invoke('cmd_create_backup'); updateSettings('backup', { lastBackupDate: new Date().toISOString() } as any); alert(`Backup created: ${r?.path ?? 'ok'}`);} catch(e){ alert(String(e)); } }}><Download size={12} /> Create backup</Pill>
                  <Pill onClick={async()=>{ try{ const {invoke}=await import('@tauri-apps/api/core'); await invoke('cmd_restore_backup'); alert('Restore completed — restart recommended'); } catch(e){ alert(String(e)); } }} style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}><Upload size={12} /> Restore</Pill>
                  <Pill onClick={async()=>{ if(!confirm('Export settings JSON?')) return; const blob=new Blob([JSON.stringify(settings,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='sarai-settings.json'; a.click(); URL.revokeObjectURL(url); }} style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}><Database size={12} /> Export JSON</Pill>
                </div>
              </GlassCard>

              <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderColor: 'rgba(255,34,85,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--neon-red)', fontWeight: 700, fontSize: '0.8rem' }}><AlertTriangle size={14} /> Danger zone</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Resetting clears local settings (vault and identity remain). This cannot be undone.</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Pill onClick={()=>{ if(confirm('Reset all settings to defaults?')) useAppStore.getState().resetAll(); }} style={{ border: '1px solid rgba(255,34,85,0.3)', color: 'var(--neon-red)', background: 'transparent' }}><Trash2 size={12} /> Reset settings</Pill>
                  <Pill onClick={async()=>{ if(!confirm('Delete identity and wallet data? This is irreversible.')) return; try{ const {invoke}=await import('@tauri-apps/api/core'); await invoke('cmd_delete_identity'); location.reload(); } catch(e){ alert(String(e)); } }} style={{ border: '1px solid rgba(255,34,85,0.5)', color: 'var(--neon-red)', background: 'rgba(255,34,85,0.08)' }}><Trash2 size={12} /> Delete identity</Pill>
                </div>
              </GlassCard>
            </div>
          )}

          {active === 'agent' && <AgentSection />}

        </motion.div>
      </AnimatePresence>

      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.25rem 0' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-green)', display: 'inline-block' }} /> Powered by <span style={{ color: 'var(--theme-accent)', fontWeight: 700 }}>PINC Platform</span> · SARAI v3.0 · All Transactions. Securely.
      </div>
    </div>
  );
}

const AGENT_LANGUAGES = [
  'english', 'swahili', 'french', 'spanish', 'portuguese', 'arabic', 'hausa', 'yoruba',
  'amharic', 'somali', 'lingala', 'kinyarwanda', 'hindi', 'urdu', 'bengali',
  'tagalog', 'indonesian', 'vietnamese', 'thai', 'chinese', 'russian',
];

const AGENT_NETWORKS = ['MPesa', 'Binance', 'PayPal', 'Sendwave', 'BankTransfer', 'Skrill', 'USDT'];
const COMMS_PLATFORMS = ['WhatsApp', 'Telegram', 'Signal'];

const MY_AGENT_KEY = 'sarai-agent-id';

function AgentSection() {
  // signup form
  const [name, setName] = useState('');
  const [countryIso2, setCountryIso2] = useState('KE');
  const [langs, setLangs] = useState<string[]>(['english']);
  const [commission, setCommission] = useState(2);
  const [network, setNetwork] = useState('MPesa');
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [minAmount, setMinAmount] = useState(1);
  const [maxAmount, setMaxAmount] = useState(1000);
  const [dailyLimit, setDailyLimit] = useState(5000);
  const [platform, setPlatform] = useState('WhatsApp');
  const [handle, setHandle] = useState('');
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // agent dashboard
  const [myAgentId, setMyAgentId] = useState<string>(() => {
    try { return localStorage.getItem(MY_AGENT_KEY) || ''; } catch { return ''; }
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [complainFor, setComplainFor] = useState('');
  const [complainReason, setComplainReason] = useState('');

  const loadMyOrders = async (agentId: string) => {
    if (!agentId) { setOrders([]); return; }
    setLoadingOrders(true);
    try {
      const all = await invoke<any[]>('cmd_p2p_deposit_list');
      setOrders((all || []).filter((o) => o.agent_id === agentId));
    } catch {
      setOrders([]);
    }
    setLoadingOrders(false);
  };

  useEffect(() => { loadMyOrders(myAgentId); }, [myAgentId]);

  const toggleLang = (l: string) =>
    setLangs((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : prev.length < 5 ? [...prev, l] : prev));

  const becomeAgent = async () => {
    setMsg(null);
    if (!name.trim()) { setMsg({ ok: false, text: 'Agent name is required' }); return; }
    if (langs.length === 0) { setMsg({ ok: false, text: 'Pick at least one language' }); return; }
    if (!accountIdentifier.trim()) { setMsg({ ok: false, text: 'Payout account identifier is required (clients will see it)' }); return; }
    if (!handle.trim()) { setMsg({ ok: false, text: 'Comm link handle is required' }); return; }
    if (maxAmount > 1000) { setMsg({ ok: false, text: 'Deposit max_amount cannot exceed $1000 (withdraw stays uncapped)' }); return; }
    setCreating(true);
    try {
      const agent = await invoke<any>('cmd_p2p_agent_create', {
        name: name.trim(),
        countryIso2,
        languages: langs,
        commissionRate: commission,
      });
      await invoke('cmd_p2p_agent_bind_channel', {
        agentId: agent.id,
        network,
        accountIdentifier: accountIdentifier.trim(),
        credentialsEncrypted: '',
        currency,
        minAmount,
        maxAmount,
        dailyLimit,
        feePercent: commission,
      });
      await invoke('cmd_p2p_agent_bind_commlink', {
        agentId: agent.id,
        platform,
        handle: handle.trim(),
        preferredForEscrow: true,
      });
      try { localStorage.setItem(MY_AGENT_KEY, agent.id); } catch {}
      setMyAgentId(agent.id);
      setMsg({ ok: true, text: `You are now a P2P agent (${agent.id}). Clients in ${countryIso2} can find you once online.` });
    } catch (e) {
      setMsg({ ok: false, text: String(e) });
    }
    setCreating(false);
  };

  const releaseOrder = async (orderId: string) => {
    try {
      await invoke('cmd_p2p_agent_release_escrow', { orderId });
      await loadMyOrders(myAgentId);
      setMsg({ ok: true, text: `Escrow released for order ${orderId}` });
    } catch (e) {
      setMsg({ ok: false, text: String(e) });
    }
  };

  const complainOrder = async (orderId: string) => {
    if (!complainReason.trim()) return;
    try {
      await invoke('cmd_p2p_agent_complain', {
        orderId,
        disputeReason: complainReason.trim(),
        evidenceHash: btoa(complainReason.trim()).slice(0, 32),
      });
      setComplainFor('');
      setComplainReason('');
      await loadMyOrders(myAgentId);
    } catch (e) {
      setMsg({ ok: false, text: String(e) });
    }
  };

  const fmt = (n: number | null | undefined) =>
    (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      {/* Become a P2P Agent */}
      <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <GlassCardHeader
          title="Become a P2P Agent"
          subtitle="Earn commission helping people deposit & withdraw via mobile money or bank — your payout account is visible to clients"
          icon={<Users size={16} />}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '0.75rem' }}>
          <Field label="AGENT NAME">
            <input className="pinc-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nairobi QuickCash" />
          </Field>
          <Field label="COUNTRY">
            <select className="pinc-input" value={countryIso2} onChange={(e) => setCountryIso2(e.target.value)}>
              {P2P_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={`COMMISSION RATE — ${commission.toFixed(1)}%`} hint="Allowed range 0–10%">
            <input type="range" min={0} max={10} step={0.5} value={commission} onChange={(e) => setCommission(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--theme-accent)' }} />
          </Field>
        </div>

        <Field label="LANGUAGES (up to 5)" hint="Clients filter agents by language">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {AGENT_LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => toggleLang(l)}
                style={{
                  padding: '0.25rem 0.55rem', borderRadius: 999, fontSize: '0.62rem', cursor: 'pointer',
                  border: langs.includes(l) ? '1px solid var(--theme-accent)' : '1px solid var(--border)',
                  background: langs.includes(l) ? 'var(--theme-accent)' : 'transparent',
                  color: langs.includes(l) ? '#0a0a0f' : 'var(--text-secondary)', fontWeight: 700, textTransform: 'capitalize',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </Field>

        <div style={{ height: 1, background: 'var(--border)' }} />
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>Payment channel (visible to clients)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '0.75rem' }}>
          <Field label="NETWORK">
            <select className="pinc-input" value={network} onChange={(e) => setNetwork(e.target.value)}>
              {AGENT_NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="ACCOUNT IDENTIFIER" hint="Mobile money / bank account clients pay to">
            <input className="pinc-input" value={accountIdentifier} onChange={(e) => setAccountIdentifier(e.target.value)} placeholder="+2547XX XXX XXX / IBAN" />
          </Field>
          <Field label="CURRENCY">
            <input className="pinc-input" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} placeholder="USD / KES / NGN" />
          </Field>
          <Field label="MIN AMOUNT ($)">
            <input className="pinc-input" type="number" min={0} value={minAmount} onChange={(e) => setMinAmount(Number(e.target.value))} />
          </Field>
          <Field label="MAX AMOUNT ($)" hint="Deposit cap is $1000 · withdraw uncapped">
            <input className="pinc-input" type="number" min={1} max={1000} value={maxAmount} onChange={(e) => setMaxAmount(Number(e.target.value))} />
          </Field>
          <Field label="DAILY LIMIT ($)">
            <input className="pinc-input" type="number" min={0} value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} />
          </Field>
        </div>

        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>Comm link (escrow coordination)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '0.75rem' }}>
          <Field label="PLATFORM">
            <select className="pinc-input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {COMMS_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="HANDLE" hint="WhatsApp / Telegram number or @username">
            <input className="pinc-input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="+2547XX XXX XXX / @agent" />
          </Field>
        </div>

        {msg && (
          <div style={{
            fontSize: '0.7rem', padding: '0.5rem 0.7rem', borderRadius: 8,
            color: msg.ok ? 'var(--neon-green)' : 'var(--neon-red)',
            background: msg.ok ? 'rgba(57,255,20,0.08)' : 'rgba(255,34,85,0.08)',
            border: `1px solid ${msg.ok ? 'rgba(57,255,20,0.22)' : 'rgba(255,34,85,0.22)'}`,
          }}>{msg.text}</div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Pill active onClick={becomeAgent} style={{ opacity: creating ? 0.6 : 1 }}>
            <Users size={12} /> {creating ? 'Creating…' : 'Create agent account'}
          </Pill>
          {myAgentId && (
            <Pill onClick={() => loadMyOrders(myAgentId)} style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <RotateCcw size={12} /> Refresh my orders
            </Pill>
          )}
        </div>
      </GlassCard>

      {/* Agent dashboard */}
      {myAgentId && (
        <GlassCard style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <GlassCardHeader title="My Agent Orders" subtitle={`Agent ${myAgentId} — confirm receipts, release escrow or complain`} icon={<Shield size={16} />} />
          {loadingOrders && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Loading orders…</div>}
          {!loadingOrders && orders.length === 0 && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.75rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 10 }}>
              No orders yet for this agent. Orders you receive from clients appear here.
            </div>
          )}
          {orders.map((o) => {
            const badge = statusBadgeMap[o.status] || statusBadgeMap.pending;
            const expired = !o.expires_at || Date.now() / 1000 > Number(o.expires_at);
            const canRelease = o.status === 'PaymentConfirmed';
            const canComplain = expired && (o.status === 'EscrowHeld' || o.status === 'PendingPayment');
            return (
              <div key={o.id} style={{ padding: '0.7rem 0.85rem', borderRadius: 10, background: 'var(--bg-secondary)', border: `1px solid ${badge.border}`, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--electric-blue)' }}>{o.id}</span>
                  <span style={{ padding: '0.12rem 0.5rem', borderRadius: 3, fontSize: '0.66rem', fontWeight: 700, background: badge.bg, color: badge.fg, border: `1px solid ${badge.border}` }}>
                    {String(o.status).replace(/([a-z])([A-Z])/g, '$1 $2')}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  <span>${fmt(o.total_amount)} {String(o.currency || '').toUpperCase()}</span>
                  <span>buyer {String(o.buyer_node_id || '').slice(0, 12)}…</span>
                  <span>{o.created_at ? new Date(o.created_at * 1000).toLocaleString() : ''}</span>
                  {expired && <span style={{ color: 'var(--neon-red)' }}>expired</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {canRelease && (
                    <button className="pinc-btn pinc-btn-primary" onClick={() => releaseOrder(o.id)} style={{ fontSize: '0.65rem', padding: '0.35rem 0.7rem' }}>
                      <Check size={11} /> Release escrow
                    </button>
                  )}
                  {canComplain && complainFor !== o.id && (
                    <button
                      className="pinc-btn"
                      onClick={() => setComplainFor(o.id)}
                      style={{ fontSize: '0.65rem', padding: '0.35rem 0.7rem', color: 'var(--neon-red)', borderColor: 'var(--neon-red)' }}
                    >
                      <AlertTriangle size={11} /> Complain
                    </button>
                  )}
                </div>
                {complainFor === o.id && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                    <input
                      className="pinc-input"
                      value={complainReason}
                      onChange={(e) => setComplainReason(e.target.value)}
                      placeholder="Dispute reason + evidence reference…"
                      style={{ flex: 1, fontSize: '0.68rem' }}
                    />
                    <button className="pinc-btn pinc-btn-primary" disabled={!complainReason.trim()} onClick={() => complainOrder(o.id)} style={{ fontSize: '0.65rem', padding: '0.35rem 0.7rem' }}>
                      Submit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </GlassCard>
      )}
    </div>
  );
}
