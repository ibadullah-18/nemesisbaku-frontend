import { useEffect, useState } from 'react';

// 3D effekti yalnız desktop-da, reduced-motion söndürülməyibsə və
// səhifə boşaldıqdan sonra işə salır.
export default function useIdle3D({ timeout = 1500 } = {}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const skip =
      window.matchMedia('(max-width: 768px)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (skip) return;

    const start = () => setReady(true);
    const hasRic = 'requestIdleCallback' in window;
    const id = hasRic
      ? window.requestIdleCallback(start, { timeout })
      : window.setTimeout(start, 400); // Safari

    return () => {
      if (hasRic) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [timeout]);

  return ready;
}