import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code2, Shield, Brain, Palette, Database, Server,
  AlertTriangle, Swords, Trophy, Terminal,
  Clock, Users, DollarSign, Target, Zap, Lock,
  Globe, MapPin, Calendar, Star, ChevronRight,
  Play, Trophy as TrophyIcon, Crown, Medal
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
  icon: React.ReactNode;
  players: number;
  entryFee: string;
  prizePool: string;
  description: string;
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

const codingChallenges: Challenge[] = [
  { id: 1, title: 'RESTful API Design', category: 'API', difficulty: 'Medium', reward: '$250', participants: 128, timeLimit: '4h' },
  { id: 2, title: 'Real-time Dashboard', category: 'Dashboard', difficulty: 'Hard', reward: '$500', participants: 89, timeLimit: '8h' },
  { id: 3, title: 'Fix Memory Leak', category: 'Bug Fix', difficulty: 'Medium', reward: '$150', participants: 203, timeLimit: '2h' },
  { id: 4, title: 'Optimize SQL Queries', category: 'Database', difficulty: 'Hard', reward: '$350', participants: 67, timeLimit: '5h' },
  { id: 5, title: 'Concurrent Web Server', category: 'Rust', difficulty: 'Hard', reward: '$600', participants: 45, timeLimit: '10h' },
  { id: 6, title: 'Component Library', category: 'React', difficulty: 'Medium', reward: '$300', participants: 156, timeLimit: '6h' },
  { id: 7, title: 'Type-safe Forms', category: 'TypeScript', difficulty: 'Easy', reward: '$100', participants: 312, timeLimit: '2h' },
  { id: 8, title: 'WebSocket Server', category: 'NodeJS', difficulty: 'Medium', reward: '$200', participants: 178, timeLimit: '4h' },
  { id: 9, title: 'ERC-721 Marketplace', category: 'Blockchain', difficulty: 'Hard', reward: '$800', participants: 34, timeLimit: '12h' },
  { id: 10, title: 'DeFi Staking Contract', category: 'Smart Contract', difficulty: 'Hard', reward: '$750', participants: 52, timeLimit: '10h' },
  { id: 11, title: 'GraphQL Gateway', category: 'API', difficulty: 'Medium', reward: '$275', participants: 98, timeLimit: '5h' },
  { id: 12, title: 'CLI Task Runner', category: 'NodeJS', difficulty: 'Easy', reward: '$125', participants: 245, timeLimit: '3h' },
];

const cyberChallenges: Challenge[] = [
  { id: 1, title: 'Web Exploitation CTF', category: 'CTF', difficulty: 'Medium', reward: '$300', participants: 234, timeLimit: '6h' },
  { id: 2, title: 'Binary Crackme', category: 'Reverse Engineering', difficulty: 'Hard', reward: '$450', participants: 87, timeLimit: '8h' },
  { id: 3, title: 'Analyze Malware Sample', category: 'Malware Analysis', difficulty: 'Hard', reward: '$500', participants: 56, timeLimit: '10h' },
  { id: 4, title: 'OSINT Investigation', category: 'OSINT', difficulty: 'Medium', reward: '$200', participants: 178, timeLimit: '4h' },
  { id: 5, title: 'Memory Forensics', category: 'Forensics', difficulty: 'Hard', reward: '$400', participants: 67, timeLimit: '6h' },
  { id: 6, title: 'Packet Analysis', category: 'Network Security', difficulty: 'Medium', reward: '$250', participants: 145, timeLimit: '5h' },
  { id: 7, title: 'Web App Pentest', category: 'Pen Testing', difficulty: 'Medium', reward: '$350', participants: 112, timeLimit: '7h' },
  { id: 8, title: 'RSA Challenge', category: 'Cryptography', difficulty: 'Hard', reward: '$550', participants: 43, timeLimit: '8h' },
  { id: 9, title: 'APT Detection', category: 'Threat Hunting', difficulty: 'Hard', reward: '$600', participants: 38, timeLimit: '12h' },
  { id: 10, title: 'Incident Response', category: 'Incident Response', difficulty: 'Medium', reward: '$300', participants: 89, timeLimit: '4h' },
  { id: 11, title: 'Steganography Puzzle', category: 'Forensics', difficulty: 'Easy', reward: '$150', participants: 267, timeLimit: '3h' },
  { id: 12, title: 'Buffer Overflow', category: 'Reverse Engineering', difficulty: 'Hard', reward: '$475', participants: 54, timeLimit: '6h' },
];

const aiChallenges: Challenge[] = [
  { id: 1, title: 'Customer Service Bot', category: 'Chatbot', difficulty: 'Medium', reward: '$300', participants: 156, timeLimit: '6h' },
  { id: 2, title: 'Fine-tune LLaMA', category: 'Fine Tune Model', difficulty: 'Hard', reward: '$500', participants: 78, timeLimit: '10h' },
  { id: 3, title: 'Prompt Engineering', category: 'Prompt Engineering', difficulty: 'Easy', reward: '$150', participants: 345, timeLimit: '3h' },
  { id: 4, title: 'Autonomous Agent', category: 'AI Agent', difficulty: 'Hard', reward: '$600', participants: 45, timeLimit: '12h' },
  { id: 5, title: 'Workflow Automation', category: 'AI Automation', difficulty: 'Medium', reward: '$250', participants: 189, timeLimit: '5h' },
  { id: 6, title: 'RAG Pipeline', category: 'RAG Systems', difficulty: 'Hard', reward: '$450', participants: 67, timeLimit: '8h' },
  { id: 7, title: 'Object Detection', category: 'Computer Vision', difficulty: 'Hard', reward: '$550', participants: 54, timeLimit: '10h' },
  { id: 8, title: 'Speech-to-Text', category: 'Speech Recognition', difficulty: 'Medium', reward: '$350', participants: 98, timeLimit: '7h' },
  { id: 9, title: 'Image Classifier', category: 'Computer Vision', difficulty: 'Medium', reward: '$275', participants: 123, timeLimit: '5h' },
  { id: 10, title: 'Sentiment Analyzer', category: 'NLP', difficulty: 'Easy', reward: '$175', participants: 234, timeLimit: '3h' },
  { id: 11, title: 'Multi-Agent System', category: 'AI Agent', difficulty: 'Hard', reward: '$700', participants: 34, timeLimit: '14h' },
  { id: 12, title: 'Embeddings Search', category: 'RAG Systems', difficulty: 'Medium', reward: '$300', participants: 87, timeLimit: '6h' },
];

const designChallenges: Challenge[] = [
  { id: 1, title: 'Tech Startup Logo', category: 'Logo', difficulty: 'Medium', reward: '$200', participants: 234, timeLimit: '4h' },
  { id: 2, title: 'Mobile App UI Kit', category: 'UI', difficulty: 'Hard', reward: '$450', participants: 89, timeLimit: '8h' },
  { id: 3, title: 'E-commerce UX Audit', category: 'UX', difficulty: 'Medium', reward: '$300', participants: 112, timeLimit: '6h' },
  { id: 4, title: 'SaaS Dashboard', category: 'App', difficulty: 'Hard', reward: '$500', participants: 67, timeLimit: '10h' },
  { id: 5, title: 'Product Visualization', category: '3D Modeling', difficulty: 'Hard', reward: '$600', participants: 34, timeLimit: '12h' },
  { id: 6, title: 'Logo Animation', category: 'Animation', difficulty: 'Medium', reward: '$250', participants: 145, timeLimit: '5h' },
  { id: 7, title: 'Brand Identity System', category: 'Branding', difficulty: 'Hard', reward: '$400', participants: 56, timeLimit: '8h' },
  { id: 8, title: 'Product Design Sprint', category: 'Product Design', difficulty: 'Medium', reward: '$350', participants: 78, timeLimit: '7h' },
  { id: 9, title: 'Icon Set Creation', category: 'UI', difficulty: 'Easy', reward: '$150', participants: 289, timeLimit: '3h' },
  { id: 10, title: 'Landing Page Redesign', category: 'UX', difficulty: 'Medium', reward: '$225', participants: 167, timeLimit: '5h' },
  { id: 11, title: 'Motion Graphics', category: 'Animation', difficulty: 'Hard', reward: '$500', participants: 43, timeLimit: '9h' },
  { id: 12, title: 'Mobile App Mockup', category: 'App', difficulty: 'Easy', reward: '$175', participants: 198, timeLimit: '4h' },
];

const dataChallenges: Challenge[] = [
  { id: 1, title: 'Clean Messy Dataset', category: 'Data Cleaning', difficulty: 'Medium', reward: '$200', participants: 189, timeLimit: '5h' },
  { id: 2, title: 'Sales Dashboard', category: 'Visualization', difficulty: 'Medium', reward: '$275', participants: 134, timeLimit: '6h' },
  { id: 3, title: 'Customer Analytics', category: 'Analytics', difficulty: 'Hard', reward: '$400', participants: 67, timeLimit: '8h' },
  { id: 4, title: 'Predictive Model', category: 'Machine Learning', difficulty: 'Hard', reward: '$550', participants: 45, timeLimit: '10h' },
  { id: 5, title: 'Demand Forecasting', category: 'Forecasting', difficulty: 'Medium', reward: '$300', participants: 89, timeLimit: '7h' },
  { id: 6, title: 'Market Research', category: 'Research', difficulty: 'Medium', reward: '$225', participants: 156, timeLimit: '5h' },
  { id: 7, title: 'Time Series Analysis', category: 'Machine Learning', difficulty: 'Hard', reward: '$450', participants: 56, timeLimit: '9h' },
  { id: 8, title: 'AB Test Analysis', category: 'Analytics', difficulty: 'Easy', reward: '$150', participants: 234, timeLimit: '3h' },
  { id: 9, title: 'Data Pipeline Build', category: 'Data Cleaning', difficulty: 'Hard', reward: '$500', participants: 43, timeLimit: '10h' },
  { id: 10, title: 'Geospatial Viz', category: 'Visualization', difficulty: 'Medium', reward: '$275', participants: 112, timeLimit: '6h' },
  { id: 11, title: 'Churn Prediction', category: 'Machine Learning', difficulty: 'Medium', reward: '$350', participants: 78, timeLimit: '7h' },
  { id: 12, title: 'Report Automation', category: 'Analytics', difficulty: 'Easy', reward: '$125', participants: 289, timeLimit: '3h' },
];

const infraChallenges: Challenge[] = [
  { id: 1, title: 'Restore Web Server', category: 'Server Recovery', difficulty: 'Hard', reward: '$500', participants: 56, timeLimit: '4h' },
  { id: 2, title: 'Database Restore', category: 'Database Recovery', difficulty: 'Hard', reward: '$600', participants: 34, timeLimit: '6h' },
  { id: 3, title: 'Speed Optimization', category: 'Site Optimization', difficulty: 'Medium', reward: '$300', participants: 123, timeLimit: '5h' },
  { id: 4, title: 'Load Balancer Setup', category: 'Load Balancing', difficulty: 'Medium', reward: '$350', participants: 89, timeLimit: '6h' },
  { id: 5, title: 'K8s Cluster Deploy', category: 'Kubernetes', difficulty: 'Hard', reward: '$550', participants: 45, timeLimit: '8h' },
  { id: 6, title: 'Docker Compose Stack', category: 'Docker', difficulty: 'Medium', reward: '$250', participants: 167, timeLimit: '4h' },
  { id: 7, title: 'Linux Server Hardening', category: 'Linux Admin', difficulty: 'Medium', reward: '$300', participants: 98, timeLimit: '5h' },
  { id: 8, title: 'CI/CD Pipeline', category: 'Docker', difficulty: 'Medium', reward: '$275', participants: 134, timeLimit: '5h' },
  { id: 9, title: 'Disaster Recovery', category: 'Server Recovery', difficulty: 'Hard', reward: '$700', participants: 28, timeLimit: '10h' },
  { id: 10, title: 'K8s Service Mesh', category: 'Kubernetes', difficulty: 'Hard', reward: '$600', participants: 34, timeLimit: '9h' },
  { id: 11, title: 'Nginx Configuration', category: 'Linux Admin', difficulty: 'Easy', reward: '$150', participants: 245, timeLimit: '3h' },
  { id: 12, title: 'Auto-scaling Setup', category: 'Load Balancing', difficulty: 'Hard', reward: '$450', participants: 56, timeLimit: '7h' },
];

const problemMarket: ProblemMarketItem[] = [
  { id: 1, company: 'FinTech Corp', problem: 'Payment processing downtime - critical', reward: '$1,000', status: 'Critical', timeRemaining: '2h 15m', category: 'Backend' },
  { id: 2, company: 'HealthTech Inc', problem: 'Patient data sync failure', reward: '$750', status: 'Urgent', timeRemaining: '4h 30m', category: 'Database' },
  { id: 3, company: 'E-Shop Global', problem: 'Checkout cart bug - losing sales', reward: '$500', status: 'Urgent', timeRemaining: '6h', category: 'Frontend' },
  { id: 4, company: 'CryptoWallet', problem: 'Transaction validation stuck', reward: '$1,000', status: 'Critical', timeRemaining: '1h 45m', category: 'Blockchain' },
  { id: 5, company: 'SaaS Platform', problem: 'API rate limiting not working', reward: '$400', status: 'Open', timeRemaining: '12h', category: 'API' },
  { id: 6, company: 'GameStudio', problem: 'Multiplayer latency issues', reward: '$600', status: 'Urgent', timeRemaining: '5h', category: 'Networking' },
  { id: 7, company: 'DataLake Corp', problem: 'ETL pipeline corrupted', reward: '$800', status: 'Critical', timeRemaining: '3h', category: 'Data' },
  { id: 8, company: 'MobileFirst', problem: 'iOS crash on startup', reward: '$350', status: 'Open', timeRemaining: '18h', category: 'Mobile' },
  { id: 9, company: 'CloudHost', problem: 'Server memory leak', reward: '$500', status: 'Urgent', timeRemaining: '7h', category: 'Infrastructure' },
  { id: 10, company: 'AI Startup', problem: 'Model inference too slow', reward: '$450', status: 'Open', timeRemaining: '24h', category: 'AI/ML' },
];

const duels: DuelItem[] = [
  { id: 1, type: 'Coding Duel', icon: <Code2 size={24} />, players: 1247, entryFee: '$5', prizePool: '$10', description: 'Race to solve coding problems. First to finish wins.' },
  { id: 2, type: 'Chess Duel', icon: <Target size={24} />, players: 856, entryFee: '$5', prizePool: '$10', description: 'Classic chess with time controls. Best of 3 games.' },
  { id: 3, type: 'AI Duel', icon: <Brain size={24} />, players: 623, entryFee: '$5', prizePool: '$10', description: 'Build the best AI model for a given task.' },
  { id: 4, type: 'Security Duel', icon: <Lock size={24} />, players: 445, entryFee: '$5', prizePool: '$10', description: 'Hack and defend in this cyber battle.' },
  { id: 5, type: 'Design Duel', icon: <Palette size={24} />, players: 389, entryFee: '$5', prizePool: '$10', description: 'Create the best design in limited time.' },
];

const rankings = [
  { rank: 1, name: 'Sarah Chen', country: 'US', score: 12450, challenges: 89, avatar: 'SC' },
  { rank: 2, name: 'Akira Tanaka', country: 'JP', score: 11890, challenges: 76, avatar: 'AT' },
  { rank: 3, name: 'Pierre Dupont', country: 'FR', score: 11230, challenges: 82, avatar: 'PD' },
  { rank: 4, name: 'Maria Garcia', country: 'ES', score: 10870, challenges: 71, avatar: 'MG' },
  { rank: 5, name: 'Alex Petrov', country: 'RU', score: 10450, challenges: 68, avatar: 'AP' },
  { rank: 6, name: 'Priya Sharma', country: 'IN', score: 10120, challenges: 65, avatar: 'PS' },
  { rank: 7, name: 'John Wilson', country: 'UK', score: 9890, challenges: 62, avatar: 'JW' },
  { rank: 8, name: 'Lisa Mueller', country: 'DE', score: 9560, challenges: 59, avatar: 'LM' },
  { rank: 9, name: 'Carlos Ruiz', country: 'MX', score: 9230, challenges: 55, avatar: 'CR' },
  { rank: 10, name: 'Emma Johnson', country: 'AU', score: 8970, challenges: 52, avatar: 'EJ' },
];

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

const OpenMaestroPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('coding');
  const [rankingFilter, setRankingFilter] = useState('Global');

  const renderChallengeCards = (challenges: Challenge[]) => (
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

  const renderProblemMarket = () => (
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

  const renderDuels = () => (
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
              {duel.icon}
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

  const renderRankings = () => (
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
                {user.avatar}
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
              <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{user.challenges}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>challenges</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

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
      case 'coding': return renderChallengeCards(codingChallenges);
      case 'cyber': return renderChallengeCards(cyberChallenges);
      case 'ai': return renderChallengeCards(aiChallenges);
      case 'design': return renderChallengeCards(designChallenges);
      case 'data': return renderChallengeCards(dataChallenges);
      case 'infra': return renderChallengeCards(infraChallenges);
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
        }}>
          {[
            { icon: <Zap size={16} />, label: '12,450 Active Challenges', color: 'var(--accent-yellow)' },
            { icon: <Users size={16} />, label: '89,234 Competitors', color: 'var(--accent-blue)' },
            { icon: <DollarSign size={16} />, label: '$2.4M Total Rewards', color: 'var(--accent-green)' },
          ].map(stat => (
            <div key={stat.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: stat.color,
              fontSize: '14px',
              fontWeight: 500,
            }}>
              {stat.icon} {stat.label}
            </div>
          ))}
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

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default OpenMaestroPage;
