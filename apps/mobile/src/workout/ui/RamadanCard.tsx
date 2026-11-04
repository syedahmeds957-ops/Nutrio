import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { currentOrNextRamadan, isRamadan, type RamadanSlot, type WorkoutSettings } from '@nutrio/workout-core';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { setRamadanSlot, toggleRamadan } from '../setupState.js';
import { Chip, ChipGroup } from './SetupChips.js';
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
        {/* A drawn switch: the whole 44 px box is the touch target (the stock one is 40x20). */}
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel={t('workout.ramadan.title')}
          aria-checked={ramadan.enabled}
          accessibilityState={{ checked: ramadan.enabled }}
          onPress={() => onChange(toggleRamadan(asSettings).ramadan)}
          style={styles.switchHit}
        >
          <View style={[styles.track, { backgroundColor: ramadan.enabled ? c.primaryLime : c.border }]}>
            <View style={[styles.thumb, ramadan.enabled ? styles.thumbOn : styles.thumbOff]} />
          </View>
        </Pressable>
      </View>
      {ramadan.enabled ? (
        <>
          <Text style={[styles.when, dir.text, { color: c.textPrimary }]}>{t('workout.ramadan.whenQ')}</Text>
          <ChipGroup label={t('workout.ramadan.whenQ')} mode="radio" style={styles.slots}>
            {SLOTS.map((slot) => (
              <Chip
                mode="radio"
                key={slot}
                label={t(`workout.ramadan.slot.${slot}`)}
                selected={ramadan.slot === slot}
                onPress={() => onChange(setRamadanSlot(asSettings, slot).ramadan)}
              />
            ))}
          </ChipGroup>
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
  switchHit: { minWidth: 52, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  track: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  thumbOn: { alignSelf: 'flex-end' },
  thumbOff: { alignSelf: 'flex-start' },
  slots: { marginBottom: 0 },
});
