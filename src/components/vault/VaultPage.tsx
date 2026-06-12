import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Lock, FileText, Search } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { invoke } from '@tauri-apps/api/core';
import type { VaultFile } from '../../types';

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en', { year:'numeric', month:'short', day:'numeric' });
}

export default function VaultPage() {
  const { vaultFiles, loadVault, deleteFile, error, setError } = useAppStore();
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadVault(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const b64 = btoa(String.fromCharCode(...bytes));
      // Generate random 32-byte key for this file (in real use, derive from master key)
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const keyHex = Array.from(keyBytes).map(b => b.toString(16).padStart(2,'0')).join('');
      await invoke('cmd_save_file', { req: { name: file.name, data_base64: b64, key_hex: keyHex } });
      await loadVault();
    } catch (err) {
      setError(String(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const filtered = vaultFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const totalSize = vaultFiles.reduce((s, f) => s + f.size_bytes, 0);

  return (
    <div style={{ padding:'2rem', maxWidth:'900px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.5rem' }}>
        <div>
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>ENCRYPTED VAULT</div>
          <div style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--text-primary)' }}>Local Storage</div>
          <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'2px' }}>
            {vaultFiles.length} file{vaultFiles.length !== 1 ? 's' : ''} · {fmtSize(totalSize)} total
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <Search size={13} style={{ position:'absolute', left:'0.6rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
            <input className="pinc-input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="search files" style={{ paddingLeft:'2rem', width:'180px' }} />
          </div>
          <button className="pinc-btn pinc-btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload size={14} /> {uploading ? 'ENCRYPTING...' : 'UPLOAD'}
          </button>
          <input ref={fileRef} type="file" style={{ display:'none' }} onChange={handleUpload} />
        </div>
      </div>

      {error && (
        <div style={{ background:'rgba(255,34,85,0.1)', border:'1px solid rgba(255,34,85,0.3)', borderRadius:'4px',
          padding:'0.75rem', color:'var(--neon-red)', fontSize:'0.8rem', marginBottom:'1rem' }}>⚠ {error}</div>
      )}

      {filtered.length === 0 ? (
        <div className="pinc-card" style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <Lock size={32} style={{ margin:'0 auto 1rem', opacity:0.3 }} />
          <div style={{ fontSize:'0.8rem' }}>No encrypted files yet</div>
          <div style={{ fontSize:'0.7rem', marginTop:'0.5rem', opacity:0.6 }}>Upload files to encrypt and store them locally</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {filtered.map((file, i) => (
            <motion.div key={file.id} initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.04 }}
              className="pinc-card" style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
              <div style={{ color:'var(--electric-blue)' }}><FileText size={16} /></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'0.85rem', color:'var(--text-primary)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:'2px', display:'flex', gap:'1rem' }}>
                  <span>{fmtSize(file.size_bytes)}</span>
                  <span>{fmtDate(file.created_at)}</span>
                  <span style={{ color: file.encrypted ? 'var(--neon-green)' : 'var(--neon-yellow)' }}>
                    {file.encrypted ? '🔒 ENCRYPTED' : '⚠ PLAIN'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize:'0.6rem', fontFamily:'monospace', color:'var(--text-muted)', maxWidth:'120px', overflow:'hidden', textOverflow:'ellipsis' }}>
                {file.hash.slice(0, 16)}…
              </div>
              <button className="pinc-btn pinc-btn-danger" onClick={() => deleteFile(file.id)}
                style={{ padding:'0.3rem 0.6rem', fontSize:'0.75rem' }}>
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
