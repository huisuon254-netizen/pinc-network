import { MessageSquare, Lock } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div style={{ padding:'2rem', maxWidth:'900px' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>ENCRYPTED MESSAGING</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--text-primary)' }}>Messages</div>
          <span className="badge badge-pending">PHASE 5</span>
        </div>
      </div>
      <div className="pinc-card" style={{ textAlign:'center', padding:'4rem 2rem' }}>
        <MessageSquare size={48} style={{ margin:'0 auto 1.5rem', color:'var(--text-muted)', opacity:0.3 }} />
        <div style={{ fontSize:'1rem', color:'var(--text-secondary)', marginBottom:'0.75rem' }}>Encrypted Messaging</div>
        <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', lineHeight:1.7, maxWidth:'400px', margin:'0 auto' }}>
          End-to-end encrypted messaging activates in <strong style={{ color:'var(--soft-purple)' }}>Phase 5</strong> once the mesh relay network (Phase 3) is live. Messages are routed peer-to-peer with no central server.
        </div>
        <div style={{ marginTop:'1.5rem', display:'flex', gap:'0.5rem', justifyContent:'center', flexWrap:'wrap' }}>
          {['E2E Encrypted Chat', 'Media Transfer', 'Offline Relay', 'Voice Calls', 'Video Calls'].map(f => (
            <span key={f} className="badge badge-purple">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
