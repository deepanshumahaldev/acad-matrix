import { useCallback, useEffect, useState } from 'react';

/** Counts down from `seconds` to 0. `restart` begins a new countdown (e.g. after resending a code). */
export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const restart = useCallback((next: number) => setRemaining(next), []);
  return { remaining, restart };
}
