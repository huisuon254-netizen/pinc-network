import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Wallet, Swords, Server, Globe, Trophy, Loader2, MessageSquare, TrendingUp,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface StatCard {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  glow?: boolean;
}

function StatCard({ label, value, sub, color, icon, glow }: StatCard) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pinc-card"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
          {label}
        </div>
        <div style={{ color }}>{icon}</div>
      </div>
      <div
        style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          color,
          fontFamily: 'monospace',
          letterSpacing: '0.05em',
        }}
        className={glow ? 'glow-blue' : ''}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</div>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${color}44, ${color}88, ${color}44)`,
        }}
      />
    </motion.div>
  );
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export default function NodeHome() {
  const store = useAppStore();
  const {
    identity,
    nodeStatus,
    walletBalance,
    starteranStatus,
    rentbitStatus,
    wagers,
    gameSessions,
    gameStats,
    challenges,
    tournaments,
    rankings,
    netShareStatus,
    reputation,
    aiAgents,
    leaderboard,
    duels,
    conversations,
    homeLoading,
    refreshHomeStats,
  } = store;

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshHomeStats();
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshHomeStats]);

  const nodeId = identity?.node_id ?? '—';
  const username = identity?.username ?? '—';
  const fingerprint = identity?.fingerprint
    ? `${identity.fingerprint.slice(0, 24)}...`
    : '—';
  const reputationStatus = reputation?.status ?? 'Not set';
  const reputationScoreValue = reputation?.total_score != null
    ? asNumber(reputation.total_score, 0)
    : null;
  const reputationScore = reputationScoreValue != null
    ? `${(reputationScoreValue * 100).toFixed(0)}%`
    : null;

  const starteranEarnings = asNumber(starteranStatus?.earnings, 0);
  const rentbitEarnings = asNumber(rentbitStatus?.earnings, 0);
  const walletEarnings = asNumber(walletBalance?.total_earned ?? walletBalance?.balance, 0);

  const activeWagers = (wagers ?? []).filter((w: any) => w.status === 'active' || w.status === 'open').length;
  const wagerWins = (wagers ?? [])
    .filter((w: any) => w.status === 'completed' && w.winner_id === identity?.node_id)
    .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

  const totalEarnings = walletEarnings + starteranEarnings + rentbitEarnings + wagerWins;

  const saraiAgents = (aiAgents ?? []).length;
  const leaderboardRank = leaderboard && leaderboard.length > 0 ? `#${leaderboard[0].rank}` : '—';
  const openDuels = (duels ?? []).filter((d: any) => d.status === 'open').length;

  const activeRentals = asNumber(rentbitStatus?.active_rentals, 0);
  const networkSharing = netShareStatus?.sharing ? 'ON' : 'OFF';
  const sharingColor = networkSharing === 'ON' ? 'var(--neon-green)' : 'var(--text-muted)';

  const gamesWon = (gameSessions ?? []).filter((s: any) => s.result === 'win').length;
  const gamesDrawn = (gameSessions ?? []).filter((s: any) => s.result === 'draw').length;
  const activeTournament = (tournaments ?? []).find(
    (t: any) => t.status === 'active' || t.status === 'registration'
  );
  const tournamentLabel = activeTournament
    ? activeTournament.name || activeTournament.id || 'Active'
    : 'No active tournament';

  const totalPoints = asNumber(gameStats?.total_high_scores, 0);
  const openChallenges = (challenges ?? []).filter((c: any) => c.status === 'open').length;

  if (!loaded || homeLoading) {
    return (
      <div
        style={{
          padding: '2rem',
          maxWidth: '1100px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '1rem',
        }}
      >
        <Loader2 size={32} style={{ color: 'var(--electric-blue)', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.2em',
            marginBottom: '0.25rem',
          }}
        >
          PINC COMMAND CENTER
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Welcome back, {username}
        </div>
      </div>

      {/* IDENTITY CARD */}
      <div className="pinc-card" style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.12em',
            marginBottom: '1rem',
          }}
        >
          IDENTITY CARD
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>USER ID</div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: 'var(--neon-cyan)',
                wordBreak: 'break-all',
              }}
            >
              {nodeId}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>USERNAME</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {username}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>FINGERPRINT</div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                wordBreak: 'break-all',
              }}
            >
              {fingerprint}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>REPUTATION</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--neon-green)', fontWeight: 600 }}>
              {reputationStatus}
              {reputationScore && <span style={{ opacity: 0.7, marginLeft: 4 }}>({reputationScore})</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>GLOBAL RANK</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--soft-purple)', fontWeight: 600 }}>
              {rankings && rankings.length > 0 ? `#${rankings[0].rank}` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* EARNINGS SUMMARY */}
      <div
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          marginBottom: '0.75rem',
        }}
      >
        EARNINGS SUMMARY
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <StatCard
          label="WALLET BALANCE"
          value={`$${walletEarnings.toFixed(2)}`}
          color="var(--neon-green)"
          icon={<Wallet size={14} />}
        />
        <StatCard
          label="TOTAL EARNINGS"
          value={`$${totalEarnings.toFixed(2)}`}
          color="var(--electric-blue)"
          icon={<Wallet size={14} />}
          glow
        />
        <StatCard
          label="STARTERAN"
          value={`$${starteranEarnings.toFixed(2)}`}
          color="var(--neon-cyan)"
          icon={<Globe size={14} />}
        />
        <StatCard
          label="RENTBIT"
          value={`$${rentbitEarnings.toFixed(2)}`}
          color="var(--soft-purple)"
          icon={<Server size={14} />}
        />
        <StatCard
          label="WAGERS WON"
          value={`$${wagerWins.toFixed(2)}`}
          color="var(--neon-yellow)"
          icon={<Swords size={14} />}
        />
        <StatCard
          label="CHALLENGES"
          value={openChallenges.toString()}
          sub="open"
          color="var(--electric-blue)"
          icon={<Trophy size={14} />}
        />
        <StatCard
          label="SARAI AGENTS"
          value={saraiAgents.toString()}
          sub="active"
          color="#a78bfa"
          icon={<Activity size={14} />}
        />
        <StatCard
          label="LEADERBOARD"
          value={leaderboardRank}
          color="#f59e0b"
          icon={<TrendingUp size={14} />}
        />
        <StatCard
          label="OPEN DUELS"
          value={openDuels.toString()}
          color="var(--neon-red)"
          icon={<Swords size={14} />}
        />
        <StatCard
          label="CONVERSATIONS"
          value={(conversations?.length ?? 0).toString()}
          sub="active"
          color="var(--neon-cyan)"
          icon={<MessageSquare size={14} />}
        />
      </div>

      {/* ACTIVITY SUMMARY */}
      <div
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          marginBottom: '0.75rem',
        }}
      >
        ACTIVITY SUMMARY
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <StatCard
          label="CURRENT WAGERS"
          value={activeWagers.toString()}
          color="var(--neon-red)"
          icon={<Swords size={14} />}
        />
        <StatCard
          label="ACTIVE TOURNAMENTS"
          value={(tournaments ?? []).filter((t: any) => t.status === 'active' || t.status === 'registration').length.toString()}
          color="var(--soft-purple)"
          icon={<Trophy size={14} />}
        />
        <StatCard
          label="SERVER RENTALS"
          value={activeRentals.toString()}
          color="var(--soft-purple)"
          icon={<Server size={14} />}
        />
        <StatCard
          label="NETWORK SHARING"
          value={networkSharing}
          color={sharingColor}
          icon={<Globe size={14} />}
        />
        <StatCard
          label="GAME SESSIONS"
          value={(gameSessions ?? []).length.toString()}
          sub="total"
          color="var(--electric-blue)"
          icon={<Activity size={14} />}
        />
      </div>

      {/* RANKING SUMMARY */}
      <div
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.12em',
          marginBottom: '0.75rem',
        }}
      >
        RANKING SUMMARY
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <StatCard
          label="TOTAL POINTS"
          value={totalPoints.toLocaleString()}
          color="var(--neon-green)"
          icon={<Trophy size={14} />}
        />
        <StatCard
          label="GAMES WON"
          value={gamesWon.toString()}
          color="var(--neon-cyan)"
          icon={<Swords size={14} />}
        />
        <StatCard
          label="GAMES DRAWN"
          value={gamesDrawn.toString()}
          color="var(--neon-yellow)"
          icon={<Activity size={14} />}
        />
        <StatCard
          label="TOURNAMENT"
          value={
            tournamentLabel.length > 20 ? tournamentLabel.slice(0, 20) + '...' : tournamentLabel
          }
          color="var(--soft-purple)"
          icon={<Trophy size={14} />}
        />
      </div>

      {/* Node Status */}
      <div className="pinc-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
            NODE STATUS
          </span>
          <span className={`badge ${nodeStatus?.online ? 'badge-online' : 'badge-offline'}`}>
            {nodeStatus?.online ? 'ONLINE' : 'LOCAL'}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '3px' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>PEERS</div>
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--neon-cyan)',
                fontFamily: 'monospace',
              }}
            >
              {nodeStatus?.peer_count ?? 0}
            </div>
          </div>
          <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '3px' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>VAULT FILES</div>
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--neon-green)',
                fontFamily: 'monospace',
              }}
            >
              {nodeStatus?.vault_file_count ?? 0}
            </div>
          </div>
          <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '3px' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>BANDWIDTH UP</div>
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--electric-blue)',
                fontFamily: 'monospace',
              }}
            >
              {nodeStatus?.bandwidth_up_kbps ?? 0} kbps
            </div>
          </div>
          <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '3px' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>BANDWIDTH DOWN</div>
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--electric-blue)',
                fontFamily: 'monospace',
              }}
            >
              {nodeStatus?.bandwidth_down_kbps ?? 0} kbps
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
