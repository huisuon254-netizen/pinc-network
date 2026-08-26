import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store/appStore';
import type { StartupCheck } from '../../types';
import logoImg from '../../assets/brand/logo.jpg';

type Phase = 'logo' | 'checks' | 'ready';

export default function SplashScreen() {
  const { startupReport, startupDone } = useAppStore();
  const [phase, setPhase] = useState<Phase>('logo');
  const [visibleChecks, setVisibleChecks] = useState<StartupCheck[]>([]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('checks'), 1200);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== 'checks') return;
    const checks = startupReport?.checks ?? [];
    checks.forEach((check, i) => {
      setTimeout(() => {
        setVisibleChecks((prev) => [...prev, check]);
        if (i === checks.length - 1) setTimeout(() => setPhase('ready'), 600);
      }, i * 250);
    });
  }, [phase, startupReport]);

  return (
    <div className="scanline" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', flexDirection: 'column' }}>
      <AnimatePresence>
        {/* Logo */}
        <motion.div
          key="logo"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <img
            src={logoImg}
            alt="PINC"
            style={{ width: 160, height: 160, borderRadius: 24, objectFit: 'cover', marginBottom: '1rem', boxShadow: '0 0 40px rgba(0,212,255,0.35)' }}
          />
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.4em', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            PRIVATE INTELLIGENT NETWORK CORE
          </div>
          <div style={{ marginTop: '1rem', height: '1px', background: 'linear-gradient(90deg, transparent, var(--electric-blue), transparent)' }} />
        </motion.div>
      </AnimatePresence>

      {/* System checks */}
      <AnimatePresence>
        {phase !== 'logo' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ minWidth: '320px', fontFamily: 'monospace', fontSize: '0.8rem' }}
          >
            {visibleChecks.map((check, i) => (
              <motion.div
                key={check.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', color: check.passed ? 'var(--neon-cyan)' : 'var(--neon-red)' }}
              >
                <span style={{ color: check.passed ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                  {check.passed ? '[✓]' : '[✗]'}
                </span>
                <span style={{ color: 'var(--text-secondary)', minWidth: '120px' }}>{check.name}</span>
                <span style={{ color: check.passed ? 'var(--neon-cyan)' : 'var(--neon-red)' }}>{check.message}</span>
              </motion.div>
            ))}

            {phase === 'ready' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--electric-blue)' }}
                className="pulse-glow"
              >
                ◈ SYSTEM READY ◈
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version */}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', color: 'var(--text-muted)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
        v3.0.0 · PHASE 3
      </div>
    </div>
  );
}
