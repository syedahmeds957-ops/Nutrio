import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';

/**
 * A screen arrives with a short fade and rise instead of snapping in. Mount it
 * with a `key` that changes per screen. Skipped when the person has asked their
 * device for reduced motion.
 */
export const ScreenEnter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    const run = (reduced: boolean) => {
      if (cancelled) return;
      if (reduced) {
        progress.setValue(1);
        return;
      }
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(run, () => run(false));
    return () => {
      cancelled = true;
    };
  }, [progress]);

  return (
    <Animated.View
      style={[
        styles.fill,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({ fill: { flex: 1 } });
