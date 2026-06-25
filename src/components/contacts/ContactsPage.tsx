import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { UserPlus, Search, X, Trash2, Users, Copy, Check } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface Contact {
  id: string;
  contact_node_id: string;
  contact_username: string;
  nickname: string;
  status: string;
  created_at: number;
}

interface SearchResult {
  node_id: string;
  display_name: string;
  username: string;
}

export default function ContactsPage() {
  const identity = useAppStore(s => s.identity);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addNodeId, setAddNodeId] = useState('');
  const [addNickname, setAddNickname] = useState('');
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);

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
      const results = await invoke<SearchResult[]>('cmd_search_users', { query: q.trim() });
      setSearchResults(Array.isArray(results) ? results : []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleAdd = async () => {
    if (!addNodeId.trim()) return;
    setAdding(true);
    try {
      await invoke('cmd_add_contact', { contactNodeId: addNodeId.trim(), nickname: addNickname.trim() || addNodeId.trim() });
      setAddNodeId(''); setAddNickname(''); setShowAdd(false);
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

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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

      {/* My ID */}
      {identity && (
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 2 }}>YOUR ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--neon-cyan)' }}>{identity.node_id}</div>
            {identity.username && (
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 2 }}>@{identity.username}</div>
            )}
          </div>
          <button onClick={() => copyId(identity.node_id)} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 4,
            color: copied ? 'var(--neon-green)' : 'var(--text-muted)', cursor: 'pointer',
            padding: '4px 8px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
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
          <input placeholder="Node ID" value={addNodeId} onChange={e => setAddNodeId(e.target.value)} style={{
            width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.75rem', marginBottom: '0.5rem',
            fontFamily: 'monospace',
          }} />
          <input placeholder="Nickname (optional)" value={addNickname} onChange={e => setAddNickname(e.target.value)} style={{
            width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.75rem', marginBottom: '0.75rem',
          }} />

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
                <button key={r.node_id} onClick={() => { setAddNodeId(r.node_id); setAddNickname(r.display_name); setSearchQuery(''); setSearchResults([]); }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 0.5rem',
                  background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 4,
                  cursor: 'pointer', marginBottom: 4, color: 'var(--text-primary)',
                }}>
                  <Users size={12} />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{r.node_id}</span>
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

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '2rem', textAlign: 'center',
        }}>
          <Users size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No contacts yet</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>Add a peer using their 7-digit ID</div>
        </div>
      ) : (
        contacts.map(c => (
          <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,212,255,0.1)', border: '1px solid var(--electric-blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', color: 'var(--electric-blue)', fontWeight: 700,
            }}>
              {(c.contact_username || c.contact_node_id).charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {c.nickname || c.contact_username || 'Unnamed'}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {c.contact_node_id}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => copyId(c.contact_node_id)} style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 4,
                color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 6px', fontSize: '0.6rem',
              }}>
                <Copy size={11} />
              </button>
              <button onClick={() => handleRemove(c.contact_node_id)} style={{
                background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4,
                color: 'var(--neon-red)', cursor: 'pointer', padding: '4px 6px', fontSize: '0.6rem',
              }}>
                <Trash2 size={11} />
              </button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
