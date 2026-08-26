import { useMemo, useState } from 'react';
import { Fingerprint, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useI18n } from '../../i18n';

const MIN_AGE = 18;

function ageFromDob(dob: string): number {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return -1;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = [
    { label: 'Very weak', color: 'var(--neon-red)' },
    { label: 'Weak', color: 'var(--neon-red)' },
    { label: 'Fair', color: 'var(--neon-yellow)' },
    { label: 'Good', color: 'var(--electric-blue)' },
    { label: 'Strong', color: 'var(--neon-green)' },
    { label: 'Excellent', color: 'var(--neon-green)' },
  ];
  return { score, ...labels[score] };
}

/**
 * Account setup — mandatory gate before the wallet can be used.
 * Collects first + last name, date of birth (18+), master password (min 8,
 * strength meter), confirm password, 6-digit PIN + confirm, and optional
 * fingerprint enrolment. Creates the identity (password = master key),
 * stores the PIN hash and persists name/DOB in app_settings.
 */
export default function AccountSetupScreen() {
  const { t } = useI18n();
  const { createAccount, enableBiometric } = useAppStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [fingerprint, setFingerprint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const age = useMemo(() => ageFromDob(dateOfBirth), [dateOfBirth]);
  const strength = useMemo(() => passwordStrength(masterKey), [masterKey]);

  const nameOk = firstName.trim().length >= 2 && lastName.trim().length >= 2;
  const dobOk = /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) && age >= MIN_AGE;
  const pwdOk = masterKey.length >= 8 && masterKey === confirmKey;
  const pinOk = /^\d{6}$/.test(pin) && pin === confirmPin;
  const canSubmit = nameOk && dobOk && pwdOk && pinOk && !busy;

  const submit = async () => {
    if (!canSubmit) {
      if (!dobOk && dateOfBirth) setError(`Minimum age is ${MIN_AGE} years`);
      else if (!pwdOk && confirmKey) setError('Passwords do not match');
      else if (!pinOk && confirmPin) setError('PINs do not match (6 digits required)');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createAccount({
        masterKey,
        username: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth,
        passcode: pin,
      });
      if (fingerprint) {
        try { await enableBiometric(); } catch {}
      }
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/assets/images/sarai-logo.png" alt="SARAI" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', boxShadow: 'var(--theme-glow)' }} onError={e => (e.currentTarget.style.display = 'none')} />
        <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 800, color: 'var(--theme-accent)', letterSpacing: '0.14em', marginTop: '0.5rem' }}>CREATE YOUR SARAI ID</div>
        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.5 }}>
          Two names + date of birth make your ID unique. Password and PIN secure it.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', padding: '1rem', borderRadius: 16, background: 'var(--bg-card)', backdropFilter: 'blur(14px)', border: '1px solid var(--border)', boxShadow: '0 10px 36px rgba(0,0,0,0.18)' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>FIRST NAME *</span>
          <input className="pinc-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ada" autoComplete="given-name" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>LAST NAME *</span>
          <input className="pinc-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Lovelace" autoComplete="family-name" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>DATE OF BIRTH * ({MIN_AGE}+)</span>
          <input className="pinc-input" type="date" value={dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={e => setDateOfBirth(e.target.value)} autoComplete="bday" />
          {dateOfBirth && !dobOk && (
            <span style={{ fontSize: '0.62rem', color: 'var(--neon-red)' }}>You must be at least {MIN_AGE} years old.</span>
          )}
        </label>

        <div style={{ height: 1, background: 'var(--border)' }} />

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>{t('app.password').toUpperCase()} * (MIN 8 CHARS)</span>
          <input className="pinc-input" type="password" value={masterKey} onChange={e => setMasterKey(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
        </label>
        {masterKey.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', gap: 2 }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{
                  flex: 1, borderRadius: 999,
                  background: i < strength.score ? strength.color : 'var(--border)',
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: strength.color, minWidth: 64, textAlign: 'right' }}>{strength.label}</span>
          </div>
        )}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>CONFIRM PASSWORD *</span>
          <input className="pinc-input" type="password" value={confirmKey} onChange={e => setConfirmKey(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          {confirmKey && masterKey !== confirmKey && (
            <span style={{ fontSize: '0.62rem', color: 'var(--neon-red)' }}>Passwords do not match</span>
          )}
        </label>

        <div style={{ height: 1, background: 'var(--border)' }} />

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>{t('app.passcode').toUpperCase()} * (6 DIGITS)</span>
          <input
            className="pinc-input"
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            autoComplete="new-password"
            style={{ fontFamily: 'monospace', letterSpacing: '0.4em', textAlign: 'center' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700 }}>CONFIRM {t('app.passcode').toUpperCase()} *</span>
          <input
            className="pinc-input"
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            autoComplete="new-password"
            style={{ fontFamily: 'monospace', letterSpacing: '0.4em', textAlign: 'center' }}
          />
          {confirmPin && pin !== confirmPin && (
            <span style={{ fontSize: '0.62rem', color: 'var(--neon-red)' }}>PINs do not match</span>
          )}
        </label>

        <button
          onClick={() => setFingerprint(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
            padding: '0.6rem 0.75rem', borderRadius: 10, background: 'var(--bg-secondary)',
            border: `1px solid ${fingerprint ? 'var(--theme-accent)' : 'var(--border)'}`,
            cursor: 'pointer', color: 'var(--text-primary)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', fontWeight: 500 }}>
            <Fingerprint size={16} color={fingerprint ? 'var(--theme-accent)' : 'var(--text-muted)'} />
            Enable {t('app.fingerprint')} unlock
          </span>
          <span style={{
            width: 38, height: 22, borderRadius: 999, background: fingerprint ? 'var(--theme-accent)' : 'var(--border-bright)',
            position: 'relative', transition: 'all 0.2s', boxShadow: fingerprint ? 'var(--theme-glow)' : 'none',
          }}>
            <span style={{ position: 'absolute', top: 2, left: fingerprint ? 18 : 2, width: 18, height: 18, borderRadius: 999, background: '#fff', transition: 'all 0.2s' }} />
          </span>
        </button>

        {error && (
          <div style={{ fontSize: '0.68rem', color: 'var(--neon-red)', background: 'rgba(255,34,85,0.08)', border: '1px solid rgba(255,34,85,0.2)', borderRadius: 8, padding: '0.45rem 0.6rem' }}>{error}</div>
        )}

        <button
          onClick={submit}
          disabled={!nameOk || !dobOk || !pwdOk || !pinOk || busy}
          className="pinc-btn pinc-btn-primary"
          style={{
            width: '100%', marginTop: '0.25rem', borderRadius: 999, padding: '0.7rem', fontWeight: 800, letterSpacing: '0.06em',
            boxShadow: canSubmit ? 'var(--theme-glow)' : 'none',
            opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          <ShieldCheck size={15} style={{ verticalAlign: '-3px', marginRight: 6 }} />
          {busy ? 'Creating secure identity…' : 'Create my SARAI ID'}
        </button>
        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Your ID is permanent. Recovery via seed phrase restores the SAME ID.
        </div>
      </div>
    </div>
  );
}
