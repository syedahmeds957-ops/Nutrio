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
 * - Selected = filled lime background plus a mark. Font weight and border
 *   width never change, so an option keeps its width when picked. The mark
 *   sits inside the option in a slot that is always reserved: a pick-any chip
 *   shows a small check box there once picked (and nothing before, so a row
 *   of chips stays calm), a row shows an empty ring or box. Only the
 *   single-choice corner badge (check="badge" in radio mode) floats on the edge.
 * - Not selected still reads as tappable: normal text colour and a visible
 *   border, never greyed out. Single choice draws a ROUND mark (radio),
 *   multiple choice a SQUARE one (check box), so the two never look alike.
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

/** Lime when selected; otherwise a plain surface with full-strength text and a visible border. */
export function useOptionColors() {
  const { theme } = useTheme();
  const c = theme.colors;
  return (selected: boolean): OptionColors => ({
    container: {
      backgroundColor: selected ? c.primaryLime : c.surface,
      borderColor: selected ? c.primaryLime : c.textMuted,
    },
    text: { color: selected ? c.limeText : c.textPrimary },
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
  /**
   * Where the check goes: a badge (default) or a slot at the end of the row.
   * A pick-any chip with the default badge puts its check box inside the chip, in a reserved slot.
   */
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
  const square = mode === 'toggle';
  const c = theme.colors;
  // A pick-any chip keeps its check box inside the chip, so it never overlaps the border.
  const chipSlot = check === 'badge' && square;
  const checkNode = chipSlot ? (
    // Always laid out, so the chip is the same width picked or not; only drawn once picked.
    <View
      style={[styles.chipBox, selected && { backgroundColor: c.limeText }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {selected ? <Icon name="check" size={11} color={c.primaryLime} strokeWidth={3} /> : null}
    </View>
  ) : check === 'badge' ? (
    selected ? (
      <View style={[styles.badge, { backgroundColor: c.limeText }]}>
        <Icon name="check" size={11} color={c.primaryLime} strokeWidth={3} />
      </View>
    ) : null
  ) : (
    // Round ring (pick one) or square box (pick any); always drawn so the row never shifts.
    <View
      style={[
        styles.slot,
        square ? styles.squareRadius : styles.roundRadius,
        {
          borderColor: selected ? c.limeText : c.textMuted,
          backgroundColor: selected && square ? c.limeText : 'transparent',
        },
      ]}
    >
      {selected && square ? <Icon name="check" size={13} color={c.primaryLime} strokeWidth={3} /> : null}
      {selected && !square ? <View style={[styles.dot, { backgroundColor: c.limeText }]} /> : null}
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
      style={[styles.base, colors.container, check === 'inline' && styles.inlineRow, chipSlot && styles.chipRow, style]}
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
  chipRow: { flexDirection: 'row', gap: 6 },
  chipBox: { width: 16, height: 16, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
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
  slot: { width: 20, height: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  roundRadius: { borderRadius: 10 },
  squareRadius: { borderRadius: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
