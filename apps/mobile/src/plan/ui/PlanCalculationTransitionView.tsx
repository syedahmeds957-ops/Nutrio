import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { Icon } from '../../ui/Icon.js';

interface PlanCalculationTransitionViewProps {
  onReady: () => void;
}

export const PlanCalculationTransitionView: React.FC<PlanCalculationTransitionViewProps> = ({
  onReady,
}) => {
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const isSaudi = activeRegion === 'SA';
  const accentColor = theme.colors.primaryLime;
  const [stepIndex, setStepIndex] = useState(0);

  const steps = isSaudi
    ? [
        'معايرة معدل الأيض الأساسي وحساب استهلاك الطاقة...',
        'تحديد العجز المستدام وحماية التوازن الهرموني...',
        'تخصيص الأطباق التراثية والمطاعم المعتمدة محلياً...',
      ]
    : [
        'Calibrating Mifflin-St Jeor TDEE & metabolic baselines...',
        'Balancing macronutrient floor & safe deficit pacing...',
        'Synthesizing cultural food levers & lifestyle preferences...',
      ];

  useEffect(() => {
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (isTest) {
      onReady();
      return;
    }

    const t1 = setTimeout(() => setStepIndex(1), 400);
    const t2 = setTimeout(() => setStepIndex(2), 800);
    const t3 = setTimeout(() => onReady(), 1300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onReady]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.canvas }]}>
      <View style={styles.content}>
        {/* Glowing Telemetry Orb */}
        <View
          style={[
            styles.iconOrb,
            {
              backgroundColor: theme.colors.surface,
              borderColor: accentColor,
            },
          ]}
        >
          <Icon name="sparkles" size={32} color={accentColor} />
        </View>

        {/* Clinical Eyebrow & Title */}
        <View style={styles.headerArea}>
          <Text style={[styles.eyebrow, { color: accentColor }]}>
            {isSaudi ? 'المحرك الأيضي السريري · CLINICAL ENGINE' : 'CLINICAL NUTRITION ENGINE'}
          </Text>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {isSaudi ? 'صياغة خطتك المخصصة' : 'Synthesizing Your Plan'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {isSaudi
              ? 'نقوم الآن بضبط أرقامك الغذائية بدقة وفق المؤشرات الحيوية ونمط حياتك.'
              : 'Formulating exact caloric targets, macro splits, and cultural levers.'}
          </Text>
        </View>

        {/* Step Progress Checklist */}
        <View
          style={[
            styles.stepsCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {steps.map((text, idx) => {
            const isCompleted = stepIndex > idx;
            const isCurrent = stepIndex === idx;

            return (
              <View
                key={idx}
                style={[
                  styles.stepRow,
                  idx < steps.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: isCompleted
                        ? accentColor
                        : isCurrent
                        ? theme.colors.surfaceSecondary
                        : theme.colors.surfaceSecondary,
                      borderColor: isCurrent ? accentColor : 'transparent',
                      borderWidth: isCurrent ? 1.5 : 0,
                    },
                  ]}
                >
                  {isCompleted ? (
                    <Icon
                      name="check"
                      size={13}
                      color={isSaudi ? '#FFFFFF' : '#0A0B0D'}
                    />
                  ) : isCurrent ? (
                    <ActivityIndicator size="small" color={accentColor} />
                  ) : (
                    <Text style={[styles.stepNum, { color: theme.colors.textMuted }]}>
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    {
                      color: isCompleted || isCurrent
                        ? theme.colors.textPrimary
                        : theme.colors.textMuted,
                      fontWeight: isCurrent ? '700' : '500',
                    },
                  ]}
                >
                  {text}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Fast Action Skip Button */}
        <TouchableOpacity
          style={[styles.skipButton, { backgroundColor: theme.colors.surfaceSecondary }]}
          onPress={onReady}
          activeOpacity={0.8}
        >
          <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary }]}>
            {isSaudi ? 'عرض الخطة فوراً · View Plan Now' : 'View Plan Now'}
          </Text>
          <Icon name="arrow-right" size={14} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  iconOrb: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  stepsCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  skipButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
