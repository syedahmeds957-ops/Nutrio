import React, { useMemo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection, useI18nState } from '../../i18n/index.js';
import { HapticFeedback } from '../../ui/haptics.js';
import { LabelledServing, PERSONAL_SERVING_ID } from '../personalServings.js';
import { servingDisplayLabel } from '../servingLabel.js';
import { createStyles } from './ItemCustomizerModal.styles.js';

const ACCENT = '#A4EB3F';
const ACCENT_TEXT_LIGHT = '#4B6200';
const ERROR = '#DC2626';

export interface PortionPickerProps {
  /** Sits inside another card (no border, padding or margin of its own). */
  embedded?: boolean;
  servings: LabelledServing[];
  selectedIndex: number;
  onSelectServing: (index: number) => void;
  isCustomWeight: boolean;
  onToggleCustomWeight: () => void;
  /** The grams field exactly as typed, so a half-typed "1." is not rewritten. */
  gramsText: string;
  /** False when the typed weight is not a number in range; logging is blocked. */
  gramsValid: boolean;
  onGramsTextChange: (text: string) => void;
  onAdjustGrams: (delta: number) => void;
  /** Saves the typed weight as this user's standard serving for the food. */
  onSaveAsMine: () => void;
  /** Drops the saved serving, back to the catalogue's. */
  onResetMine: () => void;
}

const GRAM_STEPS = [-50, -10, 10, 50];

/**
 * Portion choice for the customizer: the food's servings as pills (the user's
 * own saved serving first, when there is one), or an exact weight typed in
 * grams that can be saved as their standard serving for next time.
 */
export const PortionPicker: React.FC<PortionPickerProps> = ({
  embedded = false,
  servings,
  selectedIndex,
  onSelectServing,
  isCustomWeight,
  onToggleCustomWeight,
  gramsText,
  gramsValid,
  onGramsTextChange,
  onAdjustGrams,
  onSaveAsMine,
  onResetMine,
}) => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme]);
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const accentText = isDark ? ACCENT : ACCENT_TEXT_LIGHT;
  const hasPersonal = servings.some((s) => s.personalId === PERSONAL_SERVING_ID);

  return (
    <View
      style={
        embedded
          ? [styles.portionEmbedded, { borderTopColor: theme.colors.border }]
          : [styles.portionControlCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]
      }
    >
      <View style={styles.portionHeaderRow}>
        <Text style={[styles.portionSectionTitle, dir.text, { color: theme.colors.textMuted }]}>
          {t('tracker.customizer.portionSize')}
        </Text>
        <TouchableOpacity
          onPress={() => {
            HapticFeedback.selection();
            onToggleCustomWeight();
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={[styles.toggleCustomGramsText, { color: accentText }]}>
            {isCustomWeight ? t('tracker.customizer.standardServings') : t('tracker.customizer.customWeight')}
          </Text>
        </TouchableOpacity>
      </View>

      {!isCustomWeight ? (
        <>
          <View style={styles.servingsPillRow}>
            {servings.map((srv, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <TouchableOpacity
                  key={`${srv.personalId ?? 'srv'}_${idx}`}
                  style={[
                    styles.servingPill,
                    { backgroundColor: isDark ? '#1C1D24' : '#F8FAFC', borderColor: theme.colors.border },
                    isSelected && styles.servingPillActive,
                  ]}
                  onPress={() => {
                    HapticFeedback.selection();
                    onSelectServing(idx);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  aria-checked={isSelected}
                >
                  <Text style={[styles.servingPillText, { color: theme.colors.textMuted }, isSelected && styles.servingPillTextActive]}>
                    {servingDisplayLabel(srv.label || srv.description || '', language)}
                  </Text>
                  <Text style={[styles.servingPillGrams, { color: theme.colors.textMuted }, isSelected && styles.servingPillGramsActive]}>
                    {t('common.gramsValue', { value: srv.grams })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {hasPersonal && (
            <TouchableOpacity onPress={onResetMine} activeOpacity={0.7} accessibilityRole="button" style={styles.portionFooterRow}>
              <Text style={[styles.resetMineText, { color: theme.colors.textMuted }]}>
                {t('tracker.customizer.resetMyServing')}
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.customGramsBox}>
          <Text style={[styles.customGramsPrompt, { color: theme.colors.textMuted }]}>
            {t('tracker.customizer.customWeightHint')}
          </Text>

          {/* The field gets its own line: five controls in one row overflow a phone. */}
          <View
            style={[
              styles.gramDisplayBadge,
              styles.gramsInputBox,
              {
                backgroundColor: isDark ? '#1F2410' : '#F4FCE3',
                borderColor: gramsValid ? ACCENT : ERROR,
              },
            ]}
          >
            <TextInput
              style={[styles.gramDisplayNumber, styles.gramsInput, { color: isDark ? ACCENT : '#1C1917' }]}
              value={gramsText}
              onChangeText={onGramsTextChange}
              keyboardType="decimal-pad"
              inputMode="decimal"
              selectTextOnFocus
              maxLength={7}
              accessibilityLabel={t('tracker.customizer.gramsField')}
            />
            <Text style={[styles.gramDisplayUnit, { color: isDark ? ACCENT : '#4B6200' }]}>g</Text>
          </View>

          <View style={styles.gramsAdjustRow}>
            {GRAM_STEPS.map((delta) => (
              <GramChip key={delta} delta={delta} onPress={onAdjustGrams} />
            ))}
          </View>

          {!gramsValid && (
            <Text style={[styles.gramsErrorText, { color: ERROR }]} accessibilityLiveRegion="polite">
              {t('tracker.customizer.gramsInvalid')}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.saveMineButton, { borderColor: accentText }, !gramsValid && styles.saveMineButtonDisabled]}
            onPress={onSaveAsMine}
            disabled={!gramsValid}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ disabled: !gramsValid }}
          >
            <Text style={[styles.saveMineText, { color: accentText }]}>
              {t('tracker.customizer.saveAsMyServing', { grams: gramsText })}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const GramChip: React.FC<{ delta: number; onPress: (delta: number) => void }> = ({ delta, onPress }) => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme]);
  const { t } = useTranslation();
  const label = `${delta > 0 ? '+' : ''}${t('common.gramsValue', { value: delta })}`;
  return (
    <TouchableOpacity
      style={[styles.gramChip, { backgroundColor: theme.colors.border }]}
      onPress={() => onPress(delta)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.gramChipText, { color: theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};
