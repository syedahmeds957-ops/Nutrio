import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
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
  const percentage = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.canvas }]}>
      <View style={styles.textRow}>
        <Text style={[styles.stepCount, dir.text, { color: theme.colors.textMuted }]}>
          {t('survey.progress.step', { current: currentStep + 1, total: totalSteps })}
        </Text>
        <Text
          style={[
            styles.percentage,
            { color: theme.isDark ? theme.colors.primaryLime : '#4B6200' },
          ]}
        >
          {formatPercent(percentage)}
        </Text>
      </View>
      <View
        style={[styles.track, { backgroundColor: theme.colors.surfaceSecondary }]}
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
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  title: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
});
