import { useTheme } from '../../contexts/ThemeContext';

/**
 * Fixed ambient background layers — grid / waves / circuitry.
 * Beautiful, non-intrusive. Behind all content (z:-2 etc). Pointer-events none.
 */
export default function ThemeBackground() {
  const { theme } = useTheme();

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -10,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Base gradient is via themes.css body; here we add decorative layers per theme */}

      {theme === 'dark-tech' && (
        <>
          {/* subtle cyan glow orbs */}
          <div style={{ position: 'absolute', width: 640, height: 640, left: '-8%', top: '-10%', borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, rgba(0,212,255,0.10), transparent 68%)', filter: 'blur(2px)' }} />
          <div style={{ position: 'absolute', width: 560, height: 560, right: '-6%', bottom: '-8%', borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, rgba(0,255,204,0.07), transparent 68%)', filter: 'blur(2px)' }} />
          {/* grid lines */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '42px 42px',
            maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black 60%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black 60%, transparent 85%)',
            opacity: 0.65,
          }} />
          {/* scan beam */}
          <div style={{
            position: 'absolute', left: 0, right: 0, top: '18%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.18), transparent)',
            boxShadow: '0 0 12px rgba(0,212,255,0.22)',
          }} />
        </>
      )}

      {theme === 'cyber-wave' && (
        <>
          {/* purple / blue waves */}
          <svg viewBox="0 0 1440 800" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.9 }}>
            <defs>
              <linearGradient id="cw-g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.14} />
                <stop offset="55%" stopColor="#3b82f6" stopOpacity={0.10} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0.10} />
              </linearGradient>
              <linearGradient id="cw-g2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            {/* big soft waves */}
            <path d="M0 120 C 260 40, 520 180, 760 90 S 1180 30, 1440 120 L1440 0 L0 0 Z" fill="url(#cw-g1)" />
            <path d="M0 560 C 320 480, 640 640, 960 520 S 1280 620, 1440 520 L1440 800 L0 800 Z" fill="url(#cw-g1)" opacity={0.55} />
            {/* wavy lines */}
            <path d="M0 220 C 360 160, 720 280, 1080 180 S 1440 260, 1440 220" fill="none" stroke="url(#cw-g2)" strokeWidth={1.2} opacity={0.55} />
            <path d="M0 250 C 360 190, 720 310, 1080 210 S 1440 290, 1440 250" fill="none" stroke="url(#cw-g2)" strokeWidth={0.8} opacity={0.32} />
            <path d="M0 540 C 380 480, 760 600, 1140 520 S 1440 580, 1440 540" fill="none" stroke="url(#cw-g2)" strokeWidth={1.1} opacity={0.42} />
          </svg>
          {/* glow orbs */}
          <div style={{ position: 'absolute', width: 520, height: 520, left: '6%', top: '10%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.16), transparent 70%)', filter: 'blur(8px)' }} />
          <div style={{ position: 'absolute', width: 620, height: 620, right: '2%', bottom: '6%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)', filter: 'blur(10px)' }} />
          <div style={{ position: 'absolute', width: 420, height: 420, left: '38%', top: '42%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.10), transparent 70%)', filter: 'blur(12px)' }} />
        </>
      )}

      {theme === 'light-luxe' && (
        <>
          {/* bright silver base sheen */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(244,246,249,0.4) 45%, rgba(233,236,242,0.5) 100%)' }} />
          {/* gold glow orbs */}
          <div style={{ position: 'absolute', width: 760, height: 760, left: '-6%', top: '-14%', borderRadius: '50%', background: 'radial-gradient(circle at 40% 40%, rgba(212,175,55,0.22), rgba(212,175,55,0.07) 42%, transparent 68%)', filter: 'blur(1px)' }} />
          <div style={{ position: 'absolute', width: 680, height: 680, right: '-8%', bottom: '-10%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.9), transparent 68%)', filter: 'blur(2px)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 900px 420px at 50% 50%, rgba(212,175,55,0.08), transparent 68%)' }} />
          {/* very faint gold grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(rgba(212,175,55,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.05) 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
            opacity: 0.5,
            maskImage: 'radial-gradient(ellipse 95% 75% at 50% 38%, black 58%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 95% 75% at 50% 38%, black 58%, transparent 85%)',
          }} />
          {/* gold sheen sweep */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '22%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.22), transparent)' }} />
        </>
      )}

      {theme === 'onyx-gold' && (
        <>
          {/* gold radial glows on shiny black */}
          <div style={{ position: 'absolute', width: 720, height: 720, left: '-6%', top: '-12%', borderRadius: '50%', background: 'radial-gradient(circle at 45% 45%, rgba(212,175,55,0.16), rgba(212,175,55,0.05) 45%, transparent 70%)', filter: 'blur(2px)' }} />
          <div style={{ position: 'absolute', width: 620, height: 620, right: '-6%', bottom: '-8%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.10), transparent 68%)', filter: 'blur(3px)' }} />
          {/* emerald traces — circuitry on black */}
          <svg viewBox="0 0 1440 800" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }}>
            <defs>
              <linearGradient id="og-gold" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#e8c95a" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id="og-green" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            {/* gold diagonal light sweep */}
            <path d="M0 800 L1440 80 L1440 260 L0 800 Z" fill="rgba(255,255,255,0.03)" />
            <path d="M0 140 H 420 V 220 H 760 V 130 H 1020 V 250 H 1440" fill="none" stroke="url(#og-gold)" strokeWidth={1} opacity={0.5} />
            <path d="M0 600 H 380 V 520 H 700 V 620 H 1040 V 540 H 1440" fill="none" stroke="url(#og-green)" strokeWidth={1} opacity={0.45} />
            <path d="M240 0 V 170 H 540 V 90 H 860 V 210" fill="none" stroke="url(#og-gold)" strokeWidth={0.9} opacity={0.28} />
            {/* nodes */}
            <circle cx={420} cy={140} r={2.5} fill="#D4AF37" opacity={0.75} />
            <circle cx={760} cy={220} r={2.5} fill="#D4AF37" opacity={0.55} />
            <circle cx={380} cy={600} r={2.5} fill="#10b981" opacity={0.65} />
            <circle cx={700} cy={520} r={2.5} fill="#10b981" opacity={0.5} />
            <circle cx={1040} cy={540} r={2.5} fill="#10b981" opacity={0.45} />
          </svg>
          {/* glossy top sheen */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, transparent 28%, rgba(212,175,55,0.05) 62%, transparent 92%)',
          }} />
          {/* faint dot grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(circle 1px, rgba(212,175,55,0.10) 1px, transparent 1.5px)`,
            backgroundSize: '26px 26px',
            opacity: 0.4,
            maskImage: 'radial-gradient(ellipse 95% 80% at 50% 35%, black 55%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 95% 80% at 50% 35%, black 55%, transparent 85%)',
          }} />
        </>
      )}

      {theme === 'matrix-green' && (
        <>
          {/* olive + neon green orbs */}
          <div style={{ position: 'absolute', width: 620, height: 620, left: '-4%', top: '-8%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(57,255,20,0.10), transparent 70%)', filter: 'blur(2px)' }} />
          <div style={{ position: 'absolute', width: 560, height: 560, right: '-6%', bottom: '-6%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,140,62,0.16), transparent 70%)', filter: 'blur(4px)' }} />
          {/* circuitry lines */}
          <svg viewBox="0 0 1440 800" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.52 }}>
            <defs>
              <linearGradient id="mx-g" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#39ff14" stopOpacity={0.14} />
                <stop offset="100%" stopColor="#6b8c3e" stopOpacity={0.07} />
              </linearGradient>
            </defs>
            {/* horizontal traces */}
            <path d="M0 120 H 420 V 200 H 720 V 120 H 960 V 240 H 1440" fill="none" stroke="url(#mx-g)" strokeWidth={1} opacity={0.45} />
            <path d="M0 560 H 380 V 480 H 700 V 580 H 1020 V 500 H 1440" fill="none" stroke="url(#mx-g)" strokeWidth={1} opacity={0.35} />
            <path d="M220 0 V 160 H 520 V 80 H 820" fill="none" stroke="url(#mx-g)" strokeWidth={0.9} opacity={0.22} />
            {/* nodes */}
            <circle cx={420} cy={120} r={2.5} fill="#39ff14" opacity={0.7} />
            <circle cx={720} cy={200} r={2.5} fill="#39ff14" opacity={0.55} />
            <circle cx={960} cy={120} r={2.5} fill="#39ff14" opacity={0.5} />
            <circle cx={380} cy={560} r={2.5} fill="#6b8c3e" opacity={0.6} />
            <circle cx={700} cy={480} r={2.5} fill="#39ff14" opacity={0.5} />
            <circle cx={1020} cy={500} r={2.5} fill="#39ff14" opacity={0.45} />
          </svg>
          {/* faint dot grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(circle 1px, rgba(57,255,20,0.10) 1px, transparent 1.5px)`,
            backgroundSize: '26px 26px',
            opacity: 0.45,
            maskImage: 'radial-gradient(ellipse 95% 80% at 50% 35%, black 55%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 95% 80% at 50% 35%, black 55%, transparent 85%)',
          }} />
        </>
      )}

      {/* universal vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 120% 85% at 50% 100%, transparent 55%, rgba(0,0,0,0.14) 100%)',
        opacity: theme === 'light-luxe' ? 0.06 : theme === 'onyx-gold' ? 0.22 : 0.18,
      }} />
    </div>
  );
}
