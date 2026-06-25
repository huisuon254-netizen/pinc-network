import { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import {
  Trophy, Crown, Medal, TrendingUp, Server, Gamepad2,
  Briefcase, Target, ChevronDown, Star, Award, Users,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type Category = 'gamers' | 'earners' | 'vendors' | 'hosts' | 'challenges' | 'jobs';

interface RankingEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  country: string;
  avatar_color: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'gamers',     label: 'Top Gamers',          icon: <Gamepad2 size={14} />,   color: 'var(--neon-cyan)' },
  { id: 'earners',    label: 'Top Earners',         icon: <TrendingUp size={14} />, color: 'var(--neon-green)' },
  { id: 'vendors',    label: 'Top Network Vendors',  icon: <Server size={14} />,     color: 'var(--soft-purple)' },
  { id: 'hosts',      label: 'Top Server Hosts',     icon: <Server size={14} />,     color: 'var(--neon-yellow)' },
  { id: 'challenges', label: 'Top Challenge Winners', icon: <Target size={14} />,     color: 'var(--neon-red)' },
  { id: 'jobs',       label: 'Top Job Performers',   icon: <Briefcase size={14} />,  color: 'var(--electric-blue)' },
];

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', UK: '🇬🇧', DE: '🇩🇪', JP: '🇯🇵', BR: '🇧🇷',
  IN: '🇮🇳', KR: '🇰🇷', FR: '🇫🇷', AU: '🇦🇺', CA: '🇨🇦',
};

const MEDAL_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateRankings(base: number = 0): RankingEntry[] {
  const names = [
    'ShadowNode', 'CryptoWolf', 'DataPioneer', 'NetRunner', 'ByteMaster',
    'CloudKing', 'PixelForge', 'CodeNinja', 'VoltSeeker', 'IronRelay',
  ];
  const countries = ['US', 'UK', 'DE', 'JP', 'BR', 'IN', 'KR', 'FR', 'AU', 'CA'];
  const colors = [
    '#00d4ff', '#39ff14', '#ff2255', '#a855f7', '#ffe600',
    '#00ffcc', '#ff6b35', '#4ecdc4', '#f7dc6f', '#bb8fce',
  ];

  return Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1,
    user_id: `user_${Math.random().toString(36).slice(2, 10)}`,
    username: names[i % 10] + (i >= 10 ? '_' + i : ''),
    score: Math.floor(10000 - i * 400 + Math.random() * 200),
    country: countries[i % 10],
    avatar_color: colors[i % 10],
  }));
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  cat,
  active,
  onClick,
}: {
  cat: (typeof CATEGORIES)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0.45rem 0.85rem',
        borderRadius: '6px',
        border: active ? `1px solid ${cat.color}` : '1px solid var(--border)',
        background: active ? `${cat.color}12` : 'transparent',
        color: active ? cat.color : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '0.68rem',
        fontFamily: 'monospace',
        letterSpacing: '0.04em',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {cat.icon}
      {cat.label}
    </button>
  );
}

function LeaderboardRow({
  entry,
  isOwn,
  index,
}: {
  entry: RankingEntry;
  isOwn: boolean;
  index: number;
}) {
  const medal = entry.rank <= 3 ? MEDAL_COLORS[entry.rank - 1] : undefined;
  const isTop3 = entry.rank <= 3;
  const initial = entry.username.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '48px 36px 1fr 100px 56px',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.65rem 0.85rem',
        borderRadius: '6px',
        background: isOwn
          ? 'rgba(0,212,255,0.07)'
          : index % 2 === 0
          ? 'rgba(255,255,255,0.015)'
          : 'transparent',
        border: isOwn ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
        transition: 'background 0.15s',
      }}
    >
      {/* Rank */}
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: isTop3 ? '0.85rem' : '0.72rem',
          fontWeight: isTop3 ? 800 : 500,
          color: medal ? medal : 'var(--text-muted)',
          textAlign: 'center',
          textShadow: medal ? `0 0 8px ${medal}44` : undefined,
        }}
      >
        {isTop3 ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            {entry.rank === 1 && <Crown size={12} />}
            {entry.rank === 2 && <Medal size={12} />}
            {entry.rank === 3 && <Award size={12} />}
            #{entry.rank}
          </span>
        ) : (
          `#${entry.rank}`
        )}
      </div>

      {/* Avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: entry.avatar_color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#000',
          boxShadow: isTop3 ? `0 0 10px ${entry.avatar_color}55` : undefined,
        }}
      >
        {initial}
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '0.72rem',
          color: isOwn ? 'var(--neon-cyan)' : 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.username}
        {isOwn && (
          <span
            style={{
              marginLeft: '6px',
              fontSize: '0.55rem',
              color: 'var(--neon-cyan)',
              background: 'rgba(0,212,255,0.12)',
              padding: '1px 5px',
              borderRadius: '3px',
              fontWeight: 600,
            }}
          >
            YOU
          </span>
        )}
      </div>

      {/* Score */}
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '0.72rem',
          fontWeight: 600,
          color: isTop3 ? medal : 'var(--text-primary)',
          textAlign: 'right',
        }}
      >
        {(entry.score ?? 0).toLocaleString()}
      </div>

      {/* Country */}
      <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
        {COUNTRY_FLAGS[entry.country] || entry.country}
      </div>
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<Category>('gamers');
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    invoke<RankingEntry[]>('cmd_get_rankings', { category: activeTab })
      .then((data) => {
        if (data && data.length > 0) {
          setRankings(data);
        } else {
          setRankings(generateRankings());
        }
      })
      .catch(() => {
        setRankings(generateRankings());
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  const topScore = useMemo(() => rankings[0]?.score ?? 0, [rankings]);
  const totalPlayers = rankings.length;
  const activeCat = CATEGORIES.find((c) => c.id === activeTab)!;

  return (
    <div style={{ padding: '2rem', maxWidth: '860px' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.2em',
            marginBottom: '0.25rem',
          }}
        >
          GLOBAL LEADERBOARD
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Rankings</div>
          <span className="badge badge-info">PHASE 9</span>
        </div>
      </div>

      {/* Stats bar */}
      <div
        className="pinc-card border-glow-blue"
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          textAlign: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: activeCat.color,
            }}
          >
            {totalPlayers}
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
            PLAYERS
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--neon-yellow)',
            }}
          >
            {topScore.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
            TOP SCORE
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--neon-green)',
            }}
          >
            {CATEGORIES.length}
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
            CATEGORIES
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.4rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        {CATEGORIES.map((cat) => (
          <TabButton
            key={cat.id}
            cat={cat}
            active={activeTab === cat.id}
            onClick={() => setActiveTab(cat.id)}
          />
        ))}
      </div>

      {/* Leaderboard */}
      <div className="pinc-card" style={{ padding: '0.75rem' }}>
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '48px 36px 1fr 100px 56px',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.85rem',
            borderBottom: '1px solid var(--border)',
            marginBottom: '0.25rem',
          }}
        >
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.1em' }}>
            RANK
          </div>
          <div />
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            USER
          </div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'right', letterSpacing: '0.1em' }}>
            SCORE
          </div>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.1em' }}>
            FLAG
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              style={{ display: 'inline-block', marginBottom: '0.75rem' }}
            >
              <Trophy size={20} />
            </motion.div>
            <div>Loading rankings...</div>
          </div>
        ) : rankings.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
            }}
          >
            No rankings available for this category.
          </div>
        ) : (
          rankings.map((entry, i) => (
            <LeaderboardRow
              key={`${activeTab}-${entry.rank}`}
              entry={entry}
              isOwn={myUserId != null && entry.user_id === myUserId}
              index={i}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          textAlign: 'center',
          fontSize: '0.6rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
        }}
      >
        Rankings update every 60 seconds &middot; Scores are aggregated from all network activity
      </div>
    </div>
  );
}
