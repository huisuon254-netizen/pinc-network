import { useState, useEffect } from 'react';
import { Briefcase, DollarSign, Users, CheckCircle, AlertTriangle, Edit3, Trash2, Plus } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export default function JobsAdminPage() {
  const jobs = useAdminStore(s => s.jobs);
  const loadJobs = useAdminStore(s => s.loadJobs);
  const deleteJob = useAdminStore(s => s.deleteJob);
  const editJob = useAdminStore(s => s.editJob);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const [filter, setFilter] = useState<string>('all');
  const statuses = ['all', 'open', 'in_progress', 'completed', 'disputed'];

  const handleEdit = (id: string, currentBudget: number) => {
    const budget = window.prompt('Budget:', String(currentBudget));
    if (budget) editJob(id, { budget: parseInt(budget) || currentBudget });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      deleteJob(id);
    }
  };

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Jobs Admin Panel</h1>
          <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>Marketplace management and dispute resolution</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'ACTIVE JOBS', value: jobs.filter(j => j.status === 'open').length, color: 'var(--neon-green)' },
          { label: 'IN PROGRESS', value: jobs.filter(j => j.status === 'in_progress').length, color: 'var(--accent-blue)' },
          { label: 'COMPLETED', value: jobs.filter(j => j.status === 'completed').length, color: 'var(--accent-purple)' },
          { label: 'DISPUTED', value: jobs.filter(j => j.status === 'disputed').length, color: 'var(--accent-red)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '0.7rem 0.85rem',
          }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '0.75rem' }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '0.3rem 0.7rem', fontSize: '0.6rem', textTransform: 'uppercase',
            background: filter === s ? 'rgba(37,99,235,0.15)' : 'transparent',
            border: `1px solid ${filter === s ? 'var(--accent-blue)' : 'var(--border)'}`,
            borderRadius: 4, color: filter === s ? 'var(--accent-blue)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}>{s.replace('_', ' ')}</button>
        ))}
      </div>

      {/* Jobs Table */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['JOB', 'CATEGORY', 'BUDGET', 'APPLICANTS', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.55rem', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.filter(j => filter === 'all' || j.status === filter).map(j => (
              <tr key={j.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontWeight: 600 }}>{j.title}</td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{j.category}</td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--accent-yellow)' }}>${j.budget.toLocaleString()}</td>
                <td style={{ padding: '0.5rem 0.75rem', color: 'var(--neon-cyan)' }}>{j.applicants}</td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: '0.55rem',
                    background: j.status === 'open' ? 'rgba(16,185,129,0.12)' : j.status === 'disputed' ? 'rgba(239,68,68,0.12)' : j.status === 'completed' ? 'rgba(139,92,246,0.12)' : 'rgba(37,99,235,0.12)',
                    color: j.status === 'open' ? 'var(--neon-green)' : j.status === 'disputed' ? 'var(--accent-red)' : j.status === 'completed' ? 'var(--accent-purple)' : 'var(--accent-blue)',
                  }}>{j.status.replace('_', ' ')}</span>
                </td>
                <td style={{ padding: '0.5rem 0.75rem' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => handleEdit(j.id, j.budget)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--accent-blue)', cursor: 'pointer', padding: 3 }}><Edit3 size={11} /></button>
                    <button onClick={() => handleDelete(j.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--accent-red)', cursor: 'pointer', padding: 3 }}><Trash2 size={11} /></button>
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
