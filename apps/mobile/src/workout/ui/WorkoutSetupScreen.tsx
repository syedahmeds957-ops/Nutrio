import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  Equipment,
  FocusArea,
  JointLoad,
  SessionMinutes,
  TrainingLocation,
  Weekday,
  WorkoutGoal,
  WorkoutSettings,
} from '@nutrio/workout-core';
import { Icon, IconName } from '../../ui/Icon.js';
import { BackButton } from '../../ui/BackButton.js';
import { OptionButton, OptionGroup } from '../../ui/Selectable.js';
import { ProgressBar } from '../../survey/ui/ProgressBar.js';
import { Notice } from '../../ui/Notice.js';
import { useTheme, commonRadii } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Chip, ChipGroup, Question } from './SetupChips.js';
import { TellUsMore } from './TellUsMore.js';
import { RoutineBuilder } from './RoutineBuilder.js';
import { RamadanCard } from './RamadanCard.js';
import { KEYBOARD_BEHAVIOR } from './keyboard.js';
import { localDateKey } from '../../common/dateKey.js';
import { useRegion } from '../../common/region/index.js';
import { weekStartFor } from '../weekView.js';
import {
  canContinue,
  canSkipRest,
  continueBlocker,
  stepProgress,
  DUMBBELL_CHOICES_KG,
  isBeginner,
  LAST_STEP,
  SETUP_STEPS,
  SetupStep,
  toggleDay,
  toggleDumbbell,
  toggleEquipment,
  toggleFocus,
  toggleProtected,
} from '../setupState.js';

const GOALS: WorkoutGoal[] = ['muscle', 'strength', 'fat_loss', 'general'];
const EXPERIENCE = ['new', 'some', 'experienced'] as const;
const LOCATIONS: { id: TrainingLocation; icon: IconName }[] = [
  { id: 'home_none', icon: 'home' },
  { id: 'home_equipment', icon: 'dumbbell' },
  { id: 'gym', icon: 'building' },
];
const HOME_EQUIPMENT: Equipment[] = ['dumbbell', 'bands', 'kettlebell', 'bench', 'pullup_bar'];
const DAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** The day chips start on the region's first day of the week. */
function daysFrom(start: Weekday): Weekday[] {
  const at = DAYS.indexOf(start);
  return [...DAYS.slice(at), ...DAYS.slice(0, at)];
}
const LENGTHS: SessionMinutes[] = [20, 30, 45, 60, 75];
const FOCUS: FocusArea[] = ['full_body', 'upper', 'lower_glutes', 'core', 'arms'];
const JOINTS: JointLoad[] = ['knee', 'lower_back', 'shoulder', 'wrist'];

interface WorkoutSetupScreenProps {
  initialSettings: WorkoutSettings;
  /** 'create' ends on "Create my plan"; 'edit' saves changes to an existing plan. */
  mode: 'create' | 'edit';
  /** True when the answers came from the user's survey, so the screen says so. Guests have none. */
  prefilled?: boolean;
  onCancel: () => void;
  /** `improve` is set when the user built their routine, so "What we improved" follows. */
  onSave: (settings: WorkoutSettings, options?: { improve: boolean }) => void;
}

/**
 * Three short steps that turn into a weekly plan (goal and experience, where
 * you train, then days, length and preferences), then the optional "Tell us
 * more" (steps 4 to 6 of the same six-step count), which asks beginners and people already training different
 * questions. Answers start from the survey, so most users only confirm.
 */
export const WorkoutSetupScreen: React.FC<WorkoutSetupScreenProps> = ({ initialSettings, mode, prefilled, onCancel, onSave }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const dir = useTextDirection();
  const { activeRegion } = useRegion();
  const [step, setStep] = useState<SetupStep>(1);
  const [settings, setSettings] = useState<WorkoutSettings>(initialSettings);
  // What the survey already told us, read once: those questions become a recap in "Tell us more".
  const [fromSurvey] = useState(() => {
    const start = initialSettings.profile;
    return {
      training: Boolean(prefilled && mode === 'create' && start?.trainingNow?.active === true && start.trainingNow.daysPerWeek),
      never: Boolean(prefilled && mode === 'create' && start?.background === 'never'),
    };
  });
  const scrollRef = useRef<ScrollView>(null);
  /** The routine builder, opened from "Tell us more" by people training now. */
  const [building, setBuilding] = useState(false);

  const ready = canContinue(step, settings);
  const blocker = continueBlocker(step, settings);
  const progress = stepProgress(step);
  const isLast = step === LAST_STEP;
  const more = step > SETUP_STEPS;
  const beginner = isBeginner(settings);
  const update = (next: WorkoutSettings) => setSettings(next);

  const goTo = (next: SetupStep) => {
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const handleBack = () => (step === 1 ? onCancel() : goTo((step - 1) as SetupStep));
  const handleNext = () => {
    if (!ready) return;
    if (isLast) onSave(settings);
    else goTo((step + 1) as SetupStep);
  };

  if (building) {
    return (
      <RoutineBuilder
        settings={settings}
        update={update}
        onBack={() => setBuilding(false)}
        onImprove={() => onSave(settings, { improve: true })}
      />
    );
  }

  const dayCount = settings.trainingDays.length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.canvas }]}>
      <View style={styles.header}>
        <BackButton
          variant="icon"
          onPress={handleBack}
          label={step === 1 ? t('common.cancel') : t('common.back')}
        />
        <View style={styles.flex} />
        {/* A quiet text link, so it never reads as the main action; the last step has none, its main button finishes. */}
        {canSkipRest(step) ? (
          <TouchableOpacity accessibilityRole="button" onPress={() => onSave(settings)} style={styles.skip}>
            <Text style={[styles.skipText, { color: c.textSecondary }]}>{t(mode === 'edit' ? 'workout.more.saveAndFinish' : 'workout.more.skip')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <ProgressBar
        currentStep={progress.current - 1}
        totalSteps={progress.total}
        stepTitle={more ? `${t('workout.more.title')} · ${t('workout.setup.optional')}` : t('workout.setup.title')}
      />

      {/* The questions and the button bar rise with the keyboard (step 4 has number fields), so the button stays reachable. */}
      <KeyboardAvoidingView style={styles.flex} behavior={KEYBOARD_BEHAVIOR}>
        <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.content} keyboardDismissMode="on-drag">
          {more ? (
            <Text style={[styles.subtitle, dir.text, { color: c.textSecondary }]}>
              {beginner ? t('workout.more.subtitleBeginner') : t('workout.more.subtitle')}
            </Text>
          ) : null}

          {step === 1 && (
            <>
              {mode === 'create' && prefilled && (
                <Notice icon="info" style={styles.notice}>
                  {t('workout.setup.prefillNote')}
                </Notice>
              )}
              <Question>{t('workout.setup.goalQuestion')}</Question>
              <OptionGroup label={t('workout.setup.goalQuestion')} style={styles.grid2}>
                {GOALS.map((goal) => (
                  <OptionButton
                    key={goal}
                    label={t(`workout.setup.goal.${goal}.label`)}
                    accessibilityLabel={`${t(`workout.setup.goal.${goal}.label`)}. ${t(`workout.setup.goal.${goal}.desc`)}`}
                    selected={settings.goal === goal}
                    onPress={() => update({ ...settings, goal })}
                    style={styles.optionCard}
                  >
                    {(colors) => (
                      <>
                        <Text style={[styles.optionLabel, dir.text, colors.text]}>{t(`workout.setup.goal.${goal}.label`)}</Text>
                        <Text style={[styles.optionDesc, dir.text, colors.sub]}>{t(`workout.setup.goal.${goal}.desc`)}</Text>
                      </>
                    )}
                  </OptionButton>
                ))}
              </OptionGroup>

              <Question>{t('workout.setup.experienceQuestion')}</Question>
              <OptionGroup label={t('workout.setup.experienceQuestion')} style={styles.stack}>
                {EXPERIENCE.map((level) => (
                  <OptionButton
                    key={level}
                    label={t(`workout.setup.experience.${level}`)}
                    check="inline"
                    selected={settings.experience === level}
                    onPress={() => update({ ...settings, experience: level })}
                    style={styles.optionRow}
                    labelStyle={styles.optionRowText}
                  />
                ))}
              </OptionGroup>
            </>
          )}

          {step === 2 && (
            <>
              <Question>{t('workout.setup.locationQuestion')}</Question>
              <OptionGroup label={t('workout.setup.locationQuestion')} style={styles.stack}>
                {LOCATIONS.map(({ id, icon }) => {
                  const selected = settings.location === id;
                  return (
                    <OptionButton
                      key={id}
                      label={t(`workout.setup.location.${id}.label`)}
                      accessibilityLabel={`${t(`workout.setup.location.${id}.label`)}. ${t(`workout.setup.location.${id}.desc`)}`}
                      check="inline"
                      selected={selected}
                      onPress={() => update({ ...settings, location: id })}
                      style={styles.locationCard}
                    >
                      {(colors) => (
                        <>
                          <View style={[styles.locationIcon, { backgroundColor: selected ? c.limeText : c.surfaceSecondary }]}>
                            <Icon name={icon} size={20} color={selected ? c.primaryLime : c.textPrimary} />
                          </View>
                          <View style={styles.flex}>
                            <Text style={[styles.optionLabel, dir.text, colors.text]}>{t(`workout.setup.location.${id}.label`)}</Text>
                            <Text style={[styles.optionDesc, dir.text, colors.sub]}>{t(`workout.setup.location.${id}.desc`)}</Text>
                          </View>
                        </>
                      )}
                    </OptionButton>
                  );
                })}
              </OptionGroup>

              {settings.location === 'home_none' && (
                <Notice tone="info" style={styles.notice}>
                  {t('workout.setup.bandTip')}
                </Notice>
              )}

              {settings.location === 'home_equipment' && (
                <>
                  <Question>{t('workout.setup.equipmentQuestion')}</Question>
                  <ChipGroup label={t('workout.setup.equipmentQuestion')} mode="toggle">
                    {HOME_EQUIPMENT.map((item) => (
                      <Chip
                        key={item}
                        label={t(`workout.setup.equipment.${item}`)}
                        selected={settings.homeEquipment.includes(item)}
                        onPress={() => update(toggleEquipment(settings, item))}
                      />
                    ))}
                  </ChipGroup>
                  {settings.homeEquipment.includes('dumbbell') && (
                    <>
                      <Question>{t('workout.setup.dumbbellQuestion')}</Question>
                      <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.setup.dumbbellHint')}</Text>
                      <ChipGroup label={t('workout.setup.dumbbellQuestion')} mode="toggle" style={styles.grid4}>
                        {DUMBBELL_CHOICES_KG.map((kg) => (
                          <Chip
                            key={kg}
                            label={kg === 0 ? t('workout.setup.adjustable') : t('workout.setup.kg', { kg })}
                            selected={settings.dumbbellWeightsKg.includes(kg)}
                            onPress={() => update(toggleDumbbell(settings, kg))}
                            style={styles.gridCell}
                          />
                        ))}
                      </ChipGroup>
                    </>
                  )}
                </>
              )}

              {settings.location === 'gym' && (
                <Notice style={styles.notice}>{beginner ? t('workout.setup.gymNoteBeginner') : t('workout.setup.gymNote')}</Notice>
              )}
            </>
          )}

          {step === 3 && (
            <>
              {settings.lowIntensity && (
                <Notice tone="warning" style={styles.notice}>
                  {t('workout.setup.lowIntensityNote')}
                </Notice>
              )}
              <Question>{t('workout.setup.daysQuestion')}</Question>
              {beginner ? <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.setup.beginnerDaysHint')}</Text> : null}
              <ChipGroup label={t('workout.setup.daysQuestion')} mode="toggle" style={styles.grid4}>
                {daysFrom(weekStartFor(activeRegion)).map((day) => (
                  <Chip
                    key={day}
                    label={t(`workout.days.${day}`)}
                    selected={settings.trainingDays.includes(day)}
                    onPress={() => update(toggleDay(settings, day))}
                    style={styles.gridCell}
                  />
                ))}
              </ChipGroup>
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.daysCount, dir.text, { color: ready ? c.textSecondary : c.danger }]}
              >
                {ready ? t('workout.setup.daysCount', { count: dayCount }) : t('workout.setup.daysError')}
              </Text>

              <Question>{t('workout.setup.lengthQuestion')}</Question>
              {beginner ? <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.setup.beginnerLengthHint')}</Text> : null}
              <OptionGroup label={t('workout.setup.lengthQuestion')} style={styles.row}>
                {LENGTHS.map((minutes) => (
                  <OptionButton
                    key={minutes}
                    label={`${minutes} ${t('workout.setup.minutesShort')}`}
                    selected={settings.sessionMinutes === minutes}
                    onPress={() => update({ ...settings, sessionMinutes: minutes })}
                    style={styles.lengthTile}
                  >
                    {(colors) => (
                      <>
                        <Text style={[styles.lengthValue, colors.text]}>{minutes}</Text>
                        <Text style={[styles.lengthUnit, colors.sub]}>{t('workout.setup.minutesShort')}</Text>
                      </>
                    )}
                  </OptionButton>
                ))}
              </OptionGroup>

              <Question optional>{t('workout.setup.focusQuestion')}</Question>
              <ChipGroup label={t('workout.setup.focusQuestion')} mode="toggle">
                {FOCUS.map((area) => (
                  <Chip
                    key={area}
                    label={t(`workout.setup.focus.${area}`)}
                    selected={settings.focus.includes(area)}
                    onPress={() => update(toggleFocus(settings, area))}
                  />
                ))}
              </ChipGroup>

              <Question optional>{t('workout.setup.protectQuestion')}</Question>
              <ChipGroup label={t('workout.setup.protectQuestion')} mode="toggle">
                {JOINTS.map((joint) => (
                  <Chip
                    key={joint}
                    label={t(`workout.setup.protect.${joint}`)}
                    selected={settings.protectedJoints.includes(joint)}
                    onPress={() => update(toggleProtected(settings, joint))}
                  />
                ))}
              </ChipGroup>
              <RamadanCard ramadan={settings.ramadan} todayKey={localDateKey()} onChange={(ramadan) => update({ ...settings, ramadan })} />
            </>
          )}
          {more ? (
            <TellUsMore part={(step - SETUP_STEPS) as 1 | 2 | 3} settings={settings} update={update} onOpenRoutine={() => setBuilding(true)} fromSurvey={fromSurvey} />
          ) : null}
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
          {blocker ? (
            <Text accessibilityLiveRegion="polite" style={[styles.blockerText, dir.text, { color: c.danger }]}>
              {t('workout.setup.daysError')}
            </Text>
          ) : isLast ? (
            // What the last button does, so finishing the optional questions has a clear next step.
            <Text style={[styles.lastNote, dir.textCenter, { color: c.textSecondary }]}>
              {t(mode === 'edit' ? 'workout.setup.saveNote' : 'workout.setup.createNote')}
            </Text>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            accessibilityHint={blocker ? t('workout.setup.daysError') : undefined}
            disabled={!ready}
            onPress={handleNext}
            activeOpacity={0.7}
            style={[styles.nextAction, { backgroundColor: ready ? c.primaryLime : c.surfaceSecondary, borderColor: ready ? c.primaryLime : c.border }]}
          >
            <Text style={[styles.nextActionText, dir.textCenter, { color: ready ? c.limeText : c.textSecondary }]}>
              {isLast ? t(mode === 'edit' ? 'workout.setup.saveChanges' : 'workout.setup.createPlan') : t('common.continue')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 18 },
  skip: { minHeight: 44, paddingHorizontal: 6, justifyContent: 'center' },
  skipText: { fontSize: 14, fontWeight: '600' },
  notice: { marginBottom: 18 },
  hint: { fontSize: 12, marginTop: -6, marginBottom: 10 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  optionCard: { width: '48.5%', minHeight: 76, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, gap: 4, alignItems: 'flex-start', justifyContent: 'flex-start' },
  optionLabel: { fontSize: 15, fontWeight: '800' },
  optionDesc: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  stack: { gap: 8, marginBottom: 18 },
  optionRow: { minHeight: 52, paddingHorizontal: 16, borderRadius: 16 },
  optionRowText: { fontSize: 15 },
  locationCard: { minHeight: 68, padding: 12, borderRadius: 18, gap: 14, justifyContent: 'flex-start' },
  locationIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  grid4: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  gridCell: { width: '23%', paddingHorizontal: 4 },
  daysCount: { fontSize: 13, fontWeight: '600', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  lengthTile: { flex: 1, minHeight: 52, paddingHorizontal: 0, paddingVertical: 4, borderRadius: 12 },
  lengthValue: { fontSize: 15, fontWeight: '800' },
  lengthUnit: { fontSize: 12, fontWeight: '600' },
  bottomBar: { gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderTopWidth: 1 },
  blockerText: { fontSize: 13, fontWeight: '600' },
  lastNote: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  nextAction: { minHeight: 50, borderRadius: commonRadii.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nextActionText: { fontSize: 15, fontWeight: '800' },
});
