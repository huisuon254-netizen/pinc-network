import { useState } from 'react';
import { Target, Plus, Code, Shield, Palette, Briefcase, Trash2, Edit3 } from 'lucide-react';

const CATEGORIES = [
  { id: 'coding', label: 'Coding', icon: <Code size={14} />, color: 'var(--neon-cyan)' },
  { id: 'security', label: 'Security', icon: <Shield size={14} />, color: 'var(--accent-red)' },
  { id: 'design', label: 'Design', icon: <Palette size={14} />, color: 'var(--accent-purple)' },
  { id: 'business', label: 'Business', icon: <Briefcase size={14} />, color: 'var(--accent-yellow)' },
];

interface Challenge {
  id: string; title: string; category: string; difficulty: string; reward: number; status: string;
}

const MOCK_CHALLENGES: Challenge[] = [
  { id: '1', title: 'Build a REST API', category: 'coding', difficulty: 'medium', reward: 500, status: 'active' },
  { id: '2', title: 'CTF: Reverse Engineering', category: 'security', difficulty: 'hard', reward: 1000, status: 'active' },
  { id: '3', title: 'Logo Design Contest', category: 'design', difficulty: 'easy', reward: 200, status: 'active' },
  { id: '4', title: 'AI Chatbot Competition', category: 'coding', difficulty: 'hard', reward: 2000, status: 'draft' },
];

export default function ChallengeCenterPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newChallenge, setNewChallenge] = useState({ title: '', category: 'coding', difficulty: 'medium', reward: 100, description: '' });

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Challenge Center</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Create and manage challenges</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 6, color: 'var(--accent-yellow)', cursor: 'pointer', fontSize: '0.65rem',
        }}>
          <Plus size={12} /> Create Challenge
        </button>
      </div>

      {/* Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {CATEGORIES.map(cat => (
          <div key={cat.id} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.75rem', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ color: cat.color }}>{cat.icon}</div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>{cat.label}</div>
              <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>
                {MOCK_CHALLENGES.filter(c => c.category === cat.id).length} active
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--accent-yellow)', borderRadius: 8,
          padding: '1rem', marginBottom: '1rem',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>NEW CHALLENGE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            <input placeholder="Title" value={newChallenge.title} onChange={e => setNewChallenge(p => ({ ...p, title: e.target.value }))} style={{
              padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.7rem',
            }} />
            <select value={newChallenge.category} onChange={e => setNewChallenge(p => ({ ...p, category: e.target.value }))} style={{
              padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.7rem',
            }}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select value={newChallenge.difficulty} onChange={e => setNewChallenge(p => ({ ...p, difficulty: e.target.value }))} style={{
              padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.7rem',
            }}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
            <input type="number" placeholder="Reward (PINC)" value={newChallenge.reward} onChange={e => setNewChallenge(p => ({ ...p, reward: parseInt(e.target.value) || 0 }))} style={{
              padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--text-primary)', fontSize: '0.7rem',
            }} />
          </div>
          <textarea placeholder="Description..." value={newChallenge.description} onChange={e => setNewChallenge(p => ({ ...p, description: e.target.value }))} style={{
            width: '100%', marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-primary)',
            fontSize: '0.7rem', height: 60, resize: 'vertical',
          }} />
          <div style={{ display: 'flex', gap: 6, marginTop: '0.5rem' }}>
            <button style={{ padding: '0.4rem 1rem', background: 'rgba(245,158,11,0.15)', border: '1px solid var(--accent-yellow)', borderRadius: 6, color: 'var(--accent-yellow)', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600 }}>Publish</button>
            <button onClick={() => setShowCreate(false)} style={{ padding: '0.4rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.65rem' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Challenges List */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['CHALLENGE', 'CATEGORY', 'DIFFICULTY', 'REWARD', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.55rem', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_CHALLENGES.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>{c.title}</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <span style={{ color: CATEGORIES.find(cat => cat.id === c.category)?.color || 'var(--text-muted)' }}>{c.category}</span>
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: '0.55rem',
                    background: c.difficulty === 'hard' ? 'rgba(239,68,68,0.12)' : c.difficulty === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                    color: c.difficulty === 'hard' ? 'var(--accent-red)' : c.difficulty === 'medium' ? 'var(--accent-yellow)' : 'var(--neon-green)',
                  }}>{c.difficulty}</span>
                </td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--accent-yellow)' }}>{c.reward} PINC</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: '0.55rem',
                    background: c.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                    color: c.status === 'active' ? 'var(--neon-green)' : 'var(--text-muted)',
                  }}>{c.status}</span>
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--accent-blue)', cursor: 'pointer', padding: 3 }}><Edit3 size={11} /></button>
                    <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--accent-red)', cursor: 'pointer', padding: 3 }}><Trash2 size={11} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
