import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { OptionButton, OptionGroup, useOptionColors, type OptionMode } from '../../ui/Selectable.js';

/** Lime when selected, quiet surface otherwise: the survey's chip language (one shared style). */
export const useChipColors = useOptionColors;

/**
 * A wizard chip. `mode` is 'radio' for a single choice (inside a
 * `ChipGroup mode="radio"`) and 'toggle' (default) for pick-any.
 */
export const Chip: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: object;
  mode?: OptionMode;
}> = ({ label, selected, onPress, style, mode = 'toggle' }) => (
  <OptionButton label={label} selected={selected} onPress={onPress} mode={mode} style={[styles.chip, style]} labelStyle={styles.chipText} />
);

/** A labelled group of chips: a radiogroup for a single choice, a group for pick-any. */
export const ChipGroup: React.FC<{ label: string; mode: OptionMode; style?: object; children: React.ReactNode }> = ({
  label,
  mode,
  style,
  children,
}) => (
  <OptionGroup label={label} mode={mode} style={[styles.wrap, style]}>
    {children}
  </OptionGroup>
);

export const Question: React.FC<{ children: string; optional?: boolean }> = ({ children, optional }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  return (
    <Text style={[styles.question, dir.text, { color: theme.colors.textPrimary }]}>
      {children}
      {optional ? (
        <Text style={{ color: theme.colors.textSecondary, fontWeight: '500' }}>{` · ${t('workout.setup.optional')}`}</Text>
      ) : null}
    </Text>
  );
};

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 16, paddingVertical: 0, minWidth: 44 },
  chipText: { fontSize: 13 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  question: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
});
