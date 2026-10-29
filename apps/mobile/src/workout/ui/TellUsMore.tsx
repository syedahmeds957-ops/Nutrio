import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  getExercise,
  type BreakLength,
  type CardioHabit,
  type CardioKind,
  type PlankAbility,
  type PushUpAbility,
  type RoutineSplit,
  type SessionStyle,
  type SportKind,
  type TrainingBackground,
  type TrainingDuration,
  type WalkAbility,
  type Weekday,
  type WorkoutSettings,
} from '@nutrio/workout-core';
import { useRegion } from '../../common/region/index.js';
import { weekdaysFrom } from '../../tracker/weekStrip.js';
import { weekStartFor } from '../weekView.js';
import { useTheme } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { Notice } from '../../ui/Notice.js';
import {
  isBeginner,
  liftOf,
  liftRows,
  setLift,
  setTrainingNow,
  toggleExercisePreference,
  toggleSport,
  toggleSportDay,
  updateProfile,
} from '../setupState.js';
import { ExerciseImageLoop } from './ExerciseImageLoop.js';
import { ExercisePickerSheet } from './ExercisePickerSheet.js';
import { parseNumber } from './SetLogger.js';
import { Chip, ChipGroup, Question } from './SetupChips.js';

const BACKGROUNDS: TrainingBackground[] = ['never', 'a_little', 'used_to'];
const PUSH_UPS: PushUpAbility[] = ['none', '1_to_5', '6_to_15', '16_plus'];
const PLANKS: PlankAbility[] = ['under_20', '20_to_45', 'over_45'];
const WALKS: WalkAbility[] = ['under_10', '10_to_20', '20_to_40', 'over_40'];
const SPLITS: RoutineSplit[] = ['full_body', 'upper_lower', 'ppl', 'body_part', 'classes', 'other'];
const STYLES: SessionStyle[] = ['straight', 'supersets'];
const DURATIONS: TrainingDuration[] = ['under_3_months', '3_to_12_months', 'over_a_year'];
const BREAKS: BreakLength[] = ['under_1_month', '1_to_6_months', 'over_6_months'];
const HABITS: CardioHabit[] = ['none', 'under_15', '15_to_30', '30_to_60', 'over_60'];
const CARDIO_KINDS: CardioKind[] = ['walking', 'cycling', 'running', 'rowing', 'elliptical', 'stairs', 'swimming'];
const SPORTS: SportKind[] = ['football', 'cricket', 'padel', 'running', 'swimming', 'physical_job', 'other'];

type Picker = 'lift' | 'likes' | 'dislikes' | null;

interface TellUsMoreProps {
  /** Which of the three short screens. */
  part: 1 | 2 | 3;
  settings: WorkoutSettings;
  update: (settings: WorkoutSettings) => void;
  /** Opens the routine builder (people training now). */
  onOpenRoutine?: () => void;
  /**
   * Answers the survey already gave. Those questions become a one-line recap
   * with a Change link instead of being asked a second time.
   */
  fromSurvey?: { training: boolean; never: boolean };
}

/**
 * A number field that keeps what is typed and commits it when the field loses
 * focus. The whole box is the touch target: tapping the unit or the padding
 * focuses the input.
 */
const NumberField: React.FC<{ value?: number; label: string; suffix: string; onCommit: (value: number | undefined) => void }> = ({
  value,
  label,
  suffix,
  onCommit,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const shown = value === undefined || value === 0 ? '' : String(value);
  const [text, setText] = useState(shown);
  const input = useRef<TextInput>(null);
  useEffect(() => setText(shown), [shown]);
  return (
    // focusable={false}: the input is the one tab stop; the box only forwards taps to it.
    <Pressable focusable={false} onPress={() => input.current?.focus()} style={[styles.field, { borderColor: c.border, backgroundColor: c.surfaceSecondary }]}>
      <TextInput
        ref={input}
        accessibilityLabel={label}
        value={text}
        onChangeText={setText}
        onBlur={() => onCommit(parseNumber(text))}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={c.textSecondary}
        style={[styles.fieldInput, { color: c.textPrimary }]}
      />
      <Text style={[styles.fieldSuffix, { color: c.textSecondary }]}>{suffix}</Text>
    </Pressable>
  );
};

/**
 * The optional "Tell us more" screens. What they ask depends on earlier
 * answers: beginners get simple checks (push-ups, plank, walking), people
 * training now get their routine and current lifts, and people who stopped
 * get how long ago and what they used to lift.
 */
export const TellUsMore: React.FC<TellUsMoreProps> = ({ part, settings, update, onOpenRoutine, fromSurvey }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { activeRegion } = useRegion();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const [picker, setPicker] = useState<Picker>(null);
  /** Set when the user taps Change on a recap, so the full question comes back. */
  const [reasking, setReasking] = useState(false);
  const profile = settings.profile ?? {};
  const beginner = isBeginner(settings);
  const now = profile.trainingNow;
  const nameOf = (id: string) => getExercise(id)?.name[language] ?? id;

  /** One question's chips: a radiogroup for a single choice, a group for pick-any. */
  const chips = <T extends string>(
    values: readonly T[],
    selected: (value: T) => boolean,
    onPress: (value: T) => void,
    key: string,
    question: string,
    mode: 'radio' | 'toggle' = 'radio'
  ) => (
    <ChipGroup label={question} mode={mode}>
      {values.map((value) => (
        <Chip key={value} mode={mode} label={t(`workout.more.${key}.${value}`)} selected={selected(value)} onPress={() => onPress(value)} />
      ))}
    </ChipGroup>
  );

  const exerciseList = (list: 'likes' | 'dislikes') => {
    const ids = profile[list] ?? [];
    const tone = list === 'likes' ? { bg: c.successLight, fg: theme.isDark ? c.success : '#166534' } : { bg: c.dangerLight, fg: c.danger };
    return (
      <View style={styles.wrap}>
        {ids.map((id) => (
          <View key={id} style={[styles.pill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.pillText, { color: tone.fg }]}>{nameOf(id)}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('workout.more.remove', { name: nameOf(id) })}
              onPress={() => update(toggleExercisePreference(settings, list, id))}
              style={styles.pillRemove}
            >
              <Icon name="x" size={14} color={tone.fg} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity accessibilityRole="button" onPress={() => setPicker(list)} style={[styles.addPill, { borderColor: c.textSecondary }]}>
          <Text style={[styles.addPillText, { color: c.textPrimary }]}>{t('workout.more.add')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const cardioLikes = profile.cardio?.likes ?? [];
  const setCardio = (patch: Partial<NonNullable<typeof profile.cardio>>) =>
    update(updateProfile(settings, { cardio: { likes: cardioLikes, ...profile.cardio, ...patch } }));

  const recap = (text: string) => (
    <View style={styles.recap}>
      <Text style={[styles.hint, styles.recapText, dir.text, { color: c.textSecondary }]}>{text}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => setReasking(true)} style={styles.recapChange}>
        <Text style={[styles.switchText, { color: c.primaryAccessible }]}>{t('workout.more.change')}</Text>
      </TouchableOpacity>
    </View>
  );
  const knowsNever = Boolean(fromSurvey?.never) && !reasking && profile.background === 'never';
  const knowsTraining = Boolean(fromSurvey?.training) && !reasking && now?.active === true && Boolean(now.daysPerWeek);

  return (
    <View>
      {part === 1 && beginner ? (
        <>
          {knowsNever ? (
            recap(t('workout.more.fromSurveyNever'))
          ) : (
            <>
              <Question>{t('workout.more.backgroundQ')}</Question>
              {chips(BACKGROUNDS, (v) => profile.background === v, (v) => update(updateProfile(settings, { background: v })), 'background', t('workout.more.backgroundQ'))}
            </>
          )}
          {profile.background === 'used_to' ? (
            <View style={styles.notice}>
              <Notice tone="info">{t('workout.more.switchNote')}</Notice>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => update(setTrainingNow({ ...settings, experience: 'some' }, { active: false }))}
                style={[styles.switch, { borderColor: c.primaryAccessible }]}
              >
                <Text style={[styles.switchText, { color: c.primaryAccessible }]}>{t('workout.more.switchCta')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <Question>{t('workout.more.pushUpsQ')}</Question>
          <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.more.pushUpsHint')}</Text>
          {chips(PUSH_UPS, (v) => profile.ability?.pushUps === v, (v) => update(updateProfile(settings, { ability: { ...profile.ability, pushUps: v } })), 'pushUps', t('workout.more.pushUpsQ'))}
          <Question>{t('workout.more.plankQ')}</Question>
          {chips(PLANKS, (v) => profile.ability?.plank === v, (v) => update(updateProfile(settings, { ability: { ...profile.ability, plank: v } })), 'plank', t('workout.more.plankQ'))}
        </>
      ) : null}

      {part === 1 && !beginner ? (
        <>
          {knowsTraining ? (
            recap(t('workout.more.fromSurveyTraining', { days: now?.daysPerWeek }))
          ) : (
            <>
              <Question>{t('workout.more.trainingNowQ')}</Question>
              <ChipGroup label={t('workout.more.trainingNowQ')} mode="radio">
                <Chip mode="radio" label={t('workout.more.yes')} selected={now?.active === true} onPress={() => update(setTrainingNow(settings, { active: true }))} />
                <Chip mode="radio" label={t('workout.more.notNow')} selected={now?.active === false} onPress={() => update(setTrainingNow(settings, { active: false }))} />
              </ChipGroup>
            </>
          )}
          {now?.active === true ? (
            <>
              {knowsTraining ? null : (
                <>
                  <Question>{t('workout.more.daysNowQ')}</Question>
                  <ChipGroup label={t('workout.more.daysNowQ')} mode="radio">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <Chip key={n} mode="radio" label={String(n)} selected={now.daysPerWeek === n} onPress={() => update(setTrainingNow(settings, { daysPerWeek: n }))} />
                    ))}
                  </ChipGroup>
                </>
              )}
              <Question>{t('workout.more.splitQ')}</Question>
              {chips(SPLITS, (v) => now.split === v, (v) => update(setTrainingNow(settings, { split: v })), 'split', t('workout.more.splitQ'))}
              <Question>{t('workout.more.durationQ')}</Question>
              {chips(DURATIONS, (v) => now.duration === v, (v) => update(setTrainingNow(settings, { duration: v })), 'duration', t('workout.more.durationQ'))}
            </>
          ) : null}
          {now?.active === false ? (
            <>
              <Question>{t('workout.more.breakQ')}</Question>
              {chips(BREAKS, (v) => now.breakLength === v, (v) => update(setTrainingNow(settings, { breakLength: v })), 'break', t('workout.more.breakQ'))}
            </>
          ) : null}

          <Question optional>{t('workout.more.styleQ')}</Question>
          <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.more.styleHint')}</Text>
          {chips(STYLES, (v) => (profile.sessionStyle ?? 'straight') === v, (v) => update(updateProfile(settings, { sessionStyle: v })), 'style', t('workout.more.styleQ'))}

          <Question optional>{now?.active === false ? t('workout.more.usedToLiftQ') : t('workout.more.liftsQ')}</Question>
          <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>
            {now?.active === false ? t('workout.more.usedToLiftHint') : t('workout.more.liftsHint')}
          </Text>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            {liftRows(settings).map((id, index) => {
              const exercise = getExercise(id);
              const lift = liftOf(settings, id);
              return (
                <View key={id} style={[styles.liftRow, index > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                  <ExerciseImageLoop exerciseId={id} size={44} square paused />
                  <Text style={[styles.liftName, dir.text, { color: c.textPrimary }]} numberOfLines={2}>
                    {nameOf(id)}
                  </Text>
                  {exercise?.tracksLoad ? (
                    <NumberField
                      value={lift?.loadKg}
                      label={t('workout.more.kgField', { name: nameOf(id) })}
                      suffix={t('workout.log.kg')}
                      onCommit={(kg) => update(setLift(settings, id, { loadKg: kg }))}
                    />
                  ) : null}
                  <NumberField
                    value={lift?.reps}
                    label={t('workout.more.repsField', { name: nameOf(id) })}
                    suffix={t('workout.more.repsSuffix')}
                    onCommit={(reps) => update(setLift(settings, id, { reps: reps ? Math.round(reps) : 0 }))}
                  />
                </View>
              );
            })}
            <TouchableOpacity accessibilityRole="button" onPress={() => setPicker('lift')} style={[styles.addRow, { borderTopColor: c.border }]}>
              <Text style={[styles.addRowText, { color: c.primaryAccessible }]}>{t('workout.more.addLift')}</Text>
            </TouchableOpacity>
          </View>
          {now?.active === true && onOpenRoutine ? (
            <TouchableOpacity accessibilityRole="button" onPress={onOpenRoutine} style={[styles.routineLink, { backgroundColor: c.primaryLight }]}>
              <Icon name="clipboard" size={20} color={c.primaryTintText} />
              <View style={styles.routineText}>
                <Text style={[styles.routineTitle, dir.text, { color: c.primaryTintText }]}>
                  {profile.routine?.days.some((d) => d.exercises.length) ? t('workout.more.editRoutine') : t('workout.more.haveRoutine')}
                </Text>
                <Text style={[styles.routineSub, dir.text, { color: c.primaryTintText }]}>{t('workout.more.haveRoutineSub')}</Text>
              </View>
              <Icon name="chevron-right" size={16} color={c.primaryTintText} style={dir.isRTL ? styles.flipped : undefined} />
            </TouchableOpacity>
          ) : null}
        </>
      ) : null}

      {part === 2 ? (
        <>
          {beginner ? (
            <>
              <Question>{t('workout.more.walkQ')}</Question>
              {chips(WALKS, (v) => profile.ability?.walk === v, (v) => update(updateProfile(settings, { ability: { ...profile.ability, walk: v } })), 'walk', t('workout.more.walkQ'))}
            </>
          ) : (
            <>
              <Question>{t('workout.more.habitQ')}</Question>
              {chips(HABITS, (v) => profile.cardio?.habit === v, (v) => setCardio({ habit: v }), 'habit', t('workout.more.habitQ'))}
            </>
          )}
          <Question optional>{t('workout.more.cardioLikesQ')}</Question>
          {chips(
            CARDIO_KINDS,
            (v) => cardioLikes.includes(v),
            (v) => setCardio({ likes: cardioLikes.includes(v) ? cardioLikes.filter((k) => k !== v) : [...cardioLikes, v] }),
            'cardioKind',
            t('workout.more.cardioLikesQ'),
            'toggle'
          )}
          {beginner ? (
            <ChipGroup label={t('workout.more.avoidJumping')} mode="toggle">
              <Chip
                label={t('workout.more.avoidJumping')}
                selected={Boolean(profile.avoidJumping)}
                onPress={() => update(updateProfile(settings, { avoidJumping: !profile.avoidJumping }))}
              />
            </ChipGroup>
          ) : (
            <>
              <Question optional>{t('workout.more.likesQ')}</Question>
              <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.more.likesHint')}</Text>
              {exerciseList('likes')}
            </>
          )}
          <Question optional>{t('workout.more.dislikesQ')}</Question>
          <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.more.dislikesHint')}</Text>
          {exerciseList('dislikes')}
        </>
      ) : null}

      {part === 3 ? (
        <>
          <Question optional>{t('workout.more.sportsQ')}</Question>
          <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.more.sportsHint')}</Text>
          {chips(SPORTS, (v) => Boolean(profile.sports?.some((s) => s.kind === v)), (v) => update(toggleSport(settings, v)), 'sport', t('workout.more.sportsQ'), 'toggle')}
          {(profile.sports ?? []).map((sport) => (
            <View key={sport.kind} style={[styles.card, styles.sportCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sportTitle, dir.text, { color: c.textPrimary }]}>
                {t('workout.more.sportDaysQ', { sport: t(`workout.more.sport.${sport.kind}`) })}
              </Text>
              <ChipGroup label={t('workout.more.sportDaysQ', { sport: t(`workout.more.sport.${sport.kind}`) })} mode="toggle" style={styles.days}>
                {weekdaysFrom(weekStartFor(activeRegion)).map((day) => (
                  <Chip
                    key={day}
                    label={t(`workout.days.${day}`)}
                    selected={sport.days.includes(day)}
                    onPress={() => update(toggleSportDay(settings, sport.kind, day))}
                    style={styles.dayChip}
                  />
                ))}
              </ChipGroup>
              {/* A sport with no days is dropped when the plan is saved, so say so while it can still be fixed. */}
              {sport.days.length === 0 ? (
                <Text style={[styles.sportHint, dir.text, { color: c.textSecondary }]}>{t('workout.more.sportPickDays')}</Text>
              ) : null}
            </View>
          ))}
          {(profile.sports ?? []).length ? (
            <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.more.sportNote')}</Text>
          ) : null}
        </>
      ) : null}

      <ExercisePickerSheet
        visible={picker !== null}
        title={picker === 'lift' ? t('workout.more.addLiftTitle') : picker === 'likes' ? t('workout.more.likesQ') : t('workout.more.dislikesQ')}
        // Dislikes can be anything; lifts and likes only what this plan could use.
        settings={picker === 'dislikes' ? undefined : settings}
        chosen={picker === 'lift' ? liftRows(settings) : picker ? (profile[picker] ?? []) : []}
        onClose={() => setPicker(null)}
        onPick={(id) => {
          if (picker === 'lift') update(setLift(settings, id, {}));
          else if (picker) update(toggleExercisePreference(settings, picker, id));
          setPicker(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  hint: { fontSize: 12, lineHeight: 17, marginTop: -6, marginBottom: 10 },
  notice: { gap: 8, marginTop: -8, marginBottom: 22 },
  switch: { alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, justifyContent: 'center' },
  switchText: { fontSize: 13, fontWeight: '700' },
  recap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 22 },
  recapText: { flex: 1, marginTop: 0, marginBottom: 0, fontSize: 14, lineHeight: 20 },
  recapChange: { minHeight: 44, minWidth: 44, paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center' },
  card: { borderRadius: 18, borderWidth: 1, marginBottom: 22 },
  liftRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8 },
  liftName: { flex: 1, minWidth: 0, fontSize: 13, fontWeight: '700' },
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 44, minWidth: 76, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, gap: 2 },
  fieldInput: { width: 44, minHeight: 44, fontSize: 14, fontWeight: '800', textAlign: 'center', paddingVertical: 0 },
  fieldSuffix: { fontSize: 11, fontWeight: '700' },
  addRow: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1 },
  addRowText: { fontSize: 14, fontWeight: '700' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingStart: 12, paddingEnd: 2, minHeight: 44, borderRadius: 999 },
  pillText: { fontSize: 13, fontWeight: '700' },
  pillRemove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  addPill: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center' },
  addPillText: { fontSize: 13, fontWeight: '700' },
  sportCard: { padding: 14, gap: 10 },
  routineLink: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, marginBottom: 22 },
  routineText: { flex: 1, gap: 2 },
  routineTitle: { fontSize: 14, fontWeight: '800' },
  routineSub: { fontSize: 12, fontWeight: '600' },
  flipped: { transform: [{ scaleX: -1 }] },
  sportTitle: { fontSize: 14, fontWeight: '800' },
  sportHint: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  days: { gap: 6, marginBottom: 0 },
  dayChip: { minWidth: 44, paddingHorizontal: 8 },
});
