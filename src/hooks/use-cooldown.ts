import { useCallback, useEffect, useState } from 'react';

/** Counts down from `seconds` once `start()` is called; `remaining` is 0 when idle/finished. Used for "Resend code in 30s". */
export function useCooldown(seconds: number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const start = useCallback(() => setRemaining(seconds), [seconds]);

  return { remaining, start };
}
