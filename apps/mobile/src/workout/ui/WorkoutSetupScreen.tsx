import React, { useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { Notice } from '../../ui/Notice.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import {
  canContinue,
  DUMBBELL_CHOICES_KG,
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
  onSave: (settings: WorkoutSettings) => void;
}

/** Lime when selected, quiet surface otherwise: the survey's chip language. */
function useChipColors() {
  const { theme } = useTheme();
  const c = theme.colors;
  return (selected: boolean) => ({
    container: {
      backgroundColor: selected ? c.primaryLime : c.surface,
      borderColor: selected ? c.primaryLime : c.border,
    },
    text: { color: selected ? c.limeText : c.textSecondary, fontWeight: selected ? ('800' as const) : ('600' as const) },
    sub: { color: selected ? c.limeText : c.textSecondary },
  });
}

const Chip: React.FC<{ label: string; selected: boolean; onPress: () => void; style?: object }> = ({
  label,
  selected,
  onPress,
  style,
}) => {
  const colors = useChipColors()(selected);
  const dir = useTextDirection();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, colors.container, style]}
    >
      <Text style={[styles.chipText, colors.text, dir.textCenter]}>{label}</Text>
    </TouchableOpacity>
  );
};

const Question: React.FC<{ children: string; optional?: boolean }> = ({ children, optional }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  return (
    <Text style={[styles.question, dir.text, { color: theme.colors.textPrimary }]}>
      {children}
      {optional ? (
        <Text style={{ color: theme.colors.textSecondary, fontWeight: '500' }}>{` · ${t('workout.setup.optional')}`}</Text>
      ) : null}
    </Text>
  );
};

/**
 * Three short steps that turn into a weekly plan: goal and experience, where
 * you train, then days, length and preferences. Answers start from the survey,
 * so most users only confirm.
 */
export const WorkoutSetupScreen: React.FC<WorkoutSetupScreenProps> = ({ initialSettings, mode, prefilled, onCancel, onSave }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const dir = useTextDirection();
  const [step, setStep] = useState<SetupStep>(1);
  const [settings, setSettings] = useState<WorkoutSettings>(initialSettings);
  const scrollRef = useRef<ScrollView>(null);

  const ready = canContinue(step, settings);
  const isLast = step === SETUP_STEPS;
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

  const chipColors = useChipColors();

  const dayCount = settings.trainingDays.length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.canvas }]}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: c.surface, borderColor: c.border }]}
        >
          <Icon name="arrow-left" size={18} color={c.textPrimary} style={dir.isRTL ? styles.flipped : undefined} />
        </TouchableOpacity>
        <View style={styles.headerProgress}>
          <Text style={[styles.stepLabel, dir.text, { color: c.textSecondary }]}>
            {t('workout.setup.step', { current: step, total: SETUP_STEPS })}
          </Text>
          <View style={styles.segments}>
            {[1, 2, 3].map((n) => (
              <View key={n} style={[styles.segment, { backgroundColor: n <= step ? c.primaryLime : c.border }]} />
            ))}
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, dir.text, { color: c.textPrimary }]}>
          {t('workout.setup.title')}
        </Text>

        {step === 1 && (
          <>
            {mode === 'create' && prefilled && (
              <Notice icon="info" style={styles.notice}>
                {t('workout.setup.prefillNote')}
              </Notice>
            )}
            <Question>{t('workout.setup.goalQuestion')}</Question>
            <View style={styles.grid2}>
              {GOALS.map((goal) => {
                const colors = chipColors(settings.goal === goal);
                return (
                  <TouchableOpacity
                    key={goal}
                    accessibilityRole="button"
                    accessibilityState={{ selected: settings.goal === goal }}
                    onPress={() => update({ ...settings, goal })}
                    activeOpacity={0.7}
                    style={[styles.optionCard, colors.container]}
                  >
                    <Text style={[styles.optionLabel, dir.text, colors.text, { fontWeight: '800' }]}>
                      {t(`workout.setup.goal.${goal}.label`)}
                    </Text>
                    <Text style={[styles.optionDesc, dir.text, colors.sub]}>{t(`workout.setup.goal.${goal}.desc`)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Question>{t('workout.setup.experienceQuestion')}</Question>
            <View style={styles.stack}>
              {EXPERIENCE.map((level) => {
                const selected = settings.experience === level;
                const colors = chipColors(selected);
                return (
                  <TouchableOpacity
                    key={level}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => update({ ...settings, experience: level })}
                    activeOpacity={0.7}
                    style={[styles.optionRow, colors.container]}
                  >
                    <Text style={[styles.optionRowText, dir.text, colors.text, { fontWeight: '700' }]}>
                      {t(`workout.setup.experience.${level}`)}
                    </Text>
                    {selected ? <Icon name="check" size={18} color={c.limeText} strokeWidth={2.6} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Question>{t('workout.setup.locationQuestion')}</Question>
            <View style={styles.stack}>
              {LOCATIONS.map(({ id, icon }) => {
                const selected = settings.location === id;
                const colors = chipColors(selected);
                return (
                  <TouchableOpacity
                    key={id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => update({ ...settings, location: id })}
                    activeOpacity={0.7}
                    style={[styles.locationCard, colors.container]}
                  >
                    <View style={[styles.locationIcon, { backgroundColor: selected ? c.limeText : c.surfaceSecondary }]}>
                      <Icon name={icon} size={20} color={selected ? c.primaryLime : c.textPrimary} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={[styles.optionLabel, dir.text, colors.text, { fontWeight: '800' }]}>
                        {t(`workout.setup.location.${id}.label`)}
                      </Text>
                      <Text style={[styles.optionDesc, dir.text, colors.sub]}>{t(`workout.setup.location.${id}.desc`)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {settings.location === 'home_none' && (
              <Notice tone="info" style={styles.notice}>
                {t('workout.setup.bandTip')}
              </Notice>
            )}

            {settings.location === 'home_equipment' && (
              <>
                <Question>{t('workout.setup.equipmentQuestion')}</Question>
                <View style={styles.wrap}>
                  {HOME_EQUIPMENT.map((item) => (
                    <Chip
                      key={item}
                      label={t(`workout.setup.equipment.${item}`)}
                      selected={settings.homeEquipment.includes(item)}
                      onPress={() => update(toggleEquipment(settings, item))}
                    />
                  ))}
                </View>
                {settings.homeEquipment.includes('dumbbell') && (
                  <>
                    <Question>{t('workout.setup.dumbbellQuestion')}</Question>
                    <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>{t('workout.setup.dumbbellHint')}</Text>
                    <View style={styles.grid4}>
                      {DUMBBELL_CHOICES_KG.map((kg) => (
                        <Chip
                          key={kg}
                          label={kg === 0 ? t('workout.setup.adjustable') : t('workout.setup.kg', { kg })}
                          selected={settings.dumbbellWeightsKg.includes(kg)}
                          onPress={() => update(toggleDumbbell(settings, kg))}
                          style={styles.gridCell}
                        />
                      ))}
                    </View>
                  </>
                )}
              </>
            )}

            {settings.location === 'gym' && <Notice style={styles.notice}>{t('workout.setup.gymNote')}</Notice>}
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
            <View style={styles.grid4}>
              {DAYS.map((day) => (
                <Chip
                  key={day}
                  label={t(`workout.days.${day}`)}
                  selected={settings.trainingDays.includes(day)}
                  onPress={() => update(toggleDay(settings, day))}
                  style={styles.gridCell}
                />
              ))}
            </View>
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.daysCount, dir.text, { color: ready ? c.textSecondary : c.danger }]}
            >
              {ready ? t('workout.setup.daysCount', { count: dayCount }) : t('workout.setup.daysError')}
            </Text>

            <Question>{t('workout.setup.lengthQuestion')}</Question>
            <View style={styles.row}>
              {LENGTHS.map((minutes) => {
                const selected = settings.sessionMinutes === minutes;
                const colors = chipColors(selected);
                return (
                  <TouchableOpacity
                    key={minutes}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${minutes} ${t('workout.setup.minutesShort')}`}
                    onPress={() => update({ ...settings, sessionMinutes: minutes })}
                    activeOpacity={0.7}
                    style={[styles.lengthTile, colors.container]}
                  >
                    <Text style={[styles.lengthValue, colors.text, { fontWeight: '800' }]}>{minutes}</Text>
                    <Text style={[styles.lengthUnit, colors.sub]}>{t('workout.setup.minutesShort')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Question optional>{t('workout.setup.focusQuestion')}</Question>
            <View style={styles.wrap}>
              {FOCUS.map((area) => (
                <Chip
                  key={area}
                  label={t(`workout.setup.focus.${area}`)}
                  selected={settings.focus.includes(area)}
                  onPress={() => update(toggleFocus(settings, area))}
                />
              ))}
            </View>

            <Question optional>{t('workout.setup.protectQuestion')}</Question>
            <View style={styles.wrap}>
              {JOINTS.map((joint) => (
                <Chip
                  key={joint}
                  label={t(`workout.setup.protect.${joint}`)}
                  selected={settings.protectedJoints.includes(joint)}
                  onPress={() => update(toggleProtected(settings, joint))}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleBack}
          activeOpacity={0.7}
          style={[styles.backAction, { backgroundColor: c.surfaceSecondary }]}
        >
          <Text style={[styles.backActionText, dir.textCenter, { color: c.textPrimary }]}>
            {step === 1 ? t('common.cancel') : t('common.back')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: !ready }}
          disabled={!ready}
          onPress={handleNext}
          activeOpacity={0.7}
          style={[styles.nextAction, { backgroundColor: c.primaryLime }, !ready && styles.disabled]}
        >
          <Text style={[styles.nextActionText, dir.textCenter, { color: c.limeText }]}>
            {isLast ? t(mode === 'edit' ? 'workout.setup.saveChanges' : 'workout.setup.createPlan') : t('common.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  backBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  flipped: { transform: [{ scaleX: -1 }] },
  headerProgress: { flex: 1, gap: 6 },
  stepLabel: { fontSize: 12, fontWeight: '700' },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, borderRadius: 999 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 14 },
  notice: { marginBottom: 18 },
  question: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  hint: { fontSize: 12, marginTop: -6, marginBottom: 10 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  optionCard: { width: '48.5%', minHeight: 76, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, gap: 4 },
  optionLabel: { fontSize: 15 },
  optionDesc: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  stack: { gap: 8, marginBottom: 18 },
  optionRow: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionRowText: { fontSize: 15 },
  locationCard: { minHeight: 68, padding: 12, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  locationIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  grid4: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  gridCell: { width: '23%', paddingHorizontal: 4 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 13 },
  daysCount: { fontSize: 13, fontWeight: '600', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  lengthTile: { flex: 1, minHeight: 52, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lengthValue: { fontSize: 15 },
  lengthUnit: { fontSize: 11, fontWeight: '600' },
  bottomBar: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderTopWidth: 1 },
  backAction: { flex: 1, minHeight: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  backActionText: { fontSize: 14, fontWeight: '700' },
  nextAction: { flex: 2, minHeight: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  nextActionText: { fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.35 },
});
