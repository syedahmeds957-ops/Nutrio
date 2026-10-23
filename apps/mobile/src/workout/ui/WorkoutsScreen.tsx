import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { WeeklyWorkoutPlan, WorkoutSettings } from '@nutrio/workout-core';
import type { LifestyleSurveyPayload } from '../../survey/types.js';
import type { ComputedUserPlan } from '../../plan/types.js';
import { useTheme } from '../../theme.js';
import { createWorkoutPlan, updateWorkoutPlan } from '../planActions.js';
import { defaultWorkoutSettings } from '../settingsFromSurvey.js';
import { settingsForEdit } from '../setupState.js';
import { hydrateWorkoutPlan, loadWorkoutPlan } from '../workoutStorage.js';
import { WorkoutSetupScreen } from './WorkoutSetupScreen.js';
import { WorkoutWeekList } from './WorkoutWeekList.js';

interface WorkoutsScreenProps {
  survey: LifestyleSurveyPayload | null;
  activePlan: ComputedUserPlan | null;
  onBack: () => void;
}

/** The Workouts route: setup the first time, the week once a plan exists, setup again to edit it. */
export const WorkoutsScreen: React.FC<WorkoutsScreenProps> = ({ survey, activePlan, onBack }) => {
  const { theme } = useTheme();
  // Guests skip the signed-in boot path, so the plan is hydrated here too; it is a no-op when already loaded.
  const [plan, setPlan] = useState<WeeklyWorkoutPlan | null>(() => loadWorkoutPlan());
  const [loading, setLoading] = useState(plan === null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let active = true;
    hydrateWorkoutPlan()
      .catch(() => undefined)
      .finally(() => {
        if (!active) return;
        setPlan(loadWorkoutPlan());
        setLoading(false);
      });
    return () => {
      active = false;
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

  return <WorkoutWeekList plan={plan} onBack={onBack} onEdit={() => setEditing(true)} />;
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
