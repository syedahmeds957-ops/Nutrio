import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from '../../ui/Icon.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

interface WorkoutHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  /** A text button, or a lime pill (`primary`) such as Finish while logging. */
  action?: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean };
}

/** Back button, title and an optional action: the header every workout screen shares. */
export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({ title, subtitle, onBack, action }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const dir = useTextDirection();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={onBack}
        style={[styles.backBtn, { backgroundColor: c.surface, borderColor: c.border }]}
      >
        <Icon name="arrow-left" size={18} color={c.textPrimary} style={dir.isRTL ? styles.flipped : undefined} />
      </TouchableOpacity>
      <View style={styles.titles}>
        <Text accessibilityRole="header" numberOfLines={1} style={[styles.title, dir.text, { color: c.textPrimary }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[styles.subtitle, dir.text, { color: c.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: Boolean(action.disabled) }}
          disabled={action.disabled}
          onPress={action.onPress}
          style={[
            styles.action,
            action.primary && [styles.primaryAction, { backgroundColor: c.primaryLime }],
            action.disabled && styles.disabled,
          ]}
        >
          <Text style={[styles.actionText, { color: action.primary ? c.limeText : c.primaryAccessible }]}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  flipped: { transform: [{ scaleX: -1 }] },
  titles: { flex: 1, minWidth: 0 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  action: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center' },
  primaryAction: { paddingHorizontal: 18, borderRadius: 999 },
  disabled: { opacity: 0.4 },
  actionText: { fontSize: 14, fontWeight: '700' },
});
