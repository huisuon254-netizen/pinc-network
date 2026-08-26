import { useEffect, useState } from 'react';

export interface EscrowCountdown {
  remainingMs: number;
  expired: boolean;
  countdown: string; // mm:ss
  remainingSec: number;
}

export function useEscrowCountdown(expiresAt: number | null | undefined): EscrowCountdown {
  const compute = (): EscrowCountdown => {
    if (!expiresAt) {
      return { remainingMs: 0, expired: false, countdown: '00:00', remainingSec: 0 };
    }
    const expiresMs = expiresAt * 1000;
    const now = Date.now();
    const remainingMs = Math.max(0, expiresMs - now);
    const expired = now >= expiresMs;
    const totalSec = Math.floor(remainingMs / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const ss = String(totalSec % 60).padStart(2, '0');
    return {
      remainingMs,
      expired,
      countdown: `${mm}:${ss}`,
      remainingSec: totalSec,
    };
  };

  const [state, setState] = useState<EscrowCountdown>(compute);

  useEffect(() => {
    if (!expiresAt) return;
    setState(compute());
    const iv = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  return state;
}

export default useEscrowCountdown;
