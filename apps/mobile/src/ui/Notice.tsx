import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Icon, IconName } from './Icon.js';
import { useTheme } from '../theme.js';

export type NoticeTone = 'neutral' | 'info' | 'warning' | 'danger';

interface NoticeProps {
  tone?: NoticeTone;
  /** Defaults to the tone's own icon (alert / info). */
  icon?: IconName;
  title?: string;
  children: React.ReactNode;
  /** Single-line pill for status chips; the default is a full-width message. */
  compact?: boolean;
  style?: ViewStyle;
}

const TONE_ICON: Record<NoticeTone, IconName> = {
  neutral: 'info',
  info: 'info',
  warning: 'alert',
  danger: 'alert',
};

/**
 * The app's one inline message: a quiet tinted surface, a line icon and plain
 * text. Replaces emoji-prefixed text so alerts read as part of the UI rather
 * than as pasted-in copy.
 */
export const Notice: React.FC<NoticeProps> = ({
  tone = 'neutral',
  icon,
  title,
  children,
  compact,
  style,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const accent =
    tone === 'danger' ? c.danger : tone === 'warning' ? c.warning : tone === 'info' ? c.primaryAccessible : c.textMuted;
  const bg =
    tone === 'danger' ? c.dangerLight : tone === 'warning' ? c.warningLight : c.surfaceSecondary;

  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      style={[
        styles.base,
        compact ? styles.compact : styles.full,
        { backgroundColor: bg, borderColor: tone === 'neutral' ? c.border : accent + '55' },
        style,
      ]}
    >
      <Icon name={icon ?? TONE_ICON[tone]} size={compact ? 14 : 16} color={accent} strokeWidth={2.2} />
      <View style={styles.body}>
        {title ? <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text> : null}
        <Text style={[styles.text, { color: title ? c.textSecondary : c.textPrimary }]}>{children}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  full: { gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, alignItems: 'flex-start' },
  compact: { gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 9999, alignSelf: 'center' },
  body: { flexShrink: 1 },
  title: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  text: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
});
