import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, RefreshCw, Eye, EyeOff, ArrowRight, Globe, Copy, Check } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import LanguageSelector from '../language/LanguageSelector';
import RoleSelector from '../roles/RoleSelector';

type Mode = 'login' | 'signup' | 'recover';

export default function LoginScreen()}</motion.div>

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
        )} {
  const { screen, activeTab, identity, hasIdentity, loading, error, setError, setScreen, setActiveTab, createIdentity, recoverIdentity } = useAppStore()}</motion.div>

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
        )};
  const [mode, setMode] = useState<Mode>('login')}</motion.div>

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
        )};
  const [masterKey, setMasterKey] = useState('')}</motion.div>

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
        )};
  const [phrase, setPhrase] = useState('')}</motion.div>

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
        )};
  const [showKey, setShowKey] = useState(false)}</motion.div>

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
        )};
  const [setupStep, setSetupStep] = useState<'language' | 'role'>('language')}</motion.div>

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
        )};
  const [createdPhrase, setCreatedPhrase] = useState('')}</motion.div>

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
        )};

  const hexKey = ()}</motion.div>

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
        )} => {
    const bytes = new Uint8Array(32)}</motion.div>

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
        )};
    crypto.getRandomValues(bytes)}</motion.div>

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
        )};
    return Array.from(bytes)}</motion.div>

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
        )}.map(b => b.toString(16)}</motion.div>

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
        )}.padStart(2, '0')}</motion.div>

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
        )})}</motion.div>

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
        )}.join('')}</motion.div>

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
        )};
  };

  const handleCreate = async ()}</motion.div>

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
        )} => {
    setError(null)}</motion.div>

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
        )};
    const key = masterKey.trim()}</motion.div>

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
        )} || hexKey()}</motion.div>

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
        )};
    try {
      const result = await createIdentity(key)}</motion.div>

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
        )};
      if (result?.recoveryPhrase)}</motion.div>

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
        )} {
        setCreatedPhrase(result.recoveryPhrase)}</motion.div>

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
        )};
        setMode('signup')}</motion.div>

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
        )};
      } else {
        setError('Failed to create identity')}</motion.div>

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
        )};
      }
    } catch (err)}</motion.div>

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
        )} {
      setError(`Creation failed: ${err}`)}</motion.div>

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
        )};
    }
  };

  const handleRecover = async ()}</motion.div>

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
        )} => {
    setError(null)}</motion.div>

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
        )};
    if (!phrase.trim()}</motion.div>

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
        )})}</motion.div>

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
        )} { setError('Recovery phrase required')}</motion.div>

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
        )}; return; }
    const key = masterKey.trim()}</motion.div>

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
        )} || hexKey()}</motion.div>

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
        )};
    await recoverIdentity(phrase.trim()}</motion.div>

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
        )}, key)}</motion.div>

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
        )};
    setMode('login')}</motion.div>

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
        )};
  };

  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)}</motion.div>

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
        )}', padding:'1rem' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ width:'100%', maxWidth:'520px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ fontSize:'2rem', fontWeight:900, color:'var(--electric-blue)}</motion.div>

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
        )}', letterSpacing:'0.2em' }} className="glow-blue">PINC</div>
          <div style={{ fontSize:'0.65rem', letterSpacing:'0.4em', color:'var(--text-muted)}</motion.div>

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
        )}', marginTop:'0.25rem' }}>PRIVATE INTELLIGENT NETWORK CORE</div>
          <div style={{ marginTop:'0.75rem', height:'1px', background:'linear-gradient(90deg, transparent, var(--electric-blue)}</motion.div>

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
        )}, transparent)}</motion.div>

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
        )}' }} />
        </div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ background:'rgba(255,34,85,0.1)}</motion.div>

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
        )}', border:'1px solid rgba(255,34,85,0.4)}</motion.div>

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
        )}', borderRadius:'4px', padding:'0.75rem 1rem', marginBottom:'1.5rem', color:'var(--neon-red)}</motion.div>

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
        )}', fontSize:'0.8rem', fontFamily:'monospace' }}>
            ⚠ {error}
          </motion.div>
        )}</motion.div>

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
        )}}

        {/* MENU */}
{mode === 'login' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ textAlign:'center', marginBottom:'1rem' }}>
              <div style={{ fontSize:'1.5rem', color:'var(--text-secondary)', marginBottom:'0.5rem' }}>
                Create a new identity or recover an existing one
              </div>
            </div>
            <button className="pinc-btn pinc-btn-primary" onClick={() => setMode('signup')} style={{ padding:'1rem', fontSize:'1rem' }}>
              <Shield size={18} /> CREATE NEW IDENTITY
            </button>
            <button className="pinc-btn" onClick={() => setMode('recover')} style={{ padding:'0.875rem' }}>
              <RefreshCw size={16} /> RECOVER IDENTITY
            </button>
          </motion.div>
        )}

        {/* SIGNUP */}
        {mode === 'signup' && (
          <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ background:'rgba(34,139,34,0.1)', border:'1px solid rgba(34,139,34,0.4)', borderRadius:'4px', padding:'0.75rem', marginBottom:'0.5rem' }}>
              <div style={{ color:'var(--emerald-green)', fontSize:'0.75rem', marginBottom:'0.5rem', fontWeight:'bold' }}>
                ✅ WALLET CREATED SUCCESSFULLY
              </div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', lineHeight:1.6, marginBottom:'0.5rem' }}>
                Save this recovery phrase in a safe place. You will need it to recover your identity.
              </div>
              <div style={{ background:'rgba(0,0,0,0.3)', padding:'0.75rem', borderRadius:'3px', fontSize:'0.65rem', fontFamily:'monospace', color:'var(--text-primary)', wordBreak:'break-all', letterSpacing:'0.05em', lineHeight:1.4 }}>
                {createdPhrase && createdPhrase.split(' ').map((word, index) => (
                  <div key={index} style={{ display:'inline-block', marginRight:'0.5rem', marginBottom:'0.25rem' }}>
                    <span style={{ color:'var(--emerald-green)', fontWeight:'bold' }}>{index + 1}.</span> {word}
                  </div>
                ))}
              </div>
              <div style={{ marginTop:'0.75rem', padding:'0.5rem', background:'rgba(255,193,7,0.1)', border:'1px solid rgba(255,193,7,0.3)', borderRadius:'3px' }}>
                <div style={{ color:'var(--amber-yellow)', fontSize:'0.65rem', fontWeight:'bold', marginBottom:'0.25rem' }}>
                  ⚠ SECURITY WARNING
                </div>
                <div style={{ color:'var(--text-muted)', fontSize:'0.6rem', lineHeight:1.4 }}>
                  • Store this phrase offline and secure<br/>
                  • Do not share it with anyone<br/>
                  • Store it in multiple secure locations
                </div>
              </div>
            </div>
            <button className="pinc-btn pinc-btn-primary" onClick={() => setMode('login')} style={{ padding:'0.875rem' }}>
              <Check size={16} /> I HAVE SAVED THE PHRASE
            </button>
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
              <button className="pinc-btn" onClick={() => { setMode('login'); setError(null); }} style={{ flex:1 }}>← BACK</button>
              <button className="pinc-btn pinc-btn-primary" onClick={handleRecover} disabled={loading} style={{ flex:2 }}>
                {loading ? 'RECOVERING...' : 'RECOVER IDENTITY'}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
