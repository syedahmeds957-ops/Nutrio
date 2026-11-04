import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NormalizedFood, ServingUnit } from '@nutrio/food-db';
import type { DishMention } from '../dishMentions.js';
import type { MealSlot } from '../../tracker/types.js';
import { foodDisplayName } from '../../tracker/foodDisplayName.js';
import { Icon } from '../../ui/Icon.js';
import { useTheme, commonRadii } from '../../theme.js';
import { useTranslation, useTextDirection, useI18nState } from '../../i18n/index.js';
import { useFormat } from '../../i18n/useFormat.js';
import { useRegion } from '../../common/region/index.js';

export interface DishLogOutcome {
  slot: MealSlot;
  kcal: number;
}

interface DishLogChipsProps {
  mentions: DishMention[];
  /** Logs one serving; returns where it went, or null when nothing was logged. */
  onLog: (food: NormalizedFood, serving: ServingUnit) => DishLogOutcome | null;
}

type ChipState = { kind: 'idle' } | { kind: 'logged'; outcome: DishLogOutcome } | { kind: 'failed' };

/**
 * "Log" chips under a coach reply, one per catalogue dish the reply names.
 * Name, serving and calories all come from the catalogue entry, never from the
 * reply text. A tap logs one serving and the chip turns into a confirmation
 * that says what was logged and how many calories it was.
 */
export const DishLogChips: React.FC<DishLogChipsProps> = ({ mentions, onLog }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { language } = useI18nState();
  const { formatNumber } = useFormat();
  const { activeRegion } = useRegion();
  const dir = useTextDirection();
  const arabic = language === 'ar';
  const [states, setStates] = useState<Record<string, ChipState>>({});

  if (mentions.length === 0) return null;

  const keyOf = (m: DishMention) => m.food.id || m.food.name;
  const nameOf = (m: DishMention) => foodDisplayName(m.food.name, m.food.nameAr, arabic).primary;
  const servingOf = (m: DishMention) => (arabic && m.serving.labelAr ? m.serving.labelAr : m.serving.label);

  const log = (m: DishMention) => {
    const key = keyOf(m);
    if (states[key]?.kind === 'logged') return;
    const outcome = onLog(m.food, m.serving);
    setStates((prev) => ({ ...prev, [key]: outcome ? { kind: 'logged', outcome } : { kind: 'failed' } }));
  };

  return (
    <View style={styles.wrap} testID="coach-log-chips">
      <View style={styles.row}>
        {mentions.map((m) => {
          const key = keyOf(m);
          const state = states[key] ?? { kind: 'idle' };
          const logged = state.kind === 'logged';
          return (
            <TouchableOpacity
              key={key}
              accessibilityRole="button"
              accessibilityLabel={t('coach.log.chipLabel', {
                name: nameOf(m),
                serving: servingOf(m),
                kcal: formatNumber(m.kcal),
              })}
              accessibilityState={{ disabled: logged }}
              disabled={logged}
              onPress={() => log(m)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
              ]}
            >
              <Icon
                name={logged ? 'check' : 'plus'}
                size={16}
                color={logged ? theme.colors.successText : theme.colors.textPrimary}
                strokeWidth={2.6}
              />
              <Text style={[styles.chipText, dir.text, { color: theme.colors.textPrimary }]}>
                {t('coach.log.chip', { name: nameOf(m), kcal: formatNumber(m.kcal) })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {mentions.map((m) => {
        const state = states[keyOf(m)];
        if (!state || state.kind === 'idle') return null;
        return (
          <Text
            key={`note-${keyOf(m)}`}
            accessibilityLiveRegion="polite"
            style={[
              styles.note,
              dir.text,
              { color: state.kind === 'logged' ? theme.colors.successText : theme.colors.danger },
            ]}
          >
            {state.kind === 'logged'
              ? t('coach.log.done', {
                  name: nameOf(m),
                  serving: servingOf(m),
                  meal: t(`tracker.mealSlots.${state.outcome.slot}.${activeRegion}`),
                  kcal: formatNumber(m.kcal),
                })
              : t('coach.log.failed')}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: 6, marginBottom: 10, maxWidth: '85%', alignSelf: 'flex-start', gap: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: commonRadii.pill,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipText: { flexShrink: 1, fontSize: 14, fontWeight: '700' },
  note: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
});
