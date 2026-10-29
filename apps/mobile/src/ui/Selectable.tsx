import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme.js';
import { useTextDirection } from '../i18n/index.js';
import { Icon } from './Icon.js';

/**
 * The one selectable-option control for wizards and forms.
 *
 * - Single choice (`radio`): the group is a radiogroup, each option a radio
 *   with `aria-checked`.
 * - Multiple choice (`toggle`): each option is a button with `aria-pressed`.
 * - Selected = filled lime background plus a check. Font weight and border
 *   width never change, so an option keeps its width when picked; the check is
 *   a corner badge (chips, cards) or a slot that is always reserved (rows).
 *
 * react-native-web only reads the `aria-*` props, hence not accessibilityState
 * alone (`aria-selected` is not allowed on a role=button either).
 */
export type OptionMode = 'radio' | 'toggle';

/** Role and state for one option: pure, so the tests can assert it without rendering. */
export function optionA11y(mode: OptionMode, selected: boolean) {
  return mode === 'radio'
    ? ({ accessibilityRole: 'radio', 'aria-checked': selected, accessibilityState: { checked: selected } } as const)
    : ({ accessibilityRole: 'button', 'aria-pressed': selected, accessibilityState: { selected } } as const);
}

export interface OptionColors {
  container: { backgroundColor: string; borderColor: string };
  text: { color: string };
  sub: { color: string };
}

/** Lime when selected, quiet surface otherwise. */
export function useOptionColors() {
  const { theme } = useTheme();
  const c = theme.colors;
  return (selected: boolean): OptionColors => ({
    container: {
      backgroundColor: selected ? c.primaryLime : c.surface,
      borderColor: selected ? c.primaryLime : c.border,
    },
    text: { color: selected ? c.limeText : c.textSecondary },
    sub: { color: selected ? c.limeText : c.textSecondary },
  });
}

interface OptionGroupProps {
  /** What the group asks; read out with the group. */
  label: string;
  mode?: OptionMode;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const OptionGroup: React.FC<OptionGroupProps> = ({ label, mode = 'radio', style, children }) => (
  <View role={mode === 'radio' ? 'radiogroup' : 'group'} accessibilityLabel={label} style={style}>
    {children}
  </View>
);

interface OptionButtonProps {
  /** The visible text; it is also the accessible name unless `accessibilityLabel` starts with it. */
  label: string;
  selected: boolean;
  onPress: () => void;
  mode?: OptionMode;
  /** Where the check goes: a corner badge (default) or a slot at the end of the row. */
  check?: 'badge' | 'inline';
  /** Replaces the default label with custom content that follows the selected colours. */
  children?: (colors: OptionColors) => React.ReactNode;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const OptionButton: React.FC<OptionButtonProps> = ({
  label,
  selected,
  onPress,
  mode = 'radio',
  check = 'badge',
  children,
  accessibilityLabel,
  disabled,
  style,
  labelStyle,
  testID,
}) => {
  const { theme } = useTheme();
  const dir = useTextDirection();
  const colors = useOptionColors()(selected);
  const checkNode =
    check === 'badge' ? (
      selected ? (
        <View style={[styles.badge, { backgroundColor: theme.colors.limeText }]}>
          <Icon name="check" size={11} color={theme.colors.primaryLime} strokeWidth={3} />
        </View>
      ) : null
    ) : (
      <View style={[styles.slot, !selected && styles.slotHidden]}>
        <Icon name="check" size={18} color={theme.colors.limeText} strokeWidth={2.6} />
      </View>
    );

  return (
    <TouchableOpacity
      {...optionA11y(mode, selected)}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
      style={[styles.base, colors.container, check === 'inline' && styles.inlineRow, style]}
    >
      {children ? (
        children(colors)
      ) : (
        <Text style={[styles.label, check === 'inline' ? dir.text : dir.textCenter, colors.text, check === 'inline' && styles.labelInline, labelStyle]}>{label}</Text>
      )}
      {checkNode}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  // One weight for selected and not, so picking never changes the width.
  label: { fontSize: 14, fontWeight: '700' },
  labelInline: { flex: 1 },
  badge: {
    position: 'absolute',
    top: -6,
    end: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slot: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  slotHidden: { opacity: 0 },
});
