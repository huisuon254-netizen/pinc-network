import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Briefcase,
  Wallet,
  ChevronDown,
  ChevronRight,
  Clock,
  Users,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  FileText,
  Star,
  ArrowUpRight,
  Download,
  Filter,
  Tag,
  Calendar,
  Loader2,
  Inbox,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'dashboard' | 'browse' | 'myjobs' | 'earnings';

interface Job {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  category: string;
  subcategory: string;
  skills: string[];
  posted_at: string;
  applicants: number;
  client: string;
  status: 'open' | 'in_progress' | 'completed' | 'pending_review';
  deadline: string;
  amount: number;
}

interface JobsStats {
  active_jobs: number;
  pending_applications: number;
  completed_jobs: number;
  total_earnings: number;
  success_rate: number;
}

interface EarningsData {
  total_earned: number;
  pending_amount: number;
  withdrawn_amount: number;
  history: { id: string; amount: number; date: string; source: string }[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_JOBS: Job[] = [
  {
    id: 'job_001',
    title: 'Build a React Dashboard for Analytics',
    description: 'Need a responsive analytics dashboard built with React and TypeScript. Must include charts, data tables, and real-time updates.',
    budget_min: 500,
    budget_max: 1200,
    category: 'Technology',
    subcategory: 'Web Development',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Chart.js'],
    posted_at: '2026-06-20T10:00:00Z',
    applicants: 8,
    client: 'TechCorp',
    status: 'open',
    deadline: '',
    amount: 0,
  },
  {
    id: 'job_002',
    title: 'Mobile App UI/UX Redesign',
    description: 'Complete redesign of our fintech mobile app. Need wireframes, prototypes, and final designs in Figma.',
    budget_min: 800,
    budget_max: 2000,
    category: 'Design',
    subcategory: 'UI/UX Design',
    skills: ['Figma', 'UI Design', 'Prototyping', 'Mobile Design'],
    posted_at: '2026-06-21T14:30:00Z',
    applicants: 12,
    client: 'FinanceApp Co',
    status: 'open',
    deadline: '',
    amount: 0,
  },
  {
    id: 'job_003',
    title: 'Technical Blog Content Writing',
    description: 'Write 10 SEO-optimized blog posts about blockchain technology. Each post 1500-2000 words.',
    budget_min: 200,
    budget_max: 500,
    category: 'Content',
    subcategory: 'Writing',
    skills: ['Technical Writing', 'SEO', 'Blockchain', 'Content Strategy'],
    posted_at: '2026-06-22T09:15:00Z',
    applicants: 15,
    client: 'CryptoMedia',
    status: 'open',
    deadline: '',
    amount: 0,
  },
  {
    id: 'job_004',
    title: 'Smart Contract Audit',
    description: 'Audit our Solidity smart contracts for vulnerabilities. Deliverable is a detailed PDF report.',
    budget_min: 1500,
    budget_max: 3000,
    category: 'Technology',
    subcategory: 'AI Engineering',
    skills: ['Solidity', 'Smart Contracts', 'Security', 'Auditing'],
    posted_at: '2026-06-19T16:00:00Z',
    applicants: 5,
    client: 'DeFi Protocol',
    status: 'open',
    deadline: '',
    amount: 0,
  },
  {
    id: 'job_005',
    title: 'Logo and Brand Identity Package',
    description: 'Create a complete brand identity including logo, color palette, typography guide, and business cards.',
    budget_min: 300,
    budget_max: 800,
    category: 'Design',
    subcategory: 'Graphic Design',
    skills: ['Logo Design', 'Branding', 'Illustrator', 'Photoshop'],
    posted_at: '2026-06-23T08:00:00Z',
    applicants: 20,
    client: 'StartupX',
    status: 'open',
    deadline: '',
    amount: 0,
  },
  {
    id: 'job_006',
    title: 'Data Collection and Analysis Report',
    description: 'Collect market data for the renewable energy sector and produce a comprehensive analysis report.',
    budget_min: 400,
    budget_max: 900,
    category: 'Research',
    subcategory: 'Data Collection',
    skills: ['Data Analysis', 'Python', 'Excel', 'Research'],
    posted_at: '2026-06-20T12:45:00Z',
    applicants: 7,
    client: 'GreenTech',
    status: 'open',
    deadline: '',
    amount: 0,
  },
  {
    id: 'job_007',
    title: 'Online Course Creation — React Fundamentals',
    description: 'Create a 10-module video course on React fundamentals. Include scripts, slides, and coding exercises.',
    budget_min: 1000,
    budget_max: 2500,
    category: 'Education',
    subcategory: 'Course Creation',
    skills: ['React', 'Video Production', 'Curriculum Design', 'Teaching'],
    posted_at: '2026-06-18T11:30:00Z',
    applicants: 4,
    client: 'LearnHub',
    status: 'open',
    deadline: '',
    amount: 0,
  },
  {
    id: 'job_008',
    title: 'YouTube Video Editing — Tech Reviews',
    description: 'Edit 8 tech review videos per month. Must include motion graphics, color grading, and sound design.',
    budget_min: 600,
    budget_max: 1500,
    category: 'Media',
    subcategory: 'Video Editing',
    skills: ['Premiere Pro', 'After Effects', 'Color Grading', 'Sound Design'],
    posted_at: '2026-06-21T17:00:00Z',
    applicants: 11,
    client: 'TechReviewer',
    status: 'open',
    deadline: '',
    amount: 0,
  },
  {
    id: 'job_009',
    title: 'Sales Funnel Optimization',
    description: 'Analyze and optimize our existing sales funnel. Expected outcome: 20% conversion improvement.',
    budget_min: 350,
    budget_max: 700,
    category: 'Business',
    subcategory: 'Sales',
    skills: ['Sales Strategy', 'Analytics', 'A/B Testing', 'CRM'],
    posted_at: '2026-06-22T13:20:00Z',
    applicants: 6,
    client: 'SalesForce Pro',
    status: 'open',
    deadline: '',
    amount: 0,
  },
  {
    id: 'job_010',
    title: 'Document Translation (English → Spanish)',
    description: 'Translate 20,000 words of legal documentation from English to Spanish. Must be native-level accuracy.',
    budget_min: 250,
    budget_max: 600,
    category: 'Content',
    subcategory: 'Translation',
    skills: ['Translation', 'Legal', 'English', 'Spanish'],
    posted_at: '2026-06-23T07:45:00Z',
    applicants: 18,
    client: 'LegalGlobal',
    status: 'open',
    deadline: '',
    amount: 0,
  },
];

const MOCK_MY_JOBS: Job[] = [
  {
    id: 'myjob_001',
    title: 'Cloud Infrastructure Migration',
    description: 'Migrate on-premise servers to AWS. Includes CI/CD pipeline setup.',
    budget_min: 2000,
    budget_max: 4000,
    category: 'Technology',
    subcategory: 'Cloud Engineering',
    skills: ['AWS', 'Docker', 'Terraform', 'CI/CD'],
    posted_at: '2026-06-01T10:00:00Z',
    applicants: 0,
    client: 'EnterpriseCo',
    status: 'in_progress',
    deadline: '2026-07-15',
    amount: 3200,
  },
  {
    id: 'myjob_002',
    title: 'Social Media Marketing Campaign',
    description: 'Manage social media ads across Instagram, Twitter, and TikTok for 3 months.',
    budget_min: 800,
    budget_max: 1800,
    category: 'Business',
    subcategory: 'Marketing',
    skills: ['Social Media', 'Ads', 'Copywriting', 'Analytics'],
    posted_at: '2026-06-10T09:00:00Z',
    applicants: 0,
    client: 'BrandBoost',
    status: 'pending_review',
    deadline: '2026-06-30',
    amount: 1500,
  },
  {
    id: 'myjob_003',
    title: 'Customer Support Chatbot Development',
    description: 'Build an AI-powered chatbot for customer support integration with Zendesk.',
    budget_min: 1200,
    budget_max: 2800,
    category: 'Business',
    subcategory: 'Customer Support',
    skills: ['Python', 'NLP', 'Chatbot', 'Zendesk API'],
    posted_at: '2026-05-28T14:00:00Z',
    applicants: 0,
    client: 'ServiceNow',
    status: 'completed',
    deadline: '2026-06-15',
    amount: 2400,
  },
  {
    id: 'myjob_004',
    title: 'Mobile App Development — iOS',
    description: 'Build a fitness tracking app for iOS using Swift and HealthKit.',
    budget_min: 1500,
    budget_max: 3500,
    category: 'Technology',
    subcategory: 'Mobile Development',
    skills: ['Swift', 'iOS', 'HealthKit', 'Core Data'],
    posted_at: '2026-05-20T11:00:00Z',
    applicants: 0,
    client: 'FitTrack',
    status: 'completed',
    deadline: '2026-06-01',
    amount: 3000,
  },
  {
    id: 'myjob_005',
    title: 'Survey Design and Data Analysis',
    description: 'Design and distribute a customer satisfaction survey, then analyze results.',
    budget_min: 300,
    budget_max: 700,
    category: 'Research',
    subcategory: 'Surveys',
    skills: ['Survey Design', 'Statistics', 'SPSS', 'Reporting'],
    posted_at: '2026-06-05T08:30:00Z',
    applicants: 0,
    client: 'InsightCo',
    status: 'pending_review',
    deadline: '2026-06-25',
    amount: 550,
  },
];

const MOCK_EARNINGS: EarningsData = {
  total_earned: 8450,
  pending_amount: 2050,
  withdrawn_amount: 6400,
  history: [
    { id: 'txn_001', amount: 3000, date: '2026-06-01', source: 'FitTrack — Mobile App' },
    { id: 'txn_002', amount: 2400, date: '2026-05-15', source: 'ServiceNow — Chatbot' },
    { id: 'txn_003', amount: 1500, date: '2026-05-10', source: 'BrandBoost — Marketing' },
    { id: 'txn_004', amount: 800, date: '2026-04-28', source: 'DataViz — Dashboard' },
    { id: 'txn_005', amount: 750, date: '2026-04-15', source: 'LogoCraft — Branding' },
  ],
};

const JOB_CATEGORIES = [
  {
    name: 'Technology',
    subcategories: ['Software Development', 'Web Development', 'Mobile Development', 'AI Engineering', 'Cloud Engineering'],
  },
  {
    name: 'Design',
    subcategories: ['UI/UX Design', 'Graphic Design', 'Animation'],
  },
  {
    name: 'Content',
    subcategories: ['Writing', 'Editing', 'Translation'],
  },
  {
    name: 'Business',
    subcategories: ['Sales', 'Marketing', 'Customer Support'],
  },
  {
    name: 'Research',
    subcategories: ['Data Collection', 'Surveys', 'Analysis'],
  },
  {
    name: 'Education',
    subcategories: ['Tutoring', 'Course Creation'],
  },
  {
    name: 'Media',
    subcategories: ['Video Editing', 'Audio Production'],
  },
];

// ---------------------------------------------------------------------------
// Tauri invoke wrappers
// ---------------------------------------------------------------------------

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch {
    throw new Error(`TAURI_UNAVAILABLE: ${cmd}`);
  }
}

function isTauriUnavailable(err: unknown): boolean {
  return err instanceof Error && err.message.startsWith('TAURI_UNAVAILABLE');
}

async function fetchJobs(): Promise<Job[]> {
  try {
    return await tauriInvoke<Job[]>('cmd_get_jobs');
  } catch (err) {
    if (isTauriUnavailable(err)) return MOCK_JOBS;
    throw err;
  }
}

async function fetchMyJobs(): Promise<Job[]> {
  try {
    return await tauriInvoke<Job[]>('cmd_get_my_jobs');
  } catch (err) {
    if (isTauriUnavailable(err)) return MOCK_MY_JOBS;
    throw err;
  }
}

async function fetchStats(): Promise<JobsStats> {
  try {
    return await tauriInvoke<JobsStats>('cmd_get_jobs_stats');
  } catch (err) {
    if (isTauriUnavailable(err)) {
      return {
        active_jobs: 12,
        pending_applications: 5,
        completed_jobs: 28,
        total_earnings: 8450,
        success_rate: 94.2,
      };
    }
    throw err;
  }
}

async function fetchEarnings(): Promise<EarningsData> {
  try {
    return await tauriInvoke<EarningsData>('cmd_get_jobs_earnings');
  } catch (err) {
    if (isTauriUnavailable(err)) return MOCK_EARNINGS;
    throw err;
  }
}

async function applyToJob(jobId: string, proposal: string): Promise<{ success: boolean; message: string; application_id: string }> {
  try {
    return await tauriInvoke<{ success: boolean; message: string; application_id: string }>('cmd_jobs_apply_job', { jobId, proposal });
  } catch (err) {
    if (isTauriUnavailable(err)) {
      return { success: true, message: 'Application submitted successfully!', application_id: 'mock_app_' + Date.now() };
    }
    throw err;
  }
}

async function createJob(data: {
  title: string;
  category: string;
  subcategory: string;
  budgetMin: number;
  budgetMax: number;
  skills: string[];
  description: string;
  deadline: string;
}): Promise<{ job_id: string; status: string }> {
  try {
    return await tauriInvoke<{ job_id: string; status: string }>('cmd_jobs_create_job', {
      title: data.title,
      category: data.category,
      subcategory: data.subcategory,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      skills: data.skills,
      description: data.description,
      deadline: data.deadline,
    });
  } catch (err) {
    if (isTauriUnavailable(err)) {
      return { job_id: 'mock_job_' + Date.now(), status: 'open' };
    }
    throw err;
  }
}

async function acceptApplication(applicationId: string): Promise<{ accepted: boolean }> {
  try {
    return await tauriInvoke<{ accepted: boolean }>('cmd_jobs_accept_application', { applicationId });
  } catch (err) {
    if (isTauriUnavailable(err)) {
      return { accepted: true };
    }
    throw err;
  }
}

async function rejectApplication(applicationId: string): Promise<{ rejected: boolean }> {
  try {
    return await tauriInvoke<{ rejected: boolean }>('cmd_jobs_reject_application', { applicationId });
  } catch (err) {
    if (isTauriUnavailable(err)) {
      return { rejected: true };
    }
    throw err;
  }
}

async function completeJob(jobId: string): Promise<{ completed: boolean }> {
  try {
    return await tauriInvoke<{ completed: boolean }>('cmd_jobs_complete_job', { jobId });
  } catch (err) {
    if (isTauriUnavailable(err)) {
      return { completed: true };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPINC(value: number): string {
  return `${value.toFixed(2)} PINC`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

function statusColor(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'open':
      return { bg: 'rgba(57,255,20,0.1)', text: '#39ff14', border: 'rgba(57,255,20,0.3)' };
    case 'in_progress':
      return { bg: 'rgba(0,212,255,0.1)', text: '#00d4ff', border: 'rgba(0,212,255,0.3)' };
    case 'completed':
      return { bg: 'rgba(168,85,247,0.1)', text: '#a855f7', border: 'rgba(168,85,247,0.3)' };
    case 'pending_review':
      return { bg: 'rgba(255,230,0,0.1)', text: '#ffe600', border: 'rgba(255,230,0,0.3)' };
    default:
      return { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.3)' };
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'open': return 'Open';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'pending_review': return 'Pending Review';
    default: return status;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={18} style={{ color: 'var(--electric-blue)' }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
    </motion.div>
  );
}

function JobCard({ job, onApply }: { job: Job; onApply: (id: string) => void }) {
  const sc = statusColor(job.status);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ borderColor: 'var(--border-bright)' }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
            {job.title}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {job.description}
          </p>
        </div>
        <span
          style={{
            background: sc.bg,
            color: sc.text,
            border: `1px solid ${sc.border}`,
            borderRadius: 3,
            padding: '2px 8px',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          {statusLabel(job.status)}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {job.skills.map((skill) => (
          <span
            key={skill}
            style={{
              background: 'rgba(0,212,255,0.08)',
              color: 'var(--electric-blue)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 3,
              padding: '1px 6px',
              fontSize: '0.65rem',
              fontWeight: 500,
            }}
          >
            {skill}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <DollarSign size={12} />
            {formatPINC(job.budget_min)} – {formatPINC(job.budget_max)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} />
            {timeAgo(job.posted_at)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={12} />
            {job.applicants} applicants
          </span>
        </div>
        {job.status === 'open' && (
          <button
            type="button"
            onClick={() => onApply(job.id)}
            className="pinc-btn"
            style={{ padding: '4px 12px', fontSize: '0.75rem' }}
          >
            Apply
          </button>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <Icon size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</p>
    </div>
  );
}

function CategorySection({ category, jobs, onApply }: { category: string; jobs: Job[]; onApply: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const catJobs = jobs.filter((j) => j.category === category);

  if (catJobs.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '0.6rem 1rem',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Briefcase size={16} style={{ color: 'var(--electric-blue)' }} />
        {category}
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {catJobs.length} job{catJobs.length !== 1 ? 's' : ''}
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, paddingLeft: 16 }}>
              {catJobs.map((job) => (
                <JobCard key={job.id} job={job} onApply={onApply} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MyJobRow({
  job,
  onAccept,
  onReject,
  onComplete,
}: {
  job: Job;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onComplete?: (id: string) => void;
}) {
  const sc = statusColor(job.status);
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{job.title}</h4>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Client: {job.client}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--neon-green)' }}>{formatPINC(job.amount)}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} />
          {job.deadline}
        </span>
        <span
          style={{
            background: sc.bg,
            color: sc.text,
            border: `1px solid ${sc.border}`,
            borderRadius: 3,
            padding: '2px 8px',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          {statusLabel(job.status)}
        </span>
        {job.status === 'pending_review' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => onAccept?.(job.id)}
              className="pinc-btn"
              style={{ padding: '3px 10px', fontSize: '0.7rem', background: 'rgba(57,255,20,0.15)', color: '#39ff14', border: '1px solid rgba(57,255,20,0.3)' }}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => onReject?.(job.id)}
              className="pinc-btn"
              style={{ padding: '3px 10px', fontSize: '0.7rem', background: 'rgba(255,34,85,0.15)', color: '#ff2255', border: '1px solid rgba(255,34,85,0.3)' }}
            >
              Reject
            </button>
          </div>
        )}
        {job.status === 'in_progress' && (
          <button
            type="button"
            onClick={() => onComplete?.(job.id)}
            className="pinc-btn"
            style={{ padding: '3px 10px', fontSize: '0.7rem', background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}
          >
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function JobsPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<JobsStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [applying, setApplying] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'technology',
    subcategory: '',
    budgetMin: '',
    budgetMax: '',
    skills: '',
    description: '',
    deadline: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [j, mj, s, e] = await Promise.all([fetchJobs(), fetchMyJobs(), fetchStats(), fetchEarnings()]);
      setJobs(j);
      setMyJobs(mj);
      setStats(s);
      setEarnings(e);
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredJobs = useMemo(() => {
    let result = jobs;
    if (filterCategory !== 'all') {
      result = result.filter((j) => j.category === filterCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return result;
  }, [jobs, search, filterCategory]);

  const activeJobs = useMemo(() => myJobs.filter((j) => j.status === 'in_progress'), [myJobs]);
  const pendingApps = useMemo(() => myJobs.filter((j) => j.status === 'pending_review'), [myJobs]);
  const completedJobs = useMemo(() => myJobs.filter((j) => j.status === 'completed'), [myJobs]);

  async function handleApply(jobId: string) {
    setApplying(jobId);
    setApplyMessage(null);
    try {
      const result = await applyToJob(jobId, 'I am interested in this job and have relevant experience.');
      setApplyMessage({ type: 'success', text: result.message });
      setTimeout(() => setApplyMessage(null), 3000);
    } catch (err) {
      setApplyMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to apply.' });
      setTimeout(() => setApplyMessage(null), 3000);
    } finally {
      setApplying(null);
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.subcategory.trim()) errors.subcategory = 'Subcategory is required';
    if (!form.budgetMin || parseFloat(form.budgetMin) <= 0) errors.budgetMin = 'Min budget must be > 0';
    if (!form.budgetMax || parseFloat(form.budgetMax) <= 0) errors.budgetMax = 'Max budget must be > 0';
    if (form.budgetMin && form.budgetMax && parseFloat(form.budgetMin) > parseFloat(form.budgetMax)) {
      errors.budgetMax = 'Max must be >= Min';
    }
    if (!form.skills.trim()) errors.skills = 'At least one skill required';
    if (!form.description.trim()) errors.description = 'Description is required';
    if (!form.deadline) errors.deadline = 'Deadline is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleCreateJob() {
    if (!validateForm()) return;
    setCreating(true);
    setCreateMessage(null);
    try {
      await createJob({
        title: form.title.trim(),
        category: form.category,
        subcategory: form.subcategory.trim(),
        budgetMin: parseFloat(form.budgetMin),
        budgetMax: parseFloat(form.budgetMax),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        description: form.description.trim(),
        deadline: new Date(form.deadline).toISOString(),
      });
      setCreateMessage({ type: 'success', text: 'Job posted successfully!' });
      setTimeout(() => {
        setCreateMessage(null);
        setShowCreateForm(false);
        setForm({ title: '', category: 'technology', subcategory: '', budgetMin: '', budgetMax: '', skills: '', description: '', deadline: '' });
        setFormErrors({});
        loadData();
      }, 1500);
    } catch (err) {
      setCreateMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create job.' });
      setTimeout(() => setCreateMessage(null), 3000);
    } finally {
      setCreating(false);
    }
  }

  async function handleAcceptApplication(jobId: string) {
    setActionLoading(jobId);
    try {
      await acceptApplication(jobId);
      setApplyMessage({ type: 'success', text: 'Application accepted!' });
      setTimeout(() => setApplyMessage(null), 3000);
      loadData();
    } catch (err) {
      setApplyMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed.' });
      setTimeout(() => setApplyMessage(null), 3000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectApplication(jobId: string) {
    setActionLoading(jobId);
    try {
      await rejectApplication(jobId);
      setApplyMessage({ type: 'success', text: 'Application rejected.' });
      setTimeout(() => setApplyMessage(null), 3000);
      loadData();
    } catch (err) {
      setApplyMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed.' });
      setTimeout(() => setApplyMessage(null), 3000);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCompleteJob(jobId: string) {
    setActionLoading(jobId);
    try {
      await completeJob(jobId);
      setApplyMessage({ type: 'success', text: 'Job marked complete!' });
      setTimeout(() => setApplyMessage(null), 3000);
      loadData();
    } catch (err) {
      setApplyMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed.' });
      setTimeout(() => setApplyMessage(null), 3000);
    } finally {
      setActionLoading(null);
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'browse', label: 'Browse Jobs', icon: Search },
    { key: 'myjobs', label: 'My Jobs', icon: Briefcase },
    { key: 'earnings', label: 'Earnings', icon: Wallet },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            <span style={{ color: 'var(--electric-blue)' }}>PINC</span> JOBS
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Remote Work Marketplace</p>
        </div>

        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: 2, marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {tabs.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--electric-blue)' : '2px solid transparent',
                  color: isActive ? 'var(--electric-blue)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 600 : 500,
                  marginBottom: -1,
                  transition: 'color 0.2s',
                }}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Apply message toast */}
        <AnimatePresence>
          {applyMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 1000,
                padding: '0.6rem 1rem',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 600,
                ...(applyMessage.type === 'success'
                  ? { background: 'rgba(57,255,20,0.15)', color: '#39ff14', border: '1px solid rgba(57,255,20,0.3)' }
                  : { background: 'rgba(255,34,85,0.15)', color: '#ff2255', border: '1px solid rgba(255,34,85,0.3)' }),
              }}
            >
              {applyMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Loader2 size={28} style={{ color: 'var(--electric-blue)', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading jobs...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {tab === 'dashboard' && stats && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                  <StatCard label="Active Jobs" value={String(stats.active_jobs)} icon={Briefcase} />
                  <StatCard label="Pending Applications" value={String(stats.pending_applications)} icon={FileText} />
                  <StatCard label="Completed Jobs" value={String(stats.completed_jobs)} icon={CheckCircle2} />
                  <StatCard label="Total Earnings" value={formatPINC(stats.total_earnings)} icon={DollarSign} />
                  <StatCard label="Success Rate" value={`${stats.success_rate}%`} icon={TrendingUp} />
                </div>

                {/* Quick overview */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '1.25rem',
                  }}
                >
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                    Quick Overview
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Recent Activity
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {myJobs.slice(0, 3).map((job) => (
                          <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(job.status).text, flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {job.title}
                            </span>
                            <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{statusLabel(job.status)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Top Categories
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {['Technology', 'Design', 'Business'].map((cat) => {
                          const count = jobs.filter((j) => j.category === cat).length;
                          return (
                            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
                              <Tag size={12} style={{ color: 'var(--electric-blue)', flexShrink: 0 }} />
                              <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{cat}</span>
                              <span style={{ color: 'var(--text-muted)' }}>{count} jobs</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Browse Jobs Tab */}
            {tab === 'browse' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Search & filters + Post button */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                      size={14}
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search jobs by title, skills, or description..."
                      className="pinc-input"
                      style={{ paddingLeft: 32 }}
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Filter
                      size={14}
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                    />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="pinc-input"
                      style={{ paddingLeft: 32, width: 180, appearance: 'none' }}
                    >
                      <option value="all">All Categories</option>
                      {JOB_CATEGORIES.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="pinc-btn"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Briefcase size={14} />
                    POST A JOB
                  </button>
                </div>

                {/* Create Job Form */}
                <AnimatePresence>
                  {showCreateForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden', marginBottom: 16 }}
                    >
                      <div
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '1.25rem',
                        }}
                      >
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Briefcase size={16} style={{ color: 'var(--electric-blue)' }} />
                          Post a New Job
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          {/* Title */}
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Job Title *</label>
                            <input
                              type="text"
                              value={form.title}
                              onChange={(e) => setForm({ ...form, title: e.target.value })}
                              placeholder="e.g., Build a React Dashboard"
                              className="pinc-input"
                              style={{ width: '100%' }}
                            />
                            {formErrors.title && <span style={{ fontSize: '0.65rem', color: '#ff2255', marginTop: 2 }}>{formErrors.title}</span>}
                          </div>
                          {/* Category */}
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Category *</label>
                            <select
                              value={form.category}
                              onChange={(e) => setForm({ ...form, category: e.target.value })}
                              className="pinc-input"
                              style={{ width: '100%' }}
                            >
                              {JOB_CATEGORIES.map((c) => (
                                <option key={c.name} value={c.name.toLowerCase()}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                          {/* Subcategory */}
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Subcategory *</label>
                            <input
                              type="text"
                              value={form.subcategory}
                              onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                              placeholder="e.g., Web Development"
                              className="pinc-input"
                              style={{ width: '100%' }}
                            />
                            {formErrors.subcategory && <span style={{ fontSize: '0.65rem', color: '#ff2255', marginTop: 2 }}>{formErrors.subcategory}</span>}
                          </div>
                          {/* Budget Min */}
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Budget Min (PINC) *</label>
                            <input
                              type="number"
                              value={form.budgetMin}
                              onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                              placeholder="0"
                              min="0"
                              step="10"
                              className="pinc-input"
                              style={{ width: '100%' }}
                            />
                            {formErrors.budgetMin && <span style={{ fontSize: '0.65rem', color: '#ff2255', marginTop: 2 }}>{formErrors.budgetMin}</span>}
                          </div>
                          {/* Budget Max */}
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Budget Max (PINC) *</label>
                            <input
                              type="number"
                              value={form.budgetMax}
                              onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                              placeholder="0"
                              min="0"
                              step="10"
                              className="pinc-input"
                              style={{ width: '100%' }}
                            />
                            {formErrors.budgetMax && <span style={{ fontSize: '0.65rem', color: '#ff2255', marginTop: 2 }}>{formErrors.budgetMax}</span>}
                          </div>
                          {/* Skills */}
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Skills Required * (comma-separated)</label>
                            <input
                              type="text"
                              value={form.skills}
                              onChange={(e) => setForm({ ...form, skills: e.target.value })}
                              placeholder="e.g., React, TypeScript, Tailwind CSS"
                              className="pinc-input"
                              style={{ width: '100%' }}
                            />
                            {formErrors.skills && <span style={{ fontSize: '0.65rem', color: '#ff2255', marginTop: 2 }}>{formErrors.skills}</span>}
                          </div>
                          {/* Description */}
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description *</label>
                            <textarea
                              value={form.description}
                              onChange={(e) => setForm({ ...form, description: e.target.value })}
                              placeholder="Describe the job requirements, deliverables, and any other details..."
                              rows={4}
                              className="pinc-input"
                              style={{ width: '100%', resize: 'vertical' }}
                            />
                            {formErrors.description && <span style={{ fontSize: '0.65rem', color: '#ff2255', marginTop: 2 }}>{formErrors.description}</span>}
                          </div>
                          {/* Deadline */}
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Deadline *</label>
                            <input
                              type="datetime-local"
                              value={form.deadline}
                              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                              className="pinc-input"
                              style={{ width: '100%' }}
                            />
                            {formErrors.deadline && <span style={{ fontSize: '0.65rem', color: '#ff2255', marginTop: 2 }}>{formErrors.deadline}</span>}
                          </div>
                        </div>
                        {/* Form message */}
                        {createMessage && (
                          <div
                            style={{
                              marginTop: 12,
                              padding: '0.5rem 0.75rem',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              ...(createMessage.type === 'success'
                                ? { background: 'rgba(57,255,20,0.15)', color: '#39ff14', border: '1px solid rgba(57,255,20,0.3)' }
                                : { background: 'rgba(255,34,85,0.15)', color: '#ff2255', border: '1px solid rgba(255,34,85,0.3)' }),
                            }}
                          >
                            {createMessage.text}
                          </div>
                        )}
                        {/* Form actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreateForm(false);
                              setFormErrors({});
                              setCreateMessage(null);
                            }}
                            className="pinc-btn"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', opacity: 0.7 }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateJob}
                            disabled={creating}
                            className="pinc-btn"
                            style={{ padding: '0.4rem 1.25rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            {creating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Briefcase size={14} />}
                            {creating ? 'Posting...' : 'Post Job'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                </div>

                {filteredJobs.length === 0 ? (
                  <EmptyState icon={Inbox} title="No jobs found" subtitle="Try adjusting your search or filters." />
                ) : (
                  <div>
                    {JOB_CATEGORIES.map((cat) => (
                      <CategorySection key={cat.name} category={cat.name} jobs={filteredJobs} onApply={handleApply} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* My Jobs Tab */}
            {tab === 'myjobs' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {myJobs.length === 0 ? (
                  <EmptyState icon={Briefcase} title="No jobs yet" subtitle="Browse available jobs and start working!" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Active Jobs */}
                    <section>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Briefcase size={14} style={{ color: 'var(--electric-blue)' }} />
                        Active Jobs ({activeJobs.length})
                      </h3>
                      {activeJobs.length === 0 ? (
                        <EmptyState icon={AlertCircle} title="No active jobs" subtitle="Accept a job to see it here." />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {activeJobs.map((job) => (
                            <MyJobRow
                              key={job.id}
                              job={job}
                              onComplete={handleCompleteJob}
                            />
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Pending Applications */}
                    <section>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={14} style={{ color: 'var(--neon-yellow)' }} />
                        Pending Applications ({pendingApps.length})
                      </h3>
                      {pendingApps.length === 0 ? (
                        <EmptyState icon={AlertCircle} title="No pending applications" subtitle="Apply to a job to see it here." />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {pendingApps.map((job) => (
                            <MyJobRow
                              key={job.id}
                              job={job}
                              onAccept={handleAcceptApplication}
                              onReject={handleRejectApplication}
                            />
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Completed Jobs */}
                    <section>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={14} style={{ color: 'var(--soft-purple)' }} />
                        Completed Jobs ({completedJobs.length})
                      </h3>
                      {completedJobs.length === 0 ? (
                        <EmptyState icon={AlertCircle} title="No completed jobs" subtitle="Finish a job to see it here." />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {completedJobs.map((job) => <MyJobRow key={job.id} job={job} />)}
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </motion.div>
            )}

            {/* Earnings Tab */}
            {tab === 'earnings' && earnings && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
                  <StatCard label="Total Earned" value={formatPINC(earnings.total_earned)} icon={DollarSign} />
                  <StatCard label="Pending" value={formatPINC(earnings.pending_amount)} icon={Clock} />
                  <StatCard label="Withdrawn" value={formatPINC(earnings.withdrawn_amount)} icon={Download} />
                </div>

                {/* Earnings history */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Star size={14} style={{ color: 'var(--electric-blue)' }} />
                      Earnings History
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Placeholder — full history coming soon</span>
                  </div>
                  {earnings.history.length === 0 ? (
                    <EmptyState icon={Inbox} title="No earnings yet" subtitle="Complete jobs to start earning." />
                  ) : (
                    <div>
                      {earnings.history.map((txn, i) => (
                        <div
                          key={txn.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.6rem 1rem',
                            borderBottom: i < earnings.history.length - 1 ? '1px solid var(--border)' : 'none',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ArrowUpRight size={14} style={{ color: 'var(--neon-green)' }} />
                            <div>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{txn.source}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: 8 }}>{txn.date}</span>
                            </div>
                          </div>
                          <span style={{ color: 'var(--neon-green)', fontWeight: 600 }}>+{formatPINC(txn.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
