import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Image, StyleSheet, View, ViewStyle } from 'react-native';
import { getExercise } from '../core.js';
import { EXERCISE_IMAGES } from '../exerciseImages.js';
import { useI18nState } from '../../i18n/index.js';
import { useTheme } from '../../theme.js';

const FRAME_MS = 900;

interface ExerciseImageLoopProps {
  exerciseId: string;
  /** Width in px; the photos are 3:2 unless `square` crops them. */
  size: number;
  square?: boolean;
  /** Hold the first frame, e.g. while a list is scrolling. */
  paused?: boolean;
  style?: ViewStyle;
}

/**
 * The exercise demo: the dataset's start and end photos shown in turn, which
 * reads as the movement without needing licensed GIFs. Shows the start frame
 * only when the OS asks for reduced motion.
 */
export const ExerciseImageLoop: React.FC<ExerciseImageLoopProps> = ({
  exerciseId,
  size,
  square,
  paused,
  style,
}) => {
  const { theme } = useTheme();
  const { language } = useI18nState();
  const [frame, setFrame] = useState<0 | 1>(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => {
        // Unknown means animate, the platform default.
      });
    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  const animate = !paused && !reduceMotion;
  useEffect(() => {
    if (!animate) {
      setFrame(0);
      return;
    }
    const timer = setInterval(() => setFrame((current) => (current === 0 ? 1 : 0)), FRAME_MS);
    return () => clearInterval(timer);
  }, [animate]);

  const frames = EXERCISE_IMAGES[exerciseId];
  const name = getExercise(exerciseId)?.name[language];
  const height = square ? size : Math.round((size * 2) / 3);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[styles.frame, { width: size, height, borderColor: theme.colors.border }, style]}
    >
      {frames ? <Image source={frames[frame]} style={styles.image} resizeMode="cover" /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    // The photos have white studio backgrounds; white keeps dark mode from flashing grey edges.
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
