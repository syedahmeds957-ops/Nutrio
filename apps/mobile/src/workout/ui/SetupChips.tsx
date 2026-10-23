import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

/** Lime when selected, quiet surface otherwise: the survey's chip language. */
export function useChipColors() {
  const { theme } = useTheme();
  const c = theme.colors;
  return (selected: boolean) => ({
    container: {
      backgroundColor: selected ? c.primaryLime : c.surface,
      borderColor: selected ? c.primaryLime : c.border,
    },
    text: { color: selected ? c.limeText : c.textSecondary, fontWeight: selected ? ('800' as const) : ('600' as const) },
    sub: { color: selected ? c.limeText : c.textSecondary },
  });
}

export const Chip: React.FC<{ label: string; selected: boolean; onPress: () => void; style?: object }> = ({
  label,
  selected,
  onPress,
  style,
}) => {
  const colors = useChipColors()(selected);
  const dir = useTextDirection();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      aria-selected={selected}
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, colors.container, style]}
    >
      <Text style={[styles.chipText, colors.text, dir.textCenter]}>{label}</Text>
    </TouchableOpacity>
  );
};

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
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 13 },
  question: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
});
