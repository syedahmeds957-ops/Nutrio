import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NamedModal } from '../../ui/NamedModal.js';
import { type NormalizedFood, type RegionCode } from '@nutrio/food-db';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { requestDishBreakdown, type DishBreakdownResult } from '../../ai/dishBreakdown.js';
import { saveCustomDish } from '../customDishes.js';

interface AddDishModalProps {
  visible: boolean;
  /** What the user typed into search; becomes the dish's name. */
  dishName: string;
  region: RegionCode;
  onClose: () => void;
  /** The saved dish, handed on to the normal portion picker to log. */
  onDishAdded: (dish: NormalizedFood) => void;
}

type ScreenState = { kind: 'loading' } | DishBreakdownResult;

/**
 * Adds a dish the catalogue does not have. The server works out what goes into
 * one serving; this screen prices it from the food database, shows the user
 * the breakdown, and saves it to their own private list before logging it.
 */
export const AddDishModal: React.FC<AddDishModalProps> = ({
  visible,
  dishName,
  region,
  onClose,
  onDishAdded,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const accentInk = isDark ? accentColor : '#4B6200';
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });

  const lookUp = useCallback(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    requestDishBreakdown(dishName.trim(), region).then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [dishName, region]);

  useEffect(() => {
    if (!visible || !dishName.trim()) return;
    return lookUp();
  }, [visible, dishName, lookUp]);

  const handleSave = () => {
    if (!('ok' in state) || !state.ok) return;
    saveCustomDish(state.recipe.food);
    onDishAdded(state.recipe.food);
  };

  const renderBody = () => {
    if (!('ok' in state)) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={accentColor} />
          <Text style={[styles.mutedText, dir.textCenter, { color: theme.colors.textSecondary }]}>
            {t('tracker.addDish.loading', { name: dishName })}
          </Text>
        </View>
      );
    }

    if (!state.ok) {
      return (
        <View style={styles.centered}>
          <Icon name="alert" size={24} color={theme.colors.textSecondary} />
          <Text style={[styles.mutedText, dir.textCenter, { color: theme.colors.textSecondary }]}>
            {t(`tracker.addDish.errors.${state.reason}`, {
              name: dishName,
              missing: 'missing' in state ? state.missing.map((m) => m.name).join(', ') : '',
            })}
          </Text>
          {state.reason === 'unavailable' && (
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
              onPress={lookUp}
              accessibilityRole="button"
            >
              <Text style={[styles.secondaryBtnText, { color: theme.colors.textPrimary }]}>
                {t('tracker.addDish.retry')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    const { recipe, servingDescription } = state;
    const totals = recipe.ingredients.reduce(
      (sum, i) => ({
        protein: sum.protein + i.proteinGrams,
        carbs: sum.carbs + i.carbGrams,
        fat: sum.fat + i.fatGrams,
      }),
      { protein: 0, carbs: 0, fat: 0 }
    );

    return (
      <>
        <View style={[styles.totalCard, { backgroundColor: theme.colors.surfaceSecondary }]}>
          <Text style={[styles.totalKcal, { color: theme.colors.textPrimary }]}>
            {t('common.kcalValue', { value: recipe.kcalPerServing })}
          </Text>
          <Text style={[styles.mutedText, dir.text, { color: theme.colors.textSecondary }]}>
            {servingDescription || t('tracker.addDish.oneServing', { grams: recipe.servingGrams })}
          </Text>
          <Text style={[styles.macroLine, dir.text, { color: theme.colors.textSecondary }]}>
            {t('common.macroLine', {
              protein: Math.round(totals.protein),
              carbs: Math.round(totals.carbs),
              fat: Math.round(totals.fat),
            })}
          </Text>
        </View>

        <Text style={[styles.sectionLabel, dir.text, { color: theme.colors.textSecondary }]}>
          {t('tracker.addDish.ingredientsHeading')}
        </Text>
        <ScrollView style={styles.ingredientList}>
          {recipe.ingredients.map((i) => (
            <View key={i.food.id ?? i.food.name} style={styles.ingredientRow}>
              <View style={styles.ingredientInfo}>
                <Text style={[styles.ingredientName, dir.text, { color: theme.colors.textPrimary }]}>
                  {i.food.name}
                </Text>
                <Text style={[styles.mutedText, dir.text, { color: theme.colors.textSecondary }]}>
                  {t('tracker.addDish.grams', { grams: i.grams })}
                </Text>
              </View>
              <Text style={[styles.ingredientKcal, { color: theme.colors.textPrimary }]}>
                {t('common.kcalValue', { value: i.kcal })}
              </Text>
            </View>
          ))}
          {recipe.notCounted.map((i) => (
            <View key={`missing_${i.name}`} style={styles.ingredientRow}>
              <View style={styles.ingredientInfo}>
                <Text style={[styles.ingredientName, dir.text, { color: theme.colors.textPrimary }]}>
                  {i.name}
                </Text>
                <Text style={[styles.mutedText, dir.text, { color: '#B45309' }]}>
                  {t('tracker.addDish.notCounted', { grams: i.grams })}
                </Text>
              </View>
              <Text style={[styles.ingredientKcal, { color: theme.colors.textMuted }]}>–</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={[styles.footnote, dir.text, { color: theme.colors.textMuted }]}>
          {t('tracker.addDish.footnote')}
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: accentColor }]}
          onPress={handleSave}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>{t('tracker.addDish.saveAndLog')}</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <NamedModal accessibilityName={t('a11y.dialog.addDish')} visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.header}>
            <Icon name="sparkles" size={18} color={accentInk} />
            <Text
              style={[styles.title, dir.text, { color: theme.colors.textPrimary }]}
              numberOfLines={2}
            >
              {dishName}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="x" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {renderBody()}
        </View>
      </View>
    </NamedModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  centered: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  mutedText: {
    fontSize: 13,
    lineHeight: 18,
  },
  totalCard: {
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  totalKcal: {
    fontSize: 26,
    fontWeight: '800',
  },
  macroLine: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ingredientList: {
    maxHeight: 260,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '600',
  },
  ingredientKcal: {
    fontSize: 14,
    fontWeight: '700',
  },
  footnote: {
    fontSize: 12,
    lineHeight: 17,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A0B0D',
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
