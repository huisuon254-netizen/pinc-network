import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import {
  Code2, Shield, Brain, Palette, Database, Server,
  AlertTriangle, Swords, Trophy, Terminal,
  Clock, Users, DollarSign, Target, Zap, Lock,
  Globe, MapPin, ChevronRight,
  Play, Crown, Medal, Loader2, AlertCircle, Inbox
} from 'lucide-react';

interface Challenge {
  id: number;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  reward: string;
  participants: number;
  timeLimit: string;
}

interface ProblemMarketItem {
  id: number;
  company: string;
  problem: string;
  reward: string;
  status: 'Open' | 'Urgent' | 'Critical';
  timeRemaining: string;
  category: string;
}

interface DuelItem {
  id: number;
  type: string;
  players: number;
  entryFee: string;
  prizePool: string;
  description: string;
}

interface RankingItem {
  rank: number;
  name: string;
  country: string;
  score: number;
  challenges_completed: number;
  win_rate: number;
}

const tabs = [
  { id: 'coding', label: 'Coding Challenges', icon: <Code2 size={18} /> },
  { id: 'cyber', label: 'Cybersecurity', icon: <Shield size={18} /> },
  { id: 'ai', label: 'AI Challenges', icon: <Brain size={18} /> },
  { id: 'design', label: 'Design', icon: <Palette size={18} /> },
  { id: 'data', label: 'Data', icon: <Database size={18} /> },
  { id: 'infra', label: 'Infrastructure', icon: <Server size={18} /> },
  { id: 'market', label: 'Problem Market', icon: <AlertTriangle size={18} /> },
  { id: 'duels', label: 'Challenge Duels', icon: <Swords size={18} /> },
  { id: 'rankings', label: 'Rankings', icon: <Trophy size={18} /> },
  { id: 'envs', label: 'Environments', icon: <Terminal size={18} /> },
];

const categoryTabMap: Record<string, string> = {
  coding: 'Coding',
  cyber: 'Security',
  ai: 'AI',
  design: 'Design',
  data: 'Data',
  infra: 'Infrastructure',
};

const duelIcons: Record<string, React.ReactNode> = {
  'Coding Duel': <Code2 size={24} />,
  'Chess Duel': <Target size={24} />,
  'AI Duel': <Brain size={24} />,
  'Security Duel': <Lock size={24} />,
  'Design Duel': <Palette size={24} />,
};

const environments = [
  { category: 'Linux', items: ['Ubuntu 22.04', 'Fedora 38', 'Debian 12', 'Arch Linux'], icon: <Terminal size={20} />, color: '#f59e0b' },
  { category: 'Web', items: ['React 18', 'Vue 3', 'Angular 16', 'Next.js 14'], icon: <Globe size={20} />, color: '#3b82f6' },
  { category: 'Backend', items: ['Rust', 'Go', 'Node.js', 'Java 21', 'Python 3.12'], icon: <Server size={20} />, color: '#10b981' },
  { category: 'Security', items: ['Isolated VMs', 'Containerized Targets', 'Network Segments', 'Air-gapped'], icon: <Lock size={20} />, color: '#ef4444' },
];

const difficultyColor: Record<string, string> = {
  Easy: '#10b981',
  Medium: '#f59e0b',
  Hard: '#ef4444',
};

const statusColor: Record<string, string> = {
  Open: '#10b981',
  Urgent: '#f59e0b',
  Critical: '#ef4444',
};

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgba(168,85,247,0.06)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem', color: 'var(--text-muted)',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6 }}>
        {description}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ color: 'var(--accent-purple)' }}
      >
        <Loader2 size={36} />
      </motion.div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.5rem', color: '#ef4444',
      }}>
        <AlertCircle size={28} />
      </div>
      <div style={{ fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.5rem' }}>Failed to load data</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
        {message}
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        style={{
          background: 'var(--accent-purple)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        Try Again
      </motion.button>
    </div>
  );
}

function parseRewardValue(reward: string | number | undefined | null): number {
  if (reward == null) return 0;
  if (typeof reward === 'number') return reward;
  const cleaned = reward.replace(/[$,]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

const OpenMaestroPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('coding');
  const [rankingFilter, setRankingFilter] = useState('Global');

  const [codingChallenges, setCodingChallenges] = useState<Challenge[]>([]);
  const [cyberChallenges, setCyberChallenges] = useState<Challenge[]>([]);
  const [aiChallenges, setAiChallenges] = useState<Challenge[]>([]);
  const [designChallenges, setDesignChallenges] = useState<Challenge[]>([]);
  const [dataChallenges, setDataChallenges] = useState<Challenge[]>([]);
  const [infraChallenges, setInfraChallenges] = useState<Challenge[]>([]);
  const [problemMarket, setProblemMarket] = useState<ProblemMarketItem[]>([]);
  const [duels, setDuels] = useState<DuelItem[]>([]);
  const [rankings, setRankings] = useState<RankingItem[]>([]);

  const [loadingChallenges, setLoadingChallenges] = useState<Record<string, boolean>>({});
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [loadingDuels, setLoadingDuels] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(false);

  const [errorChallenges, setErrorChallenges] = useState<Record<string, string | null>>({});
  const [errorMarket, setErrorMarket] = useState<string | null>(null);
  const [errorDuels, setErrorDuels] = useState<string | null>(null);
  const [errorRankings, setErrorRankings] = useState<string | null>(null);

  const challengeTabs = ['coding', 'cyber', 'ai', 'design', 'data', 'infra'];

  const loadChallenges = async (tabId: string) => {
    const categoryName = categoryTabMap[tabId];
    if (!categoryName) return;
    setLoadingChallenges(prev => ({ ...prev, [tabId]: true }));
    setErrorChallenges(prev => ({ ...prev, [tabId]: null }));
    try {
      const data = await invoke<any[]>('cmd_list_challenges', { category: categoryName });
      const setter: Record<string, React.Dispatch<React.SetStateAction<Challenge[]>>> = {
        coding: setCodingChallenges,
        cyber: setCyberChallenges,
        ai: setAiChallenges,
        design: setDesignChallenges,
        data: setDataChallenges,
        infra: setInfraChallenges,
      };
      setter[tabId]?.(data as Challenge[]);
    } catch (e: any) {
      setErrorChallenges(prev => ({ ...prev, [tabId]: e.message || String(e) }));
    } finally {
      setLoadingChallenges(prev => ({ ...prev, [tabId]: false }));
    }
  };

  const loadMarket = async () => {
    setLoadingMarket(true);
    setErrorMarket(null);
    try {
      const data = await invoke<any[]>('cmd_list_problems');
      setProblemMarket(data as ProblemMarketItem[]);
    } catch (e: any) {
      setErrorMarket(e.message || String(e));
    } finally {
      setLoadingMarket(false);
    }
  };

  const loadDuels = async () => {
    setLoadingDuels(true);
    setErrorDuels(null);
    try {
      const data = await invoke<any[]>('cmd_list_duels');
      setDuels(data as DuelItem[]);
    } catch (e: any) {
      setErrorDuels(e.message || String(e));
    } finally {
      setLoadingDuels(false);
    }
  };

  const loadRankings = async () => {
    setLoadingRankings(true);
    setErrorRankings(null);
    try {
      const data = await invoke<any[]>('cmd_list_rankings', { filter: rankingFilter });
      setRankings(data as RankingItem[]);
    } catch (e: any) {
      setErrorRankings(e.message || String(e));
    } finally {
      setLoadingRankings(false);
    }
  };

  useEffect(() => {
    challengeTabs.forEach(tab => loadChallenges(tab));
    loadMarket();
    loadDuels();
    loadRankings();
  }, []);

  useEffect(() => {
    loadRankings();
  }, [rankingFilter]);

  const getAllChallenges = useMemo(() => {
    const all = [
      ...codingChallenges,
      ...cyberChallenges,
      ...aiChallenges,
      ...designChallenges,
      ...dataChallenges,
      ...infraChallenges,
    ];
    return all;
  }, [codingChallenges, cyberChallenges, aiChallenges, designChallenges, dataChallenges, infraChallenges]);

  const headerStats = useMemo(() => {
    const totalChallenges = getAllChallenges.length;
    const totalCompetitors = rankings.reduce((s, r) => s + 1, 0);
    const totalRewards = getAllChallenges.reduce((sum, c) => sum + parseRewardValue(c.reward), 0);
    return { totalChallenges, totalCompetitors, totalRewards };
  }, [getAllChallenges, rankings]);

  const getChallengesForTab = (tabId: string): Challenge[] => {
    const map: Record<string, Challenge[]> = {
      coding: codingChallenges,
      cyber: cyberChallenges,
      ai: aiChallenges,
      design: designChallenges,
      data: dataChallenges,
      infra: infraChallenges,
    };
    return map[tabId] || [];
  };

  const isChallengesLoading = (tabId: string): boolean => loadingChallenges[tabId] || false;
  const getChallengeError = (tabId: string): string | null => errorChallenges[tabId] || null;

  const renderChallengeCards = (tabId: string) => {
    const challenges = getChallengesForTab(tabId);
    const isLoading = isChallengesLoading(tabId);
    const err = getChallengeError(tabId);

    if (isLoading) return <Spinner />;
    if (err) return <ErrorState message={err} onRetry={() => loadChallenges(tabId)} />;
    if (challenges.length === 0) {
      return (
        <EmptyState
          icon={<Inbox size={28} />}
          title="No challenges available"
          description="There are no challenges in this category right now. Check back later."
        />
      );
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {challenges.map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>{challenge.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>{challenge.category}</div>
              </div>
              <span style={{
                background: difficultyColor[challenge.difficulty] + '20',
                color: difficultyColor[challenge.difficulty],
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                {challenge.difficulty}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-green)', fontSize: '13px' }}>
                <DollarSign size={14} /> {challenge.reward}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Users size={14} /> {challenge.participants}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Clock size={14} /> {challenge.timeLimit}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: 'var(--accent-blue)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: 'auto',
              }}
            >
              <Play size={16} /> Join Challenge
            </motion.button>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderProblemMarket = () => {
    if (loadingMarket) return <Spinner />;
    if (errorMarket) return <ErrorState message={errorMarket} onRetry={loadMarket} />;
    if (problemMarket.length === 0) {
      return (
        <EmptyState
          icon={<AlertTriangle size={28} />}
          title="No problems available"
          description="The problem market is currently empty. New problems will appear here as they are posted."
        />
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {problemMarket.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
              background: 'var(--bg-secondary)',
              border: `1px solid ${statusColor[item.status]}40`,
              borderLeft: `4px solid ${statusColor[item.status]}`,
              borderRadius: '12px',
              padding: '20px',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={18} style={{ color: statusColor[item.status] }} />
                <span style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>{item.problem}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Posted by: <span style={{ color: 'var(--text-primary)' }}>{item.company}</span> · {item.category}
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{
                  background: statusColor[item.status] + '20',
                  color: statusColor[item.status],
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  {item.status}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-green)', fontSize: '14px', fontWeight: 600 }}>
                  <DollarSign size={14} /> {item.reward}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <Clock size={14} /> {item.timeRemaining} left
                </span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: statusColor[item.status],
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Solve Now
            </motion.button>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderDuels = () => {
    if (loadingDuels) return <Spinner />;
    if (errorDuels) return <ErrorState message={errorDuels} onRetry={loadDuels} />;
    if (duels.length === 0) {
      return (
        <EmptyState
          icon={<Swords size={28} />}
          title="No duels available"
          description="There are no active duels right now. Check back later for new challenges."
        />
      );
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {duels.map((duel, index) => (
          <motion.div
            key={duel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, var(--accent-red), var(--accent-purple))',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--accent-purple)20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-purple)',
              }}>
                {duelIcons[duel.type] || <Swords size={24} />}
              </div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }}>{duel.type}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{duel.players.toLocaleString()} players</div>
              </div>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{duel.description}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Entry</div>
                  <div style={{ color: 'var(--accent-yellow)', fontSize: '16px', fontWeight: 600 }}>{duel.entryFee}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Prize</div>
                  <div style={{ color: 'var(--accent-green)', fontSize: '16px', fontWeight: 600 }}>{duel.prizePool}</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'var(--accent-red)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Swords size={16} /> Challenge
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderRankings = () => {
    if (loadingRankings) return <Spinner />;
    if (errorRankings) return <ErrorState message={errorRankings} onRetry={loadRankings} />;
    if (rankings.length === 0) {
      return (
        <EmptyState
          icon={<Trophy size={28} />}
          title="No rankings available"
          description="Rankings data is not available yet. Participate in challenges to appear on the leaderboard."
        />
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Global', 'Country', 'Regional', 'Monthly', 'All Time'].map(filter => (
            <button
              key={filter}
              onClick={() => setRankingFilter(filter)}
              style={{
                background: rankingFilter === filter ? 'var(--accent-purple)' : 'var(--bg-secondary)',
                color: rankingFilter === filter ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {filter}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rankings.map((user, index) => (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: '60px 1fr 120px 120px',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}>
                {user.rank === 1 ? <Crown size={20} style={{ color: '#f59e0b' }} /> :
                 user.rank === 2 ? <Medal size={20} style={{ color: '#94a3b8' }} /> :
                 user.rank === 3 ? <Medal size={20} style={{ color: '#cd7f32' }} /> :
                 <span style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: 600 }}>#{user.rank}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--accent-purple)20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-purple)',
                  fontSize: '14px',
                  fontWeight: 600,
                }}>
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600 }}>{user.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {user.country}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--accent-green)', fontSize: '16px', fontWeight: 600 }}>{user.score.toLocaleString()}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>points</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{user.challenges_completed}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>challenges</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderEnvironments = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
      {environments.map((env, index) => (
        <motion.div
          key={env.category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: env.color + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: env.color,
            }}>
              {env.icon}
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }}>{env.category}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {env.items.map(item => (
              <div
                key={item}
                style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{item}</span>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'coding':
      case 'cyber':
      case 'ai':
      case 'design':
      case 'data':
      case 'infra':
        return renderChallengeCards(activeTab);
      case 'market': return renderProblemMarket();
      case 'duels': return renderDuels();
      case 'rankings': return renderRankings();
      case 'envs': return renderEnvironments();
      default: return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '32px',
      maxWidth: '1400px',
      margin: '0 auto',
    }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '32px' }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '8px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-red), var(--accent-purple))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '20px',
            fontWeight: 700,
          }}>
            OM
          </div>
          <div>
            <h1 style={{
              color: 'var(--text-primary)',
              fontSize: '32px',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.5px',
            }}>
              OPENMAESTRO
            </h1>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '16px',
              margin: 0,
            }}>
              Global Challenge & Competition Platform
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex',
          gap: '24px',
          marginTop: '20px',
          flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-yellow)', fontSize: '14px', fontWeight: 500 }}>
            <Zap size={16} /> {formatNumber(headerStats.totalChallenges)} Active Challenges
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontSize: '14px', fontWeight: 500 }}>
            <Users size={16} /> {formatNumber(headerStats.totalCompetitors)} Competitors
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontSize: '14px', fontWeight: 500 }}>
            <DollarSign size={16} /> ${formatNumber(headerStats.totalRewards)} Total Rewards
          </span>
        </div>
      </motion.div>

      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '28px',
        overflowX: 'auto',
        paddingBottom: '8px',
        flexWrap: 'wrap',
      }}>
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--accent-purple)' : 'var(--bg-secondary)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${activeTab === tab.id ? 'var(--accent-purple)' : 'var(--border)'}`,
              borderRadius: '10px',
              padding: '10px 18px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon}
            {tab.label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OpenMaestroPage;
