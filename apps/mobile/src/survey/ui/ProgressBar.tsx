import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, commonRadii } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
}

/**
 * Share of the survey already DONE: the current step is not finished yet, so
 * the first screen reads 0% and the last one still shows less than 100% until
 * the answers are submitted.
 */
export function completedPercent(currentStep: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  const done = Math.min(Math.max(currentStep, 0), totalSteps - 1);
  return Math.round((done / totalSteps) * 100);
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  stepTitle,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { formatPercent } = useFormat();
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const percentage = completedPercent(currentStep, totalSteps);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.canvas }]}>
      <View style={styles.textRow}>
        <Text style={[styles.stepCount, dir.text, { color: theme.colors.textMuted }]}>
          {t('survey.progress.step', { current: currentStep + 1, total: totalSteps })}
        </Text>
        <Text
          style={[
            styles.percentage,
            { color: theme.colors.primaryAccessible },
          ]}
        >
          {formatPercent(percentage)}
        </Text>
      </View>
      <View
        style={[styles.track, { backgroundColor: theme.colors.progressTrack }]}
        accessibilityRole="progressbar"
        accessibilityLabel={t('survey.progress.step', { current: currentStep + 1, total: totalSteps })}
        accessibilityValue={{ min: 0, max: 100, now: percentage }}
      >
        <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: accentColor }]} />
      </View>
      <Text
        role="heading"
        aria-level={1}
        style={[styles.title, dir.text, { color: theme.colors.textPrimary }]}
      >
        {stepTitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepCount: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '800',
  },
  track: {
    height: 6,
    borderRadius: commonRadii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: commonRadii.pill,
  },
  title: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
});
