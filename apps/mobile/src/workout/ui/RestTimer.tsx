import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../i18n/index.js';
import { HapticFeedback } from '../../ui/haptics.js';
import { clockText } from '../format.js';

import { commonRadii } from '../../theme.js';
interface RestTimerProps {
  /** Epoch ms the rest ends at; the countdown reads the clock so it stays right after a stall. */
  endsAt: number;
  onAddTime: () => void;
  onSkip: () => void;
  onDone: () => void;
}

const TICK_MS = 250;

/** The floating dark capsule counting down rest between sets; buzzes at zero. */
export const RestTimer: React.FC<RestTimerProps> = ({ endsAt, onAddTime, onSkip, onDone }) => {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const left = Math.ceil((endsAt - now) / 1000);
  const over = left <= 0;
  useEffect(() => {
    if (!over) return;
    void HapticFeedback.notificationSuccess();
    onDone();
  }, [over]);

  return (
    <View accessibilityRole="timer" accessibilityLiveRegion="polite" style={styles.capsule}>
      <Text style={styles.label}>{t('workout.log.rest')}</Text>
      <Text style={styles.clock}>{clockText(left)}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={onAddTime} style={styles.button}>
        <Text style={styles.buttonText}>{t('workout.log.addRest')}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={onSkip} style={styles.button}>
        <Text style={styles.buttonText}>{t('workout.log.skipRest')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  capsule: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingStart: 18,
    paddingEnd: 6,
    paddingVertical: 6,
    borderRadius: commonRadii.pill,
    backgroundColor: '#0A0B0D',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  label: { color: '#9CA3AF', fontSize: 13, fontWeight: '700' },
  clock: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', minWidth: 52, fontVariant: ['tabular-nums'] },
  button: { minHeight: 44, paddingHorizontal: 14, borderRadius: commonRadii.pill, backgroundColor: '#272A33', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
