import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, RefreshCw, Eye, EyeOff, ArrowRight, Globe } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import LanguageSelector from '../language/LanguageSelector';
import RoleSelector from '../roles/RoleSelector';

type Mode = 'menu' | 'create' | 'recover' | 'setup';

export default function LoginScreen() {
  const { createIdentity, recoverIdentity, loading, error, setError } = useAppStore();
  const [mode, setMode] = useState<Mode>('menu');
  const [masterKey, setMasterKey] = useState('');
  const [phrase, setPhrase] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [setupStep, setSetupStep] = useState<'language' | 'role'>('language');

  const hexKey = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleCreate = async () => {
    setError(null);
    const key = masterKey.trim() || hexKey();
    await createIdentity(key);
    setMode('setup');
  };

  const handleRecover = async () => {
    setError(null);
    if (!phrase.trim()) { setError('Recovery phrase required'); return; }
    const key = masterKey.trim() || hexKey();
    await recoverIdentity(phrase.trim(), key);
    setMode('setup');
  };

  const handleSetupComplete = () => {
    useAppStore.getState().setScreen('dashboard');
  };

  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding:'1rem' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ width:'100%', maxWidth:'520px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ fontSize:'2rem', fontWeight:900, color:'var(--electric-blue)', letterSpacing:'0.2em' }} className="glow-blue">PINC</div>
          <div style={{ fontSize:'0.65rem', letterSpacing:'0.4em', color:'var(--text-muted)', marginTop:'0.25rem' }}>PRIVATE INTELLIGENT NETWORK CORE</div>
          <div style={{ marginTop:'0.75rem', height:'1px', background:'linear-gradient(90deg, transparent, var(--electric-blue), transparent)' }} />
        </div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ background:'rgba(255,34,85,0.1)', border:'1px solid rgba(255,34,85,0.4)', borderRadius:'4px', padding:'0.75rem 1rem', marginBottom:'1.5rem', color:'var(--neon-red)', fontSize:'0.8rem', fontFamily:'monospace' }}>
            ⚠ {error}
          </motion.div>
        )}

        {/* MENU */}
        {mode === 'menu' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <button className="pinc-btn pinc-btn-primary" onClick={() => setMode('create')} style={{ padding:'1rem', fontSize:'1rem' }}>
              <Shield size={18} /> CREATE NEW IDENTITY
            </button>
            <button className="pinc-btn" onClick={() => setMode('recover')} style={{ padding:'0.875rem' }}>
              <RefreshCw size={16} /> RECOVER IDENTITY
            </button>
            <div style={{ textAlign:'center', marginTop:'1rem', color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:'0.1em' }}>
              YOUR KEYS · YOUR NODE · YOUR NETWORK
            </div>
          </motion.div>
        )}

        {/* CREATE */}
        {mode === 'create' && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ color:'var(--text-secondary)', fontSize:'0.8rem', lineHeight:1.6 }}>
              A new Ed25519 identity and BIP39 recovery phrase will be generated for this device.
            </div>
            <div>
              <label style={{ display:'block', color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>
                MASTER KEY (32-byte hex) — leave blank to auto-generate
              </label>
              <div style={{ position:'relative' }}>
                <input className="pinc-input" type={showKey ? 'text' : 'password'}
                  value={masterKey} onChange={e => setMasterKey(e.target.value)}
                  placeholder="auto-generate secure key" style={{ paddingRight:'3rem' }} />
                <button onClick={() => setShowKey(!showKey)}
                  style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button className="pinc-btn" onClick={() => setMasterKey(hexKey())} style={{ alignSelf:'flex-start', fontSize:'0.75rem' }}>
              <Key size={13} /> GENERATE KEY
            </button>
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
              <button className="pinc-btn" onClick={() => { setMode('menu'); setError(null); }} style={{ flex:1 }}>← BACK</button>
              <button className="pinc-btn pinc-btn-primary" onClick={handleCreate} disabled={loading} style={{ flex:2 }}>
                {loading ? 'CREATING...' : 'CREATE IDENTITY'}
              </button>
            </div>
          </motion.div>
        )}

        {/* RECOVER */}
        {mode === 'recover' && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={{ display:'block', color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>24-WORD RECOVERY PHRASE</label>
              <textarea className="pinc-input" value={phrase} onChange={e => setPhrase(e.target.value)}
                placeholder="word1 word2 word3 ... word24" rows={4}
                style={{ resize:'vertical', lineHeight:1.7 }} />
            </div>
            <div>
              <label style={{ display:'block', color:'var(--text-muted)', fontSize:'0.7rem', letterSpacing:'0.1em', marginBottom:'0.5rem' }}>MASTER KEY (hex)</label>
              <input className="pinc-input" type={showKey ? 'text' : 'password'}
                value={masterKey} onChange={e => setMasterKey(e.target.value)} placeholder="enter your master key" />
            </div>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button className="pinc-btn" onClick={() => { setMode('menu'); setError(null); }} style={{ flex:1 }}>← BACK</button>
              <button className="pinc-btn pinc-btn-primary" onClick={handleRecover} disabled={loading} style={{ flex:2 }}>
                {loading ? 'RECOVERING...' : 'RECOVER IDENTITY'}
              </button>
            </div>
          </motion.div>
        )}

        {/* SETUP WIZARD */}
        {mode === 'setup' && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {/* Step indicator */}
            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.5rem' }}>
              <div style={{ flex:1, height:'3px', borderRadius:'2px', background: 'var(--electric-blue)' }} />
              <div style={{ flex:1, height:'3px', borderRadius:'2px', background: setupStep === 'role' ? 'var(--electric-blue)' : 'var(--border)' }} />
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem' }}>
              <Globe size={14} style={{ color: 'var(--electric-blue)' }} />
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
                {setupStep === 'language' ? 'Step 1: Choose your language' : 'Step 2: Select your role'}
              </span>
            </div>

            {setupStep === 'language' ? (
              <LanguageSelector compact onSelect={() => setSetupStep('role')} />
            ) : (
              <RoleSelector compact onSelect={handleSetupComplete} />
            )}

            <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
              {setupStep === 'role' && (
                <button className="pinc-btn" onClick={() => setSetupStep('language')} style={{ flex:1 }}>
                  ← BACK
                </button>
              )}
              <button className="pinc-btn pinc-btn-primary" onClick={handleSetupComplete} style={{ flex: setupStep === 'language' ? 2 : 1 }}>
                {setupStep === 'language' ? <><ArrowRight size={14} /> NEXT</> : 'ENTER PINC'}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
