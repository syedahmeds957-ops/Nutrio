import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { PlannedSlot, WeeklyWorkoutPlan, WorkoutLog, WorkoutSettings } from '@nutrio/workout-core';
import type { LifestyleSurveyPayload } from '../../survey/types.js';
import type { ComputedUserPlan } from '../../plan/types.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { localDateKey } from '../../common/dateKey.js';
import { createWorkoutPlan, recordWorkout, resetExercise, swapExercise, updateWorkoutPlan } from '../planActions.js';
import { defaultWorkoutSettings } from '../settingsFromSurvey.js';
import { settingsForEdit } from '../setupState.js';
import { hydrateWorkoutPlan, loadWorkoutPlan } from '../workoutStorage.js';
import { hydrateWorkoutLogs, loadWorkoutLogs } from '../workoutLogStorage.js';
import { WorkoutSetupScreen } from './WorkoutSetupScreen.js';
import { buildWeekView } from '../weekView.js';
import { WorkoutDayScreen } from './WorkoutDayScreen.js';
import { WorkoutWeekScreen } from './WorkoutWeekScreen.js';

interface WorkoutsScreenProps {
  survey: LifestyleSurveyPayload | null;
  activePlan: ComputedUserPlan | null;
  /** Opens straight on this day (the dashboard's Start); Back from it still goes to the week. */
  initialDayKey?: string | null;
  onBack: () => void;
}

/** The Workouts route: setup the first time, then the week and its days, and setup again to edit the plan. */
export const WorkoutsScreen: React.FC<WorkoutsScreenProps> = ({ survey, activePlan, initialDayKey, onBack }) => {
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(initialDayKey ?? null);
  // Guests skip the signed-in boot path, so the plan is hydrated here too; it is a no-op when already loaded.
  const [plan, setPlan] = useState<WeeklyWorkoutPlan | null>(() => loadWorkoutPlan());
  const [loading, setLoading] = useState(plan === null);
  const [editing, setEditing] = useState(false);
  const [logs, setLogs] = useState<WorkoutLog[]>(() => loadWorkoutLogs());
  /** The missed day "Do it today" opened, which starts logging straight away. */
  const [autoStartKey, setAutoStartKey] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
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

  if (!plan) {
    return (
      <WorkoutSetupScreen
        mode="create"
        prefilled={survey !== null}
        initialSettings={fromSurvey}
        onCancel={onBack}
        onSave={(settings: WorkoutSettings) => setPlan(createWorkoutPlan(settings))}
      />
    );
  }

  if (editing) {
    return (
      <WorkoutSetupScreen
        mode="edit"
        initialSettings={{ ...settingsForEdit(plan.settings), lowIntensity: fromSurvey.lowIntensity }}
        onCancel={() => setEditing(false)}
        onSave={(settings: WorkoutSettings) => {
          setPlan(updateWorkoutPlan(plan, settings));
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
    );
  }

  return (
    <WorkoutWeekScreen
      plan={plan}
      week={week}
      saved={saved}
      onBack={onBack}
      onEdit={() => setEditing(true)}
      onOpenDay={setSelectedDayKey}
      onDoToday={(dateKey) => {
        setAutoStartKey(dateKey);
        setSelectedDayKey(dateKey);
      }}
    />
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
