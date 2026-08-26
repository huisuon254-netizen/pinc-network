import { useEffect, useRef } from 'react';

/**
 * Simple polling hook: calls fn() immediately and every intervalMs.
 * Cancels on unmount or when deps change.
 */
export function usePolling(
  fn: () => void | Promise<void>,
  intervalMs: number,
  enabled: boolean = true,
  deps: unknown[] = []
) {
  const savedFn = useRef(fn);
  useEffect(() => {
    savedFn.current = fn;
  }, [fn]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        await savedFn.current();
      } catch {
        // swallow — polling should not throw
      }
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, enabled, ...deps]);
}

export default usePolling;
