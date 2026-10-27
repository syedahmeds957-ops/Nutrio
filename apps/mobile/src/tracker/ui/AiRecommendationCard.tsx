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
  // The clean-slate subtitle already says what logging a meal unlocks.
  const rationale = isCleanSlate ? null : t(`${suggestionBase}.rationale`, copyValues);
  const items: SuggestionItem[] = suggestion?.items ?? [];

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
      <View
        style={[
          styles.tag,
          { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
        ]}
      >
        <Icon name="sparkles" size={12} color={isDark ? accentColor : theme.colors.primaryAccessible} />
        <Text style={[styles.tagText, { color: theme.colors.primaryAccessible }]}>{t('tracker.aiCard.badge')}</Text>
      </View>

      <Text style={[styles.title, dir.text, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text
        numberOfLines={2}
        style={[styles.line, dir.text, { color: theme.colors.textSecondary }]}
      >
        {rationale ?? subtitle}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: accentColor }]}
          onPress={handleLog}
          activeOpacity={0.8}
          disabled={logged}
          accessibilityRole="button"
        >
          <View style={styles.btnContent}>
            <Icon name={logged ? 'check' : 'plus'} size={13} color={btnTextColor} strokeWidth={2.8} />
            <Text style={[styles.btnText, { color: btnTextColor }]}>
              {logged
                ? t('tracker.aiCard.logged')
                : isCleanSlate
                ? t('tracker.aiCard.logFirstMeal')
                : t('tracker.aiCard.logIt')}
            </Text>
          </View>
        </TouchableOpacity>

        {onAskCoach && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.colors.surfaceSecondary }]}
            onPress={onAskCoach}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={[styles.btnText, { color: theme.colors.textPrimary }]}>{t('tracker.aiCard.askCoach')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  tag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  line: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  btn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
