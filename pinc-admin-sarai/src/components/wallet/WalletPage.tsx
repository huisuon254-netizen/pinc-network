import { Wallet } from 'lucide-react';

export default function WalletPage() {
  return (
    <div style={{ padding:'2rem', maxWidth:'900px' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'0.2em', marginBottom:'0.25rem' }}>INTERNAL WALLET</div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--text-primary)' }}>Wallet</div>
          <span className="badge badge-pending">PHASE 7</span>
        </div>
      </div>
      <div className="pinc-card" style={{ textAlign:'center', padding:'4rem 2rem' }}>
        <Wallet size={48} style={{ margin:'0 auto 1.5rem', color:'var(--text-muted)', opacity:0.3 }} />
        <div style={{ fontSize:'1rem', color:'var(--text-secondary)', marginBottom:'0.75rem' }}>Payment & Escrow System</div>
        <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', lineHeight:1.7, maxWidth:'420px', margin:'0 auto' }}>
          The internal wallet and escrow engine launches in <strong style={{ color:'var(--neon-yellow)' }}>Phase 7</strong>. Stablecoin deposits, withdrawal verification, recipient confirmation, and dispute rollback are all non-custodial.
        </div>
        <div style={{ marginTop:'1.5rem', display:'flex', gap:'0.5rem', justifyContent:'center', flexWrap:'wrap' }}>
          {['Internal Balances','Escrow Freeze','Stablecoin Integration','Fraud Analysis','Rollback Disputes'].map(f => (
            <span key={f} className="badge badge-info">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
