import { useState } from 'react';
import { useAdminStore } from '../store/adminStore';
import { Shield, Lock, User, AlertTriangle } from 'lucide-react';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAdminStore(s => s.login);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) { setError('Enter credentials'); return; }
    setLoading(true); setError('');
    const ok = await login(username.trim(), password);
    if (!ok) setError('Invalid credentials or not an admin');
    setLoading(false);
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0f172a 100%)',
    }}>
      <div style={{
        width: 380, background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '2.5rem 2rem', textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
          border: '2px solid var(--accent-red)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 1rem',
        }}>
          <Shield size={28} color="var(--accent-red)" />
        </div>

        <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.1em' }}>
          PINC ADMIN
        </h1>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.15em' }}>
          RESTRICTED ACCESS
        </p>

        {error && (
          <div style={{
            marginTop: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6,
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.7rem', color: 'var(--accent-red)',
          }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>USERNAME</label>
          <div style={{ position: 'relative' }}>
            <User size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
            <input value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="admin" style={{
                width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem',
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.8rem',
              }} />
          </div>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'left' }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>PASSWORD</label>
          <div style={{ position: 'relative' }}>
            <Lock size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="password" style={{
                width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem',
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--text-primary)', fontSize: '0.8rem',
              }} />
          </div>
        </div>

        <button onClick={handleLogin} disabled={loading} style={{
          width: '100%', marginTop: '1.25rem', padding: '0.65rem',
          background: loading ? 'var(--bg-tertiary)' : 'var(--accent-red)',
          border: 'none', borderRadius: 6, color: '#fff', fontSize: '0.8rem',
          fontWeight: 700, cursor: loading ? 'default' : 'pointer',
          letterSpacing: '0.08em',
        }}>
          {loading ? 'AUTHENTICATING...' : 'ACCESS ADMIN'}
        </button>

        <div style={{ marginTop: '1.5rem', padding: '0.5rem', background: 'rgba(245,158,11,0.08)', borderRadius: 6 }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Lock size={10} /> All access is logged and monitored
          </div>
        </div>
      </div>
    </div>
  );
}
