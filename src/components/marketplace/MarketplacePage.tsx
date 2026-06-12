import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Clock, DollarSign, User, CheckCircle, AlertTriangle } from 'lucide-react';

type Tab = 'browse' | 'post' | 'mine';

interface Job {
  id: string; owner_id: string; title: string; description: string;
  skills_required: string[]; budget: number; currency: string;
  status: string; applicant_count: number; deadline: number | null;
  created_at: number; updated_at: number;
}

function JobCard({ job }: { job: Job }) {
  const statusColor = job.status === 'Open' ? 'var(--neon-green)' : job.status === 'InProgress' ? 'var(--neon-yellow)' : 'var(--text-muted)';
  return (
    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} className="pinc-card"
      style={{ cursor:'pointer', transition:'border-color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--electric-blue)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--text-primary)', marginBottom:'4px' }}>{job.title}</div>
          <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontFamily:'monospace' }}>by {job.owner_id}</div>
        </div>
        <span className="badge" style={{ color:statusColor, border:`1px solid ${statusColor}33`, background:`${statusColor}11`, flexShrink:0, marginLeft:'1rem' }}>
          {job.status.replace('_',' ')}
        </span>
      </div>
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.75rem' }}>
        {job.skills_required.map(s => <span key={s} className="badge badge-info" style={{ fontSize:'0.65rem' }}>{s}</span>)}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.72rem', color:'var(--neon-green)' }}>
            <DollarSign size={12}/>{job.budget} PINC
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.72rem', color:'var(--text-muted)' }}>
            <User size={12}/>{job.applicant_count} bids
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.72rem', color:'var(--neon-yellow)' }}>
            <Clock size={12}/>{job.deadline}
          </div>
        </div>
        <button className="pinc-btn" style={{ padding:'0.3rem 0.8rem', fontSize:'0.72rem' }}>BID</button>
      </div>
    </motion.div>
  );
}

function PostJobForm() {
  const [form, setForm] = useState({ title:'', description:'', budget:'', skills:'' });
  return (
    <div className="pinc-card" style={{ maxWidth:'600px' }}>
      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', letterSpacing:'0.12em', marginBottom:'1.25rem' }}>POST A JOB</div>
      <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        {[
          { label:'JOB TITLE', key:'title', placeholder:'e.g. Build a Rust networking module', type:'text' },
          { label:'BUDGET (PINC tokens)', key:'budget', placeholder:'e.g. 250', type:'number' },
          { label:'REQUIRED SKILLS (comma separated)', key:'skills', placeholder:'e.g. Rust, Tokio, Networking', type:'text' },
        ].map(f => (
          <div key={f.key}>
            <label style={{ display:'block', fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:'0.4rem' }}>{f.label}</label>
            <input className="pinc-input" type={f.type} placeholder={f.placeholder}
              value={(form as any)[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))} />
          </div>
        ))}
        <div>
          <label style={{ display:'block', fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:'0.4rem' }}>DESCRIPTION</label>
          <textarea className="pinc-input" rows={4} placeholder="Describe the work, deliverables, and acceptance criteria..."
            value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
            style={{ resize:'vertical' }} />
        </div>
        <div style={{ background:'rgba(57,255,20,0.06)', border:'1px solid rgba(57,255,20,0.2)', borderRadius:'4px', padding:'0.75rem', fontSize:'0.72rem', color:'var(--text-secondary)' }}>
          <CheckCircle size={13} style={{ display:'inline', marginRight:'6px', color:'var(--neon-green)' }}/>
          Funds will be locked in escrow when you accept a bid. Released automatically on milestone approval.
        </div>
        <button className="pinc-btn pinc-btn-primary" style={{ alignSelf:'flex-start' }}>
          <Briefcase size={14}/> POST JOB & FUND ESCROW
        </button>
      </div>
    </div>
  );
}

export default function FullMarketplacePage() {
  const [tab, setTab] = useState<Tab>('browse');
  const [jobs, setJobs] = useState<Job[]>([]);
  const tabs: {id: Tab; label: string}[] = [{ id:'browse', label:'BROWSE JOBS' }, { id:'post', label:'POST JOB' }, { id:'mine', label:'MY JOBS' }];

  useEffect(() => {
    invoke<Job[]>('cmd_get_marketplace_listings').then(setJobs).catch(console.error);
  }, []);

  return (
    <div style={{ padding:'2rem', maxWidth:'900px' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>DECENTRALIZED MARKETPLACE</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700 }}>Job Marketplace</div>
          <span className="badge badge-pending">PHASE 6</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
        {[
          { l:'OPEN JOBS', v: String(jobs.filter(j => j.status === 'Open').length), c:'var(--neon-green)' },
          { l:'TOTAL VALUE', v: `${jobs.reduce((s,j) => s+j.budget, 0).toLocaleString()} PINC`, c:'var(--electric-blue)' },
          { l:'IN ESCROW', v: `${jobs.filter(j => j.status === 'InProgress').reduce((s,j) => s+j.budget, 0).toLocaleString()} PINC`, c:'var(--neon-yellow)' },
          { l:'COMPLETED TODAY', v: String(jobs.filter(j => j.status === 'Completed').length), c:'var(--neon-cyan)' },
        ].map(s => (
          <div key={s.l} className="pinc-card">
            <div style={{ fontSize:'0.6rem', color:'var(--text-muted)', marginBottom:'4px' }}>{s.l}</div>
            <div style={{ fontFamily:'monospace', fontSize:'1rem', fontWeight:700, color:s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'2px', marginBottom:'1.5rem', background:'var(--bg-secondary)', padding:'3px', borderRadius:'6px', width:'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'0.4rem 1rem', fontSize:'0.72rem', fontFamily:'monospace', letterSpacing:'0.08em',
              background: tab === t.id ? 'var(--bg-elevated)' : 'transparent',
              border: tab === t.id ? '1px solid var(--border-bright)' : '1px solid transparent',
              color: tab === t.id ? 'var(--electric-blue)' : 'var(--text-muted)',
              borderRadius:'4px', cursor:'pointer', transition:'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {jobs.map(j => <JobCard key={j.id} job={j} />)}
        </div>
      )}
      {tab === 'post' && <PostJobForm />}
      {tab === 'mine' && (
        <div className="pinc-card" style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
          <Briefcase size={32} style={{ margin:'0 auto 1rem', opacity:0.3 }} />
          <div>No jobs posted yet</div>
        </div>
      )}
    </div>
  );
}
