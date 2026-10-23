import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { startingLoad, stepLoad, type Exercise, type LoggedSet, type Prescription, type WorkoutSettings } from '@nutrio/workout-core';
import { useTheme } from '../../theme.js';
import { useTranslation } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { HapticFeedback } from '../../ui/haptics.js';
import { kgNumber } from '../format.js';

/** Arabic keyboards type Arabic-Indic digits and "٫"; read them as plain numbers. */
export function parseNumber(text: string): number | undefined {
  const western = text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٫,]/g, '.')
    .trim();
  if (western === '') return undefined;
  const value = Number(western);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

interface StepperProps {
  value: number | undefined;
  format: (value: number) => string;
  onMinus: () => void;
  onPlus: () => void;
  onType: (value: number | undefined) => void;
  minusLabel: string;
  plusLabel: string;
  fieldLabel: string;
  decimal?: boolean;
}

/** − value +, with the value typeable for big jumps. */
export const Stepper: React.FC<StepperProps> = ({ value, format, onMinus, onPlus, onType, minusLabel, plusLabel, fieldLabel, decimal }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const shown = value === undefined ? '' : format(value);
  const [text, setText] = useState(shown);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(shown);
  }, [shown, editing]);

  const button = (label: string, icon: 'minus' | 'plus', onPress: () => void) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        void HapticFeedback.selection();
        onPress();
      }}
      hitSlop={{ top: 6, bottom: 6 }}
      style={[styles.stepButton, { backgroundColor: c.surfaceSecondary }]}
    >
      <Icon name={icon} size={14} color={c.textPrimary} strokeWidth={2.5} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.stepper}>
      {button(minusLabel, 'minus', onMinus)}
      <TextInput
        accessibilityLabel={fieldLabel}
        value={text}
        placeholder="—"
        placeholderTextColor={c.textSecondary}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        selectTextOnFocus
        onFocus={() => setEditing(true)}
        onChangeText={setText}
        onBlur={() => {
          setEditing(false);
          onType(parseNumber(text));
        }}
        onSubmitEditing={() => onType(parseNumber(text))}
        style={[styles.value, { color: c.textPrimary }]}
      />
      {button(plusLabel, 'plus', onPlus)}
    </View>
  );
};

interface SetLoggerProps {
  exercise: Exercise;
  unit: Prescription['unit'];
  settings: WorkoutSettings;
  sets: LoggedSet[];
  onReps: (setIndex: number, reps: number) => void;
  onLoad: (setIndex: number, loadKg: number | undefined) => void;
  onToggle: (setIndex: number) => void;
}

const SECONDS_STEP = 5;

/** The set rows for one exercise: weight, reps (or seconds) and a tick per set. */
export const SetLogger: React.FC<SetLoggerProps> = ({ exercise, unit, settings, sets, onReps, onLoad, onToggle }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const activeIndex = sets.findIndex((set) => !set.done);
  const repStep = unit === 'seconds' ? SECONDS_STEP : 1;
  const repsLabel = unit === 'seconds' ? t('workout.log.seconds') : t('workout.log.reps');

  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerSet, { color: c.textSecondary }]}>{t('workout.log.set')}</Text>
        <Text style={[styles.headerCell, { color: c.textSecondary }]}>{exercise.tracksLoad ? t('workout.log.kg') : ''}</Text>
        <Text style={[styles.headerCell, { color: c.textSecondary }]}>{repsLabel}</Text>
        <View style={styles.headerCheck} />
      </View>
      {sets.map((set, index) => {
        const active = index === activeIndex;
        const number = index + 1;
        return (
          <View
            key={index}
            style={[
              styles.row,
              { borderColor: active ? c.primaryLime : 'transparent' },
              set.done && { backgroundColor: c.primaryLight },
              !set.done && !active && styles.pending,
            ]}
          >
            <Text style={[styles.setNumber, { color: c.textPrimary }]}>{number}</Text>
            {exercise.tracksLoad ? (
              <Stepper
                value={set.loadKg}
                format={kgNumber}
                decimal
                onMinus={() => set.loadKg !== undefined && onLoad(index, stepLoad(exercise, settings, set.loadKg, -1))}
                onPlus={() => onLoad(index, set.loadKg === undefined ? startingLoad(exercise, settings) : stepLoad(exercise, settings, set.loadKg, 1))}
                onType={(kg) => onLoad(index, kg)}
                minusLabel={t('workout.log.lessWeight', { number })}
                plusLabel={t('workout.log.moreWeight', { number })}
                fieldLabel={t('workout.log.weightField', { number })}
              />
            ) : (
              <Text style={[styles.bodyweight, { color: c.textSecondary }]} numberOfLines={1}>
                {t('workout.log.bodyweight')}
              </Text>
            )}
            <Stepper
              value={set.reps}
              format={String}
              onMinus={() => onReps(index, Math.max(0, set.reps - repStep))}
              onPlus={() => onReps(index, set.reps + repStep)}
              onType={(reps) => reps !== undefined && onReps(index, reps)}
              minusLabel={t('workout.log.fewerReps', { number })}
              plusLabel={t('workout.log.moreReps', { number })}
              fieldLabel={t('workout.log.repsField', { number })}
            />
            <TouchableOpacity
              accessibilityRole="checkbox"
              // aria-checked rather than accessibilityState: react-native-web only reads the aria prop.
              aria-checked={set.done}
              accessibilityLabel={t('workout.log.tick', { number })}
              onPress={() => onToggle(index)}
              style={[
                styles.check,
                set.done ? { backgroundColor: c.primaryLime } : { backgroundColor: c.surfaceSecondary, borderColor: c.border, borderWidth: 1 },
              ]}
            >
              <Icon name="check" size={18} color={set.done ? c.limeText : c.textSecondary} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  table: { gap: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6 },
  headerSet: { width: 24, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  headerCell: { flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  headerCheck: { width: 44 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 14, borderWidth: 2 },
  pending: { opacity: 0.55 },
  setNumber: { width: 24, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  stepper: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  stepButton: { width: 30, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: '800', textAlign: 'center', paddingVertical: 6, paddingHorizontal: 0 },
  bodyweight: { flex: 1, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  check: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
