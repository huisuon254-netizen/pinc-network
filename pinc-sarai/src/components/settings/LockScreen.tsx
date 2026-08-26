import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Fingerprint, Delete, ShieldAlert, KeyRound } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useI18n } from '../../i18n';
import GlassCard from '../ui/GlassCard';

const PIN_LENGTH = 6;

export default function LockScreen() {
  const { unlockApp, unlockWithPassword, enableBiometric, failedAttempts, settings } = useAppStore();
  const { t } = useI18n();
  const [mode, setMode] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setBiometricAvailable(settings.security.fingerprintEnabled || settings.security.biometricLogin);
  }, [settings.security.fingerprintEnabled, settings.security.biometricLogin]);

  useEffect(() => {
    if (failedAttempts >= 5) {
      const delay = Math.min(30, Math.pow(2, failedAttempts - 5) * 5);
      setCooldown(delay);
      const iv = setInterval(() => setCooldown(c => (c <= 1 ? 0 : c - 1)), 1000);
      return () => clearInterval(iv);
    }
  }, [failedAttempts]);

  const handleDigit = (d: string) => {
    if (cooldown > 0 || busy) return;
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPin(next);
    setError(null);
    if (next.length === PIN_LENGTH) {
      void submit(next);
    }
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  const submit = async (value: string) => {
    setBusy(true);
    const ok = await unlockApp(value);
    setBusy(false);
    if (ok) {
      setPin('');
      setError(null);
    } else {
      setError(failedAttempts + 1 >= 5 ? `${t('app.passcode')} — ${t('common.retry')}` : `Incorrect PIN — try again`);
      setPin('');
    }
  };

  const submitPassword = async () => {
    if (!password || cooldown > 0 || busy) return;
    setBusy(true);
    const ok = await unlockWithPassword(password);
    setBusy(false);
    if (ok) {
      setPassword('');
      setError(null);
    } else {
      setError('Incorrect password — try again');
      setPassword('');
    }
  };

  const handleBiometric = async () => {
    if (cooldown > 0) return;
    setBusy(true);
    try {
      const ok = await enableBiometric();
      if (ok) {
        useAppStore.getState().setLocked(false);
        useAppStore.getState().resetFailed();
      } else {
        setError('Biometric authentication failed');
      }
    } catch (e) {
      setError(String(e));
    }
    setBusy(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', position: 'relative' }}>
      <GlassCard style={{ width: '100%', maxWidth: 360, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--theme-accent-soft)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-accent)' }}>
          <Lock size={22} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.06em' }}>SARAI · {t('app.lock')}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {mode === 'pin' ? `${t('app.passcode')} (${PIN_LENGTH})` : t('app.password')}
          </div>
        </div>

        {/* mode toggle */}
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 999, border: '1px solid var(--border)' }}>
          <button
            onClick={() => { setMode('pin'); setError(null); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
              padding: '0.35rem 0.8rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
              background: mode === 'pin' ? 'var(--theme-accent)' : 'transparent',
              color: mode === 'pin' ? '#0a0a0f' : 'var(--text-muted)',
            }}
          >
            <Lock size={12} /> {t('app.passcode')}
          </button>
          <button
            onClick={() => { setMode('password'); setError(null); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
              padding: '0.35rem 0.8rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
              background: mode === 'password' ? 'var(--theme-accent)' : 'transparent',
              color: mode === 'password' ? '#0a0a0f' : 'var(--text-muted)',
            }}
          >
            <KeyRound size={12} /> {t('app.password')}
          </button>
        </div>

        {mode === 'pin' ? (
          <>
            {/* dots */}
            <div style={{ display: 'flex', gap: '0.6rem', margin: '0.25rem 0' }}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div key={i} style={{
                  width: 14, height: 14, borderRadius: 999,
                  background: i < pin.length ? 'var(--theme-accent)' : 'var(--bg-secondary)',
                  border: `1px solid ${i < pin.length ? 'var(--theme-accent)' : 'var(--border)'}`,
                  boxShadow: i < pin.length ? 'var(--theme-glow)' : 'none',
                  transition: 'all 0.18s',
                }} />
              ))}
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); void submitPassword(); }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: '0.25rem 0' }}
          >
            <input
              className="pinc-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('app.password')}
              autoComplete="current-password"
              disabled={cooldown > 0 || busy}
              autoFocus
              style={{ width: '100%', textAlign: 'center' }}
            />
            <button
              type="submit"
              className="pinc-btn pinc-btn-primary"
              disabled={!password || cooldown > 0 || busy}
              style={{ width: '100%', borderRadius: 999, padding: '0.55rem', fontWeight: 800, opacity: password && cooldown === 0 ? 1 : 0.5 }}
            >
              {t('app.unlock')}
            </button>
          </form>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: 'var(--neon-red)', background: 'rgba(255,34,85,0.08)', border: '1px solid rgba(255,34,85,0.22)', borderRadius: 8, padding: '0.4rem 0.6rem' }}>
            <ShieldAlert size={12} /> {error}
          </motion.div>
        )}
        {cooldown > 0 && (
          <div style={{ fontSize: '0.68rem', color: 'var(--neon-yellow)' }}>Too many attempts — wait {cooldown}s</div>
        )}
        {failedAttempts > 0 && failedAttempts < 5 && (
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{failedAttempts} failed attempt{failedAttempts > 1 ? 's' : ''}</div>
        )}

        {mode === 'pin' && (
          <>
            {/* PIN pad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.55rem', width: '100%', maxWidth: 260, marginTop: '0.25rem' }}>
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <button key={d} onClick={()=>handleDigit(d)} disabled={cooldown>0 || busy} style={{
                  height: 56, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  fontSize: '1.15rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  opacity: cooldown>0?0.5:1,
                }}>{d}</button>
              ))}
              <button onClick={handleBiometric} disabled={!biometricAvailable || cooldown>0 || busy} title={t('app.fingerprint')} style={{
                height: 56, borderRadius: 14, border: '1px solid var(--border)', background: biometricAvailable? 'var(--theme-accent-soft)' : 'var(--bg-secondary)',
                color: biometricAvailable? 'var(--theme-accent)' : 'var(--text-muted)', cursor: biometricAvailable ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: biometricAvailable?1:0.45,
              }}>
                <Fingerprint size={18} />
              </button>
              <button onClick={()=>handleDigit('0')} disabled={cooldown>0 || busy} style={{
                height: 56, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                fontSize: '1.15rem', fontWeight: 700, cursor: 'pointer', opacity: cooldown>0?0.5:1,
              }}>0</button>
              <button onClick={handleDelete} disabled={!pin.length || busy} style={{
                height: 56, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !pin.length?0.45:1,
              }}>
                <Delete size={16} />
              </button>
            </div>
          </>
        )}

        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
          Forgot PIN? Reset requires recovery phrase in Settings → Security.
        </div>
      </GlassCard>
    </div>
  );
}
