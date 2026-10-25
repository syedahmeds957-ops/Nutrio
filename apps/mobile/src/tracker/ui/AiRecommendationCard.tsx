import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { SuggestionItem, suggestionFor } from '../suggestions.js';

interface AiRecommendationCardProps {
  remainingCalories: number;
  remainingProtein: number;
  totalCaloriesConsumed?: number;
  itemsLoggedCount?: number;
  onLogRecommendation: (items: SuggestionItem[]) => void;
  onAskCoach?: () => void;
  onOpenLogMeal?: () => void;
}

export const AiRecommendationCard: React.FC<AiRecommendationCardProps> = ({
  remainingCalories,
  remainingProtein: _remainingProtein,
  totalCaloriesConsumed,
  itemsLoggedCount,
  onLogRecommendation,
  onAskCoach,
  onOpenLogMeal,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const [logged, setLogged] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  const btnTextColor = '#0A0B0D';

  useEffect(() => {
    setLogged(false);
  }, [activeRegion]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeRegion]);

  // The suggestion and every number on it come from food-db (suggestions.ts).
  const suggestion =
    totalCaloriesConsumed === 0 || itemsLoggedCount === 0 ? null : suggestionFor(activeRegion, remainingCalories);
  const isCleanSlate = !suggestion;
  const suggestionBase = suggestion ? `tracker.aiCard.suggestions.${activeRegion}.${suggestion.size}` : '';
  const copyValues = {
    remaining: remainingCalories,
    kcal: suggestion?.calories ?? 0,
    protein: suggestion?.proteinGrams ?? 0,
  };

  const title = isCleanSlate ? t('tracker.aiCard.cleanSlate.title') : t(`${suggestionBase}.title`);
  const subtitle = isCleanSlate
    ? t('tracker.aiCard.cleanSlate.subtitle')
    : t(`${suggestionBase}.subtitle`);
  const rationale = isCleanSlate
    ? t('tracker.aiCard.cleanSlate.rationale')
    : t(`${suggestionBase}.rationale`, copyValues);
  const items: SuggestionItem[] = suggestion?.items ?? [];
  const totalKcal = suggestion?.calories ?? 0;
  const totalProtein = suggestion?.proteinGrams ?? 0;

  const handleLog = () => {
    if (isCleanSlate) {
      if (onOpenLogMeal) {
        onOpenLogMeal();
      }
      return;
    }
    onLogRecommendation(items);
    setLogged(true);
    setTimeout(() => setLogged(false), 3000);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Header Badge */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.badgeRow,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="sparkles" size={13} color={accentColor} />
          <Text style={[styles.badgeText, { color: theme.colors.primaryAccessible }]}>
            {t('tracker.aiCard.badge')}
          </Text>
        </View>

        {onAskCoach && (
          <TouchableOpacity
            style={[
              styles.coachPill,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={onAskCoach}
            activeOpacity={0.7}
          >
            <View style={styles.coachBtnRow}>
              <Icon name="coach" size={12} color={theme.colors.textPrimary} />
              <Text style={[styles.coachPillText, { color: theme.colors.textPrimary }]}>
                {t('tracker.aiCard.askCoach')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestion Info */}
      <Text style={[styles.title, dir.text, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, dir.text, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      <Text style={[styles.rationale, { color: theme.colors.textMuted }]}>{rationale}</Text>

      {/* Macro Pills & Action Row */}
      <View style={[styles.footerRow, { borderTopColor: theme.colors.border }]}>
        {isCleanSlate ? (
          <View
            style={[
              styles.macroPill,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon name="sparkles" size={11} color={accentColor} />
            <Text style={[styles.macroVal, { color: theme.colors.textSecondary }]}>
              {t('tracker.aiCard.awaitingFirstMeal')}
            </Text>
          </View>
        ) : (
          <View style={styles.macroPills}>
            <View
              style={[
                styles.macroPill,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Icon name="flame" size={11} color="#EF4444" />
              <Text style={[styles.macroVal, { color: theme.colors.textSecondary }]}>
                {t('common.kcalValue', { value: totalKcal })}
              </Text>
            </View>
            <View
              style={[
                styles.macroPill,
                {
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
                },
              ]}
            >
              <Icon name="zap" size={11} color="#3B82F6" />
              <Text style={[styles.macroVal, { color: theme.colors.proteinText }]}>
                {t('tracker.aiCard.proteinValue', { grams: totalProtein })}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.logBtn,
            { backgroundColor: accentColor },
            logged && styles.logBtnLogged,
          ]}
          onPress={handleLog}
          activeOpacity={0.8}
          disabled={logged}
        >
          <View style={styles.btnContent}>
            <Icon name={logged ? 'check' : 'plus'} size={13} color={btnTextColor} />
            <Text style={[styles.logBtnText, { color: btnTextColor }]}>
              {logged
                ? t('tracker.aiCard.logged')
                : isCleanSlate
                ? t('tracker.aiCard.logFirstMeal')
                : t('tracker.aiCard.logSuggestion')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  coachPill: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  coachBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coachPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  rationale: {
    fontSize: 11,
    marginBottom: 14,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  macroPills: {
    flexDirection: 'row',
    gap: 6,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  macroVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  logBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  logBtnLogged: {
    backgroundColor: '#A4EB3F',
    borderWidth: 1.5,
    borderColor: '#0A0B0D',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A0B0D',
  },
});
