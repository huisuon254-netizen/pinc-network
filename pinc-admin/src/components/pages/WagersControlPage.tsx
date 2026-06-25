import { useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Swords, Trophy, Users, Gamepad2, Plus } from 'lucide-react';

export default function WagersControlPage() {
  const { gameStats, loadGameStats } = useAdminStore();
  useEffect(() => { loadGameStats(); const t = setInterval(loadGameStats, 8000); return () => clearInterval(t); }, []);

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>WAGERS Control Center</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Live games and tournaments</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.75rem',
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 6, color: 'var(--accent-purple)', cursor: 'pointer', fontSize: '0.65rem',
        }}>
          <Plus size={12} /> Create Tournament
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'GAMES RUNNING', value: gameStats.games_running, icon: <Gamepad2 size={14} />, color: 'var(--neon-green)' },
          { label: 'PLAYERS ONLINE', value: gameStats.players_online, icon: <Users size={14} />, color: 'var(--neon-cyan)' },
          { label: 'CURRENT MATCHES', value: gameStats.current_matches, icon: <Swords size={14} />, color: 'var(--accent-red)' },
          { label: 'TOURNAMENTS', value: gameStats.tournaments_active, icon: <Trophy size={14} />, color: 'var(--accent-yellow)' },
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

      {/* Top Players */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        padding: '1rem',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>TOP PLAYERS</div>
        {gameStats.top_players.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.65rem' }}>No active players</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['RANK', 'PLAYER', 'SCORE', 'WINS'].map(h => (
                  <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.55rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gameStats.top_players.map((p, i) => (
                <tr key={p.node_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.4rem 0.6rem', color: i === 0 ? 'var(--accent-yellow)' : i === 1 ? 'var(--text-secondary)' : i === 2 ? 'var(--accent-orange)' : 'var(--text-muted)' }}>#{i + 1}</td>
                  <td style={{ padding: '0.4rem 0.6rem', fontFamily: 'monospace', color: 'var(--neon-cyan)' }}>{p.node_id.slice(0, 10)}...</td>
                  <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-primary)' }}>{p.score}</td>
                  <td style={{ padding: '0.4rem 0.6rem', color: 'var(--neon-green)' }}>{p.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
