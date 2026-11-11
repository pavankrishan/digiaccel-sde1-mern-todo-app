import { useEffect, useState } from 'react';

/** true once `active` has stayed true for `delay` ms; false immediately when it turns off. */
export function useDelayedFlag(active, delay) {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    if (!active) {
      const t = setTimeout(() => setFlag(false), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setFlag(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);
  return active && flag;
}
