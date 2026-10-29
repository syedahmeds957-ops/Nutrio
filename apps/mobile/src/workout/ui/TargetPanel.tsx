import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Prescription, Target } from '@nutrio/workout-core';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { reasonText, reasonTone, targetText } from '../format.js';

interface TargetPanelProps {
  target: Target;
  unit: Prescription['unit'];
  tracksLoad: boolean;
}

/** Today's target for one exercise and the one-line reason it changed (or didn't). */
export const TargetPanel: React.FC<TargetPanelProps> = ({ target, unit, tracksLoad }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const dir = useTextDirection();
  const tone = reasonTone(target);
  const up = tone === 'up';
  const fg = up ? (c.successText) : c.textSecondary;

  return (
    <View style={[styles.panel, { backgroundColor: up ? c.successLight : c.surfaceSecondary }]}>
      <View style={[styles.badge, { backgroundColor: up ? c.success : c.border }]}>
        {tone === 'same' ? (
          <Text style={[styles.equals, { color: c.textPrimary }]}>=</Text>
        ) : (
          <Icon
            name={tone === 'new' ? 'star' : 'arrow-up'}
            size={13}
            color={up ? '#FFFFFF' : c.textPrimary}
            strokeWidth={2.5}
            style={tone === 'down' ? styles.down : undefined}
          />
        )}
      </View>
      <View style={styles.flex}>
        <Text style={[styles.target, dir.text, { color: c.textPrimary }]}>{targetText(t, target, unit, tracksLoad)}</Text>
        <Text style={[styles.reason, dir.text, { color: fg }]}>{reasonText(t, target, tracksLoad)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  badge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  equals: { fontSize: 14, fontWeight: '800', lineHeight: 16 },
  down: { transform: [{ rotate: '180deg' }] },
  flex: { flex: 1, minWidth: 0 },
  target: { fontSize: 15, fontWeight: '800' },
  reason: { fontSize: 12, fontWeight: '600', marginTop: 1, lineHeight: 17 },
});
