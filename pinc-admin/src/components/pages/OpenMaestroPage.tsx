import { useState } from 'react';
import { Trophy, Target, FileText, Swords, Plus } from 'lucide-react';

const MOCK_CHALLENGES = [
  { id: 1, title: 'Build a REST API in Rust', category: 'Coding', difficulty: 'Hard', reward: 500, participants: 23, status: 'active' },
  { id: 2, title: 'UI Design Sprint', category: 'Design', difficulty: 'Medium', reward: 300, participants: 45, status: 'active' },
  { id: 3, title: 'Smart Contract Audit', category: 'Security', difficulty: 'Hard', reward: 1000, participants: 12, status: 'active' },
  { id: 4, title: 'Data Pipeline Challenge', category: 'Data', difficulty: 'Medium', reward: 400, participants: 31, status: 'completed' },
  { id: 5, title: 'Mobile App Prototype', category: 'Development', difficulty: 'Easy', reward: 200, participants: 67, status: 'completed' },
  { id: 6, title: 'Blockchain Consensus Puzzle', category: 'Coding', difficulty: 'Hard', reward: 750, participants: 8, status: 'active' },
];

const difficultyColor: Record<string, string> = {
  Easy: 'var(--neon-green)',
  Medium: 'var(--accent-yellow)',
  Hard: 'var(--accent-red)',
};

const statusColor: Record<string, string> = {
  active: 'var(--neon-green)',
  completed: 'var(--text-muted)',
};

export default function OpenMaestroPage() {
  const [challenges] = useState(MOCK_CHALLENGES);
  const total = challenges.length;
  const active = challenges.filter(c => c.status === 'active').length;
  const totalPosts = 124;
  const activeDuels = 18;

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>OPENMAESTRO Management</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Challenges, duels, and problem posts</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem',
          background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)',
          borderRadius: 6, color: 'var(--accent-yellow)', cursor: 'pointer', fontSize: '0.65rem',
        }}>
          <Plus size={12} /> Create Challenge
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'TOTAL CHALLENGES', value: total, icon: <Trophy size={14} />, color: 'var(--accent-yellow)' },
          { label: 'ACTIVE CHALLENGES', value: active, icon: <Target size={14} />, color: 'var(--neon-green)' },
          { label: 'TOTAL PROBLEM POSTS', value: totalPosts, icon: <FileText size={14} />, color: 'var(--neon-cyan)' },
          { label: 'ACTIVE DUELS', value: activeDuels, icon: <Swords size={14} />, color: 'var(--accent-red)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.75rem 0.85rem', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>RECENT CHALLENGES</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['TITLE', 'CATEGORY', 'DIFFICULTY', 'REWARD', 'PARTICIPANTS', 'STATUS'].map(h => (
                <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.55rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {challenges.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-primary)', fontWeight: 600 }}>{c.title}</td>
                <td style={{ padding: '0.4rem 0.6rem', color: 'var(--neon-cyan)' }}>{c.category}</td>
                <td style={{ padding: '0.4rem 0.6rem', color: difficultyColor[c.difficulty] || 'var(--text-secondary)' }}>{c.difficulty}</td>
                <td style={{ padding: '0.4rem 0.6rem', color: 'var(--accent-yellow)' }}>{c.reward}</td>
                <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)' }}>{c.participants}</td>
                <td style={{ padding: '0.4rem 0.6rem', color: statusColor[c.status] || 'var(--text-muted)' }}>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
