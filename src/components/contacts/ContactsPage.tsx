import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import {
  UserPlus, Search, X, Trash2, Users, Copy, Check, QrCode,
  Hash, Filter, Share2, RefreshCcw, Tag, Shield, Loader2,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { Contact } from '../../types';

const SERVICE_PRESETS = [
  { value: 'General', color: 'var(--electric-blue)' },
  { value: 'Treific', color: 'var(--neon-green)' },
  { value: 'Starteran', color: '#f59e0b' },
  { value: 'Sarai', color: '#a78bfa' },
  { value: 'Rentbit', color: '#f472b6' },
  { value: 'ZeroFlipper', color: '#fb923c' },
  { value: 'OpenMaestro', color: '#34d399' },
  { value: 'NetWorld', color: '#60a5fa' },
];

function pincIdFromNodeId(nodeId: string): string {
  const digits = nodeId.replace(/\D/g, '');
  if (digits.length >= 7) {
    return `pinc-${digits.slice(0, 5)}-${digits.slice(digits.length - 2)}`;
  }
  return `pinc-${digits || nodeId}`;
}

export default function ContactsPage() {
  const identity = useAppStore(s => s.identity);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addNodeId, setAddNodeId] = useState('');
  const [addNickname, setAddNickname] = useState('');
  const [addService, setAddService] = useState('General');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [qrTarget, setQrTarget] = useState<Contact | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [filterService, setFilterService] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [shareCodeMap, setShareCodeMap] = useState<Record<string, string>>({});

  const myPincId = identity ? pincIdFromNodeId(identity.node_id) : '';

  const loadContacts = async () => {
    try {
      const result = await invoke<Contact[]>('cmd_list_contacts');
      setContacts(Array.isArray(result) ? result : []);
    } catch { setContacts([]); }
  };

  useEffect(() => { loadContacts(); }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const results = await invoke<any[]>('cmd_search_users', { query: q.trim() });
      setSearchResults(Array.isArray(results) ? results : []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleAdd = async () => {
    if (!addNodeId.trim()) return;
    setAdding(true);
    try {
      await invoke('cmd_add_contact', {
        contactNodeId: addNodeId.trim(),
        nickname: addNickname.trim() || addNodeId.trim(),
        serviceName: addService !== 'General' ? addService : undefined,
      });
      setAddNodeId(''); setAddNickname(''); setShowAdd(false); setAddService('General');
      loadContacts();
    } catch (e) { console.error('add contact failed', e); }
    finally { setAdding(false); }
  };

  const handleRemove = async (nodeId: string) => {
    try {
      await invoke('cmd_remove_contact', { contactNodeId: nodeId });
      loadContacts();
    } catch (e) { console.error('remove contact failed', e); }
  };

  const updateService = async (nodeId: string, service: string) => {
    try {
      await invoke('cmd_update_contact_service', { contactNodeId: nodeId, serviceName: service });
      loadContacts();
    } catch (e) { console.error('update service failed', e); }
  };

  const generateShareCode = async (contact: Contact) => {
    if (shareCodeMap[contact.contact_node_id]) return;
    setGeneratingCode(true);
    try {
      const result = await invoke<{ share_code: string }>('cmd_generate_starteran_share_code');
      setShareCodeMap(prev => ({ ...prev, [contact.contact_node_id]: result.share_code }));
      await invoke('cmd_update_contact_service', {
        contactNodeId: contact.contact_node_id,
        serviceName: 'Starteran',
      });
      loadContacts();
    } catch (e) { console.error('generate share code failed', e); }
    finally { setGeneratingCode(false); }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const generateQr = async (contact: Contact) => {
    setQrTarget(contact);
    setGeneratingQr(true);
    setQrDataUrl(null);
    try {
      const payload = JSON.stringify({
        pinc_id: pincIdFromNodeId(contact.contact_node_id),
        node_id: contact.contact_node_id,
        username: contact.contact_username,
        nickname: contact.nickname,
        service: contact.service_name,
        share_code: contact.share_code || undefined,
      });
      const b64 = await invoke<string>('cmd_generate_qr_png', { data: payload });
      setQrDataUrl(`data:image/png;base64,${b64}`);
    } catch (e) {
      console.error('QR generation failed', e);
      setQrTarget(null);
    } finally { setGeneratingQr(false); }
  };

  const filteredContacts = filterService
    ? contacts.filter(c => c.service_name === filterService)
    : contacts;

  const uniqueServices = Array.from(new Set(contacts.map(c => c.service_name))).filter(Boolean);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Contacts</h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Manage your trusted peers</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.85rem',
          background: 'rgba(0,212,255,0.1)', border: '1px solid var(--electric-blue)',
          borderRadius: 6, color: 'var(--electric-blue)', cursor: 'pointer',
          fontSize: '0.7rem', fontWeight: 600,
        }}>
          <UserPlus size={14} /> Add Contact
        </button>
      </div>

      {/* My ID with PINC ID */}
      {identity && (
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 2 }}>YOUR PINC ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--neon-cyan)' }}>{myPincId}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 2 }}>@{identity.username || identity.node_id}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
             <button onClick={() => generateQr({
               id: 'self', contact_node_id: identity.node_id, contact_username: identity.username,
               nickname: identity.username || 'Me', service_name: '', share_code: '', pinc_id: pincIdFromNodeId(identity.node_id), status: 'accepted', created_at: Date.now() / 1000,
             })} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 4,
              color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', fontSize: '0.6rem',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <QrCode size={12} /> QR
            </button>
            <button onClick={() => copyText(myPincId, 'self-pinc')} style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 4,
              color: copied === 'self-pinc' ? 'var(--neon-green)' : 'var(--text-muted)', cursor: 'pointer',
              padding: '4px 8px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {copied === 'self-pinc' ? <Check size={12} /> : <Copy size={12} />}
              {copied === 'self-pinc' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Service Filter */}
      {uniqueServices.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={12} style={{ color: 'var(--text-muted)', marginRight: 4 }} />
          <button
            onClick={() => setFilterService(null)}
            style={{
              padding: '3px 10px', borderRadius: '9999px', fontSize: '0.65rem', cursor: 'pointer',
              background: !filterService ? 'rgba(0,212,255,0.12)' : 'var(--bg-secondary)',
              border: `1px solid ${!filterService ? 'var(--electric-blue)' : 'var(--border)'}`,
              color: !filterService ? 'var(--neon-cyan)' : 'var(--text-muted)',
            }}
          >All</button>
          {uniqueServices.map(svc => {
            const preset = SERVICE_PRESETS.find(p => p.value === svc);
            const color = preset?.color || 'var(--text-muted)';
            const active = filterService === svc;
            return (
              <button key={svc} onClick={() => setFilterService(svc)} style={{
              padding: '3px 10px', borderRadius: '9999px', fontSize: '0.65rem', cursor: 'pointer',
              background: active ? `${color}20` : 'var(--bg-secondary)',
                border: `1px solid ${active ? color : 'var(--border)'}`,
                color: active ? color : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Tag size={9} /> {svc}
              </button>
            );
          })}
        </div>
      )}

      {/* Add Contact Form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--electric-blue)',
          borderRadius: 8, padding: '1rem', marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>New Contact</span>
            <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
          <input placeholder="PINC ID (e.g. pinc-12345-67) or Node ID" value={addNodeId} onChange={e => setAddNodeId(e.target.value)} style={{
            width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.75rem', marginBottom: '0.5rem',
            fontFamily: 'monospace',
          }} />
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input placeholder="Nickname (optional)" value={addNickname} onChange={e => setAddNickname(e.target.value)} style={{
              flex: 1, padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.75rem',
            }} />
            <select value={addService} onChange={e => setAddService(e.target.value)} style={{
              padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.72rem', cursor: 'pointer',
            }}>
              {SERVICE_PRESETS.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
            </select>
          </div>

          {/* Search for users */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-muted)' }} />
            <input placeholder="Search by ID or username..." value={searchQuery} onChange={e => handleSearch(e.target.value)} style={{
              width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.75rem',
            }} />
          </div>
          {searchResults.length > 0 && (
            <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: '0.5rem' }}>
              {searchResults.map(r => (
                <button key={r.node_id} onClick={() => {
                  setAddNodeId(r.pinc_id || r.node_id);
                  setAddNickname(r.display_name || r.username);
                  setSearchQuery(''); setSearchResults([]);
                }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 0.5rem',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4,
                  cursor: 'pointer', marginBottom: 4, color: 'var(--text-primary)',
                }}>
                  <Users size={12} />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--neon-cyan)' }}>
                    {r.pinc_id || pincIdFromNodeId(r.node_id)}
                  </span>
                  {r.username && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>@{r.username}</span>}
                </button>
              ))}
            </div>
          )}

          <button onClick={handleAdd} disabled={adding || !addNodeId.trim()} style={{
            padding: '0.5rem 1rem', background: adding ? 'var(--bg-tertiary)' : 'rgba(0,212,255,0.15)',
            border: '1px solid var(--electric-blue)', borderRadius: 6,
            color: adding ? 'var(--text-muted)' : 'var(--electric-blue)',
            cursor: adding ? 'default' : 'pointer', fontSize: '0.7rem', fontWeight: 600,
          }}>
            {adding ? 'Adding...' : 'Add Contact'}
          </button>
        </motion.div>
      )}

      {/* QR Code Modal */}
      {qrTarget && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setQrTarget(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-primary)', border: '1px solid var(--electric-blue)',
            borderRadius: 12, padding: '2rem', textAlign: 'center', maxWidth: 340,
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Share Contact — {qrTarget.nickname || qrTarget.contact_username || 'Contact'}
            </div>
            {generatingQr ? (
              <div style={{ padding: '3rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <RefreshCcw size={20} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 0.5rem' }} />
                Generating QR...
              </div>
            ) : qrDataUrl ? (
              <>
                <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 8, imageRendering: 'pixelated' }} />
                <div style={{ marginTop: '1rem', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--neon-cyan)' }}>
                  {pincIdFromNodeId(qrTarget.contact_node_id)}
                </div>
                {qrTarget.share_code && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Share2 size={11} /> Share: {qrTarget.share_code}
                  </div>
                )}
                <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {qrTarget.service_name} · {qrTarget.nickname || qrTarget.contact_username}
                </div>
              </>
            ) : null}
            <button onClick={() => setQrTarget(null)} style={{ marginTop: '1rem', padding: '0.4rem 1rem', background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem' }}>
              Close
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '2rem', textAlign: 'center',
        }}>
          <Users size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {filterService ? `No contacts in ${filterService}` : 'No contacts yet'}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {!filterService ? 'Add a peer using their PINC ID (pinc-XXXXX-XX)' : 'Try a different service filter'}
          </div>
        </div>
      ) : (
        filteredContacts.map(c => {
          const pincId = pincIdFromNodeId(c.contact_node_id);
          const servicePreset = SERVICE_PRESETS.find(s => s.value === c.service_name);
          const serviceColor = servicePreset?.color || 'var(--text-muted)';
          const isStarteran = c.service_name === 'Starteran';
          const currentShareCode = shareCodeMap[c.contact_node_id] || c.share_code;
          return (
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `${serviceColor}15`, border: `1px solid ${serviceColor}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', color: serviceColor, fontWeight: 700,
              }}>
                {(c.nickname || c.contact_username).charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {c.nickname || c.contact_username || 'Unnamed'}
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.58rem',
                    color: serviceColor, background: `${serviceColor}12`, padding: '1px 6px',
                    borderRadius: '9999px', border: `1px solid ${serviceColor}25`, cursor: 'pointer',
                  }} onClick={() => {
                    const newService = prompt(`Set service for ${c.nickname || c.contact_username}:`, c.service_name);
                    if (newService !== null && newService.trim()) updateService(c.contact_node_id, newService.trim());
                  }}>
                    <Tag size={8} /> {c.service_name}
                  </span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Shield size={9} style={{ color: 'var(--electric-blue)' }} />
                  {pincId}
                </div>
                {isStarteran && currentShareCode && (
                  <div style={{ fontSize: '0.62rem', color: '#f59e0b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Share2 size={9} /> {currentShareCode}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <button
                  onClick={() => generateQr(c)}
                  title="Share QR code"
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 6px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  <QrCode size={11} /> QR
                </button>
                {isStarteran && !currentShareCode && (
                  <button
                    onClick={() => generateShareCode(c)}
                    disabled={generatingCode}
                    title="Generate Starteran share code"
                    style={{ background: 'none', border: '1px solid #f59e0b40', borderRadius: 4, color: '#f59e0b', cursor: 'pointer', padding: '4px 6px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <Share2 size={11} />
                  </button>
                )}
                <button onClick={() => copyText(pincId, pincId)} style={{
                  background: 'none', border: '1px solid var(--border)', borderRadius: 4,
                  color: copied === pincId ? 'var(--neon-green)' : 'var(--text-muted)', cursor: 'pointer',
                  padding: '4px 6px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  {copied === pincId ? <Check size={11} /> : <Hash size={11} />}
                  {copied === pincId ? 'Copied' : 'PINC'}
                </button>
                <button onClick={() => handleRemove(c.contact_node_id)} style={{
                  background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4,
                  color: 'var(--neon-red)', cursor: 'pointer', padding: '4px 6px', fontSize: '0.6rem',
                }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </motion.div>
          );
        })
      )}
      
      {/* QR Code Modal */}
      {qrTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }} onClick={() => { setQrTarget(null); setQrDataUrl(null); }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '1.5rem', maxWidth: 360, width: '100%', textAlign: 'center',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '1rem' }}>
              SHARE CONTACT
            </div>
            {generatingQr ? (
              <div style={{ padding: '2rem' }}><Loader2 size={24} style={{ color: 'var(--electric-blue)', animation: 'spin 1s linear infinite' }} /></div>
            ) : qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200, margin: '0 auto 1rem', borderRadius: 8, border: '1px solid var(--border)' }} />
            ) : null}
            <div style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
              {pincIdFromNodeId(qrTarget?.contact_node_id || '')}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {qrTarget?.nickname || qrTarget?.contact_username || 'Contact'}
            </div>
            <button onClick={() => { setQrTarget(null); setQrDataUrl(null); }} className="pinc-btn" style={{ padding: '0.4rem 1rem' }}>
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
