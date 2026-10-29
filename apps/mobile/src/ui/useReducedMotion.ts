import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

type MediaQueryListLike = {
  matches: boolean;
  addEventListener?: (type: 'change', listener: (event: { matches: boolean }) => void) => void;
  removeEventListener?: (type: 'change', listener: (event: { matches: boolean }) => void) => void;
};

function webQuery(): MediaQueryListLike | null {
  if (Platform.OS !== 'web') return null;
  try {
    const g = globalThis as { matchMedia?: (query: string) => MediaQueryListLike };
    return typeof g.matchMedia === 'function' ? g.matchMedia('(prefers-reduced-motion: reduce)') : null;
  } catch {
    return null;
  }
}

/**
 * True when the person has asked their device (or browser) for reduced motion.
 * Starts false until the OS answers, then follows changes. Animated screens
 * skip translate, spring and fade-in when it is true: content just appears.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => webQuery()?.matches ?? false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        if (active && enabled) setReduced(true);
      })
      .catch(() => {
        // Unknown setting: keep animating.
      });
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled: boolean) => {
      if (active) setReduced(enabled);
    });

    const query = webQuery();
    const onChange = (event: { matches: boolean }) => {
      if (active) setReduced(event.matches);
    };
    query?.addEventListener?.('change', onChange);

    return () => {
      active = false;
      subscription?.remove?.();
      query?.removeEventListener?.('change', onChange);
    };
  }, []);

  return reduced;
}
