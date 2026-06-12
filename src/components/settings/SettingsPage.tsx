import { useState, useEffect } from 'react';
import { Save, Globe } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { PincSettings } from '../../types';

export default function SettingsPage() {
  const { settings, loadSettings, saveSettings, loading } = useAppStore();
  const [local, setLocal] = useState<PincSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);
  useEffect(() => { if (settings) setLocal({ ...settings }); }, [settings]);

  const set = <K extends keyof PincSettings>(k: K, v: PincSettings[K]) =>
    setLocal(prev => prev ? { ...prev, [k]: v } : prev);

  const handleSave = async () => {
    if (!local) return;
    await saveSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!local) return <div style={{ padding:'2rem', color:'var(--text-muted)' }}>Loading settings...</div>;

  const row = (label: string, desc: string, children: React.ReactNode) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 0', borderBottom:'1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize:'0.8rem', color:'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'2px' }}>{desc}</div>
      </div>
      <div>{children}</div>
    </div>
  );

  const toggle = (val: boolean, onChange: (v: boolean) => void) => (
    <button onClick={() => onChange(!val)} style={{
      width:40, height:22, borderRadius:11, border:'none', cursor:'pointer', transition:'all 0.2s',
      background: val ? 'var(--electric-blue)' : 'var(--border-bright)', position:'relative',
    }}>
      <div style={{ position:'absolute', top:3, left: val ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'white', transition:'left 0.2s' }} />
    </button>
  );

  return (
    <div style={{ padding:'2rem', maxWidth:'700px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.5rem' }}>
        <div>
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>CONFIGURATION</div>
          <div style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--text-primary)' }}>Settings</div>
        </div>
        <button className="pinc-btn pinc-btn-primary" onClick={handleSave} disabled={loading}>
          <Save size={14} /> {saved ? 'SAVED ✓' : 'SAVE'}
        </button>
      </div>

      {/* Language */}
      <div className="pinc-card" style={{ marginBottom:'1rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
          <Globe size={12} /> LANGUAGE & REGION
        </div>
        {row('Display Language', 'UI language for the PINC interface',
          <select className="pinc-input" value={local.language} onChange={e => set('language', e.target.value)} style={{ width:'160px' }}>
            {[
              ['en','English'],['es','Español'],['fr','Français'],['de','Deutsch'],
              ['pt','Português'],['zh','中文'],['ja','日本語'],['ko','한국어'],
              ['ar','العربية'],['hi','हिन्दी'],['ru','Русский'],['sw','Kiswahili'],
            ].map(([c,n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        )}
        {row('Theme', 'Visual appearance (dark themes only)',
          <select className="pinc-input" value={local.theme} onChange={e => set('theme', e.target.value)} style={{ width:'160px' }}>
            <option value="dark-cyber">Dark Cyber</option>
            <option value="midnight">Midnight</option>
            <option value="hacker">Hacker Green</option>
          </select>
        )}
      </div>

      {/* Network */}
      <div className="pinc-card" style={{ marginBottom:'1rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>NETWORK</div>
        {row('Relay Traffic', 'Share bandwidth with the PINC mesh network', toggle(local.relay_enabled, v => set('relay_enabled', v)))}
        {row('Network Port', 'QUIC transport port (default: 9000)',
          <input className="pinc-input" type="number" value={local.network_port} onChange={e => set('network_port', Number(e.target.value))} style={{ width:'100px' }} />
        )}
        {row('Max Peers', 'Maximum simultaneous peer connections',
          <input className="pinc-input" type="number" value={local.max_peers} onChange={e => set('max_peers', Number(e.target.value))} style={{ width:'100px' }} />
        )}
        {row('Bandwidth Cap (kbps)', 'Max relay bandwidth (0 = unlimited)',
          <input className="pinc-input" type="number" value={local.bandwidth_cap_kbps} onChange={e => set('bandwidth_cap_kbps', Number(e.target.value))} style={{ width:'120px' }} />
        )}
      </div>

      {/* Vault */}
      <div className="pinc-card" style={{ marginBottom:'1rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>VAULT</div>
        {row('Auto-compress', 'Compress files before encrypting', toggle(local.vault_auto_compress, v => set('vault_auto_compress', v)))}
        {row('Auto-encrypt', 'Always encrypt stored files', toggle(local.vault_auto_encrypt, v => set('vault_auto_encrypt', v)))}
        {row('Storage Limit (GB)', 'Maximum local vault storage',
          <input className="pinc-input" type="number" value={local.storage_limit_gb} onChange={e => set('storage_limit_gb', Number(e.target.value))} style={{ width:'100px' }} />
        )}
      </div>

      {/* General */}
      <div className="pinc-card">
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'0.75rem' }}>GENERAL</div>
        {row('Notifications', 'Show system notifications', toggle(local.notifications_enabled, v => set('notifications_enabled', v)))}
        {row('Telemetry', 'Anonymous usage data (never shared)', toggle(local.telemetry_enabled, v => set('telemetry_enabled', v)))}
        {row('Auto Backup', 'Backup identity on startup', toggle(local.auto_backup, v => set('auto_backup', v)))}
      </div>
    </div>
  );
}
