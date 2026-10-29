import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { noOutlineStyle } from '../../ui/AppleInput.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { foodDisplayName } from '../foodDisplayName.js';
import { styles } from './MealLogHubModal.styles.js';
import type { MealBasketEntry } from './useMealBasket.js';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

/** Names a custom meal before saving it as a preset. Sits at the top, above the keyboard. */
export const PresetNamingBar: React.FC<{
  name: string;
  onChangeName: (name: string) => void;
  onSave: () => void;
}> = ({ name, onChangeName, onSave }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.basketBar,
        {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.presetNameRow}>
        <TextInput
          style={[
            styles.presetNameInput,
            noOutlineStyle,
            {
              backgroundColor: theme.colors.canvas,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
            },
          ]}
          value={name}
          onChangeText={onChangeName}
          placeholder={t('tracker.hub.presetNamePlaceholder')}
          accessibilityLabel={t('tracker.hub.presetNameLabel')}
          placeholderTextColor={theme.colors.textMuted}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={onSave}
        />
        <TouchableOpacity
          style={[styles.basketConfirmBtn, { backgroundColor: theme.colors.primaryLime }]}
          onPress={onSave}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[styles.basketConfirmText, { color: theme.colors.limeText }]}>
            {t('tracker.hub.savePresetConfirm')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/** The custom meal so far, with "save as preset" and "log custom meal". */
export const BasketSummaryBar: React.FC<{
  basket: MealBasketEntry[];
  totals: { kcal: number; count: number };
  onStartNaming: () => void;
  onConfirm: () => void;
}> = ({ basket, totals, onStartNaming, onConfirm }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  return (
    <View
      style={[
        styles.basketBar,
        { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
      ]}
    >
      <View style={styles.basketInfo}>
        <Text style={[styles.basketCount, { color: theme.colors.textPrimary }]}>
          {t('tracker.hub.basketCount', { count: totals.count })}
        </Text>
        <Text style={[styles.basketKcal, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          ≈{t('common.kcalValue', { value: Math.round(totals.kcal) })} · {basket.map((e) => `${e.quantity}x ${foodDisplayName(e.food.name, e.food.nameAr, dir.isRTL).primary}`).join(', ')}
        </Text>
        <TouchableOpacity onPress={onStartNaming} hitSlop={HIT_SLOP} accessibilityRole="button">
          <Text style={[styles.savePresetLink, { color: theme.colors.primaryAccessible }]}>
            {t('tracker.hub.saveAsPreset')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.basketConfirmBtn, { backgroundColor: theme.colors.primaryLime }]}
        onPress={onConfirm}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text style={[styles.basketConfirmText, { color: theme.colors.limeText }]}>
          {t('tracker.hub.logCustomMeal')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
