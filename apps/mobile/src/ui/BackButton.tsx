import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../theme.js';
import { useTranslation, useTextDirection } from '../i18n/index.js';
import { Icon } from './Icon.js';

interface BackButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** 'icon' is the round arrow-only version for modal headers that carry a title. */
  variant?: 'pill' | 'icon';
  /** Screen-reader name when it should say more than "Back". */
  label?: string;
}

/**
 * The one "Back" control for a screen's top edge: an arrow and the word, in a
 * pill, at least 44 px tall. Screens had grown five slightly different ones.
 */
export const BackButton: React.FC<BackButtonProps> = ({ onPress, style, variant = 'pill', label }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();

  return (
    <TouchableOpacity
      style={[
        variant === 'icon' ? styles.iconButton : styles.button,
        { backgroundColor: theme.colors.surfaceSecondary },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label ?? t('common.back')}
    >
      <Icon
        name={dir.isRTL ? 'arrow-right' : 'arrow-left'}
        size={variant === 'icon' ? 18 : 16}
        color={theme.colors.textPrimary}
      />
      {variant === 'pill' && (
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>{t('common.back')}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});
