import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { describeRoutineChanges, type PlannedSlot, type RoutineChange, type WeeklyWorkoutPlan, type WorkoutLog, type WorkoutSettings } from '@nutrio/workout-core';
import type { LifestyleSurveyPayload } from '../../survey/types.js';
import type { ComputedUserPlan } from '../../plan/types.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation } from '../../i18n/index.js';
import { GuestAuthModal } from '../../tracker/ui/GuestAuthModal.js';
import { localDateKey } from '../../common/dateKey.js';
import { proposeTargetUpdate, type TargetUpdateProposal } from '../calorieLink.js';
import {
  createWorkoutPlan,
  recordTargetOffer,
  recordWorkout,
  resetExercise,
  setRamadanMode,
  swapExercise,
  updateWorkoutPlan,
} from '../planActions.js';
import { defaultWorkoutSettings } from '../settingsFromSurvey.js';
import { settingsForEdit } from '../setupState.js';
import { hydrateWorkoutPlan, loadWorkoutPlan } from '../workoutStorage.js';
import { hydrateWorkoutLogs, loadWorkoutLogs } from '../workoutLogStorage.js';
import { samplePlan } from '../samplePlan.js';
import { WorkoutSetupScreen } from './WorkoutSetupScreen.js';
import { ImprovedScreen } from './ImprovedScreen.js';
import { buildWeekView } from '../weekView.js';
import { WorkoutDayScreen } from './WorkoutDayScreen.js';
import { WorkoutWeekScreen } from './WorkoutWeekScreen.js';
import { TargetUpdateSheet } from './TargetUpdateSheet.js';

interface WorkoutsScreenProps {
  survey: LifestyleSurveyPayload | null;
  activePlan: ComputedUserPlan | null;
  /** Opens straight on this day (the dashboard's Start); Back from it still goes to the week. */
  initialDayKey?: string | null;
  onBack: () => void;
  /** Guests look around a sample plan; building or logging needs an account. */
  isGuest?: boolean;
  /** Takes a guest to sign-in. */
  onRequireAuth?: () => void;
  /** The user accepted the calorie target their new workout plan implies. */
  onAcceptPlan?: (plan: ComputedUserPlan) => void;
}

/** The Workouts route: a sample to explore for guests, the user's own plan for everyone signed in. */
export const WorkoutsScreen: React.FC<WorkoutsScreenProps> = ({ isGuest, onRequireAuth, ...props }) =>
  isGuest ? (
    <GuestWorkouts initialDayKey={props.initialDayKey} onBack={props.onBack} onRequireAuth={onRequireAuth} />
  ) : (
    <AccountWorkouts {...props} />
  );

const noop = () => undefined;

/**
 * A guest's Workouts: the sample week and its days to look at. Every action
 * (start, edit, swap) asks for an account. Nothing is read from or saved to
 * storage, and nothing is synced.
 */
const GuestWorkouts: React.FC<{ initialDayKey?: string | null; onBack: () => void; onRequireAuth?: () => void }> = ({
  initialDayKey,
  onBack,
  onRequireAuth,
}) => {
  const { t } = useTranslation();
  const { activeRegion } = useRegion();
  const todayKey = localDateKey();
  const plan = useMemo(() => samplePlan(todayKey), [todayKey]);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(initialDayKey ?? null);
  const [prompting, setPrompting] = useState(false);
  const week = buildWeekView(plan, todayKey, activeRegion);
  const selectedDay = week.days.find((day) => day.dateKey === selectedDayKey);
  const requireAccount = () => setPrompting(true);

  return (
    <>
      {selectedDay?.session ? (
        <WorkoutDayScreen
          key={selectedDay.dateKey}
          plan={plan}
          day={{ ...selectedDay, session: selectedDay.session }}
          weekIndex={week.weekIndex}
          todayKey={todayKey}
          logs={[]}
          onBack={() => setSelectedDayKey(null)}
          onSaved={noop}
          onSwap={noop}
          onResetSwap={noop}
          onRequireAccount={requireAccount}
        />
      ) : (
        <WorkoutWeekScreen
          plan={plan}
          week={week}
          onBack={onBack}
          onEdit={requireAccount}
          onOpenDay={setSelectedDayKey}
          onDoToday={requireAccount}
          onRequireAccount={requireAccount}
        />
      )}
      <GuestAuthModal
        visible={prompting}
        title={t('workout.guest.promptTitle')}
        description={t('workout.guest.promptBody')}
        onClose={() => setPrompting(false)}
        onSignIn={() => {
          setPrompting(false);
          onRequireAuth?.();
        }}
      />
    </>
  );
};

/** A signed-in user's Workouts: setup the first time, then the week and its days, and setup again to edit the plan. */
const AccountWorkouts: React.FC<Omit<WorkoutsScreenProps, 'isGuest' | 'onRequireAuth'>> = ({
  survey,
  activePlan,
  initialDayKey,
  onBack,
  onAcceptPlan,
}) => {
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(initialDayKey ?? null);
  // Hydrated here too in case boot's restore hasn't landed; it is a no-op when already loaded.
  const [plan, setPlan] = useState<WeeklyWorkoutPlan | null>(() => loadWorkoutPlan());
  const [loading, setLoading] = useState(plan === null);
  const [editing, setEditing] = useState(false);
  const [logs, setLogs] = useState<WorkoutLog[]>(() => loadWorkoutLogs());
  /** The missed day "Do it today" opened, which starts logging straight away. */
  const [autoStartKey, setAutoStartKey] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  /** Shown once after a routine the user entered becomes their plan. */
  const [improvements, setImprovements] = useState<RoutineChange[] | null>(null);
  /** Offered after setup or an edit; it waits behind "What we improved". */
  const [targetProposal, setTargetProposal] = useState<TargetUpdateProposal | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([hydrateWorkoutPlan(), hydrateWorkoutLogs()])
      .catch(() => undefined)
      .finally(() => {
        if (!active) return;
        setPlan(loadWorkoutPlan());
        setLogs(loadWorkoutLogs());
        setLoading(false);
      });
    return () => {
      active = false;
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.canvas }]}>
        <ActivityIndicator color={theme.colors.primaryLime} />
      </View>
    );
  }

  // Health answers can change after the plan was made; the survey is the source for the intensity cap.
  const fromSurvey = defaultWorkoutSettings({ survey, plan: activePlan });

  /**
   * A new or edited plan; when it came from the user's own routine, show what
   * changed and why. When its training moves the calorie target, offer the new one.
   */
  const adopt = (next: WeeklyWorkoutPlan, options?: { improve: boolean }) => {
    setPlan(next);
    const routine = next.settings.profile?.routine;
    if (options?.improve && routine) setImprovements(describeRoutineChanges(routine, next));
    setTargetProposal(proposeTargetUpdate({ isGuest: false, activePlan, workoutPlan: next, survey }));
  };

  const targetSheet = (
    <TargetUpdateSheet
      proposal={targetProposal}
      onUpdate={() => {
        if (targetProposal) onAcceptPlan?.(targetProposal.nextPlan);
        if (plan) setPlan(recordTargetOffer(plan, undefined));
        setTargetProposal(null);
      }}
      onNotNow={() => {
        if (plan && targetProposal) setPlan(recordTargetOffer(plan, targetProposal.weeklyTrainingKcal));
        setTargetProposal(null);
      }}
    />
  );

  if (plan && improvements) {
    return <ImprovedScreen plan={plan} changes={improvements} onDone={() => setImprovements(null)} />;
  }

  if (!plan) {
    return (
      <WorkoutSetupScreen
        mode="create"
        prefilled={survey !== null}
        initialSettings={fromSurvey}
        onCancel={onBack}
        onSave={(settings: WorkoutSettings, options) => adopt(createWorkoutPlan(settings), options)}
      />
    );
  }

  if (editing) {
    return (
      <WorkoutSetupScreen
        mode="edit"
        initialSettings={{ ...settingsForEdit(plan.settings), lowIntensity: fromSurvey.lowIntensity }}
        onCancel={() => setEditing(false)}
        onSave={(settings: WorkoutSettings, options) => {
          adopt(updateWorkoutPlan(plan, settings), options);
          setEditing(false);
        }}
      />
    );
  }

  const todayKey = localDateKey();
  const week = buildWeekView(plan, todayKey, activeRegion, logs);
  const selectedDay = week.days.find((day) => day.dateKey === selectedDayKey);

  const closeDay = () => {
    setSelectedDayKey(null);
    setAutoStartKey(null);
  };

  const onSaved = (log: WorkoutLog, slots: PlannedSlot[]) => {
    const result = recordWorkout(plan, log, slots);
    setPlan(result.plan);
    setLogs(result.logs);
    closeDay();
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2500);
  };

  if (selectedDay?.session) {
    return (
      <>
        <WorkoutDayScreen
          key={selectedDay.dateKey}
          plan={plan}
          day={{ ...selectedDay, session: selectedDay.session }}
          weekIndex={week.weekIndex}
          todayKey={todayKey}
          logs={logs}
          autoStart={autoStartKey === selectedDay.dateKey}
          onBack={closeDay}
          onSaved={onSaved}
          onSwap={(slotId, exerciseId) => setPlan(swapExercise(plan, slotId, exerciseId, week.weekIndex))}
          onResetSwap={(slotId) => setPlan(resetExercise(plan, slotId))}
        />
        {targetSheet}
      </>
    );
  }

  return (
    <>
      <WorkoutWeekScreen
        plan={plan}
        week={week}
        saved={saved}
        onRamadanChange={(ramadan) => setPlan(setRamadanMode(plan, ramadan))}
        onBack={onBack}
        onEdit={() => setEditing(true)}
        onOpenDay={setSelectedDayKey}
        onDoToday={(dateKey) => {
          setAutoStartKey(dateKey);
          setSelectedDayKey(dateKey);
        }}
      />
      {targetSheet}
    </>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
