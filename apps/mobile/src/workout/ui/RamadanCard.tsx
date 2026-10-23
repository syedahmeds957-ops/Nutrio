import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { currentOrNextRamadan, isRamadan, type RamadanSlot, type WorkoutSettings } from '@nutrio/workout-core';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { setRamadanSlot, toggleRamadan } from '../setupState.js';
import { Chip } from './SetupChips.js';
import { monthName } from '../format.js';

const SLOTS: RamadanSlot[] = ['after_suhoor', 'before_iftar', 'after_taraweeh'];

interface RamadanCardProps {
  ramadan: WorkoutSettings['ramadan'];
  /** Today, to say whether Ramadan is on now or when it starts. */
  todayKey: string;
  onChange: (ramadan: WorkoutSettings['ramadan']) => void;
}

/**
 * The Ramadan mode switch and, when on, when the user will train. It only
 * changes the plan during Ramadan; the line under it says when that is.
 * Used in setup step 3 and on the week.
 */
export const RamadanCard: React.FC<RamadanCardProps> = ({ ramadan, todayKey, onChange }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const dir = useTextDirection();
  // The setup helpers only read and write `ramadan`, so a minimal settings object is enough here.
  const asSettings = { ramadan } as WorkoutSettings;
  const next = currentOrNextRamadan(todayKey);
  const dateOf = (key: string) => {
    const [year, month, day] = key.split('-').map(Number);
    return t('workout.ramadan.date', { day, month: monthName(t, month - 1), year });
  };
  const status = !next
    ? null
    : isRamadan(todayKey)
      ? ramadan.enabled
        ? t('workout.ramadan.onNow', { date: dateOf(next.end) })
        : t('workout.ramadan.isRamadan', { date: dateOf(next.end) })
      : ramadan.enabled
        ? t('workout.ramadan.turnsOn', { date: dateOf(next.start) })
        : t('workout.ramadan.next', { date: dateOf(next.start) });

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: ramadan.enabled ? c.primaryLime : c.border }]}>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: c.primaryLight }]}>
          <Icon name="moon" size={18} color={c.primaryTintText} />
        </View>
        <View style={styles.flex}>
          <Text nativeID="ramadan-label" style={[styles.title, dir.text, { color: c.textPrimary }]}>
            {t('workout.ramadan.title')}
          </Text>
          <Text style={[styles.sub, dir.text, { color: c.textSecondary }]}>{t('workout.ramadan.subtitle')}</Text>
          {status ? (
            <Text accessibilityLiveRegion="polite" style={[styles.status, dir.text, { color: ramadan.enabled ? c.primaryAccessible : c.textSecondary }]}>
              {status}
            </Text>
          ) : null}
        </View>
        <Switch
          accessibilityLabel={t('workout.ramadan.title')}
          value={ramadan.enabled}
          onValueChange={() => onChange(toggleRamadan(asSettings).ramadan)}
          trackColor={{ false: c.border, true: c.primaryLime }}
          thumbColor="#FFFFFF"
        />
      </View>
      {ramadan.enabled ? (
        <>
          <Text style={[styles.when, dir.text, { color: c.textPrimary }]}>{t('workout.ramadan.whenQ')}</Text>
          <View style={styles.slots}>
            {SLOTS.map((slot) => (
              <Chip
                key={slot}
                label={t(`workout.ramadan.slot.${slot}`)}
                selected={ramadan.slot === slot}
                onPress={() => onChange(setRamadanSlot(asSettings, slot).ramadan)}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: 18, borderWidth: 1, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  status: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  when: { fontSize: 13, fontWeight: '700' },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
