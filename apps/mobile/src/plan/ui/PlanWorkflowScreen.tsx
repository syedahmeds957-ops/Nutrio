import React, { useState, useMemo } from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { AnalysisView } from './AnalysisView.js';
import { GoalSelectionView } from './GoalSelectionView.js';
import { PlanCalculationTransitionView } from './PlanCalculationTransitionView.js';
import { PlanRevealView } from './PlanRevealView.js';
import {
  ComputedUserPlan,
  GoalSelectionState,
  PlanUserContext,
  AssessmentNarrative,
} from '../types.js';
import { computePlan } from '../engine.js';

import { useTheme } from '../../theme.js';

interface PlanWorkflowScreenProps {
  userContext: PlanUserContext;
  narrative?: AssessmentNarrative;
  onPlanAccepted: (plan: ComputedUserPlan) => void;
  onCancel: () => void;
}

export type PlanPhase = 'analysis' | 'goal' | 'calculating' | 'reveal';

export const PlanWorkflowScreen: React.FC<PlanWorkflowScreenProps> = ({
  userContext,
  narrative,
  onPlanAccepted,
  onCancel,
}) => {
  const { theme } = useTheme();
  const [phase, setPhase] = useState<PlanPhase>('analysis');
  const [goalSelection, setGoalSelection] = useState<GoalSelectionState>({
    goal: userContext.isPregnantOrBreastfeeding ? 'maintain' : 'lose',
    targetRateKgPerWeek: 0.5,
    targetWeightKg: Math.round(userContext.weightKg - 5),
  });

  const computedPlan = useMemo(() => {
    return computePlan(userContext, goalSelection, narrative);
  }, [userContext, goalSelection, narrative]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.canvas }]}>
      {phase === 'analysis' && (
        <AnalysisView
          context={userContext}
          narrative={narrative}
          onProceedToGoal={() => setPhase('goal')}
          onBack={onCancel}
        />
      )}

      {phase === 'goal' && (
        <GoalSelectionView
          context={userContext}
          onConfirmGoal={(selection) => {
            setGoalSelection(selection);
            setPhase('calculating');
          }}
          onBack={() => setPhase('analysis')}
        />
      )}

      {phase === 'calculating' && (
        <PlanCalculationTransitionView
          onReady={() => setPhase('reveal')}
        />
      )}

      {phase === 'reveal' && (
        <PlanRevealView
          plan={computedPlan}
          onAcceptPlan={() => onPlanAccepted(computedPlan)}
          onAdjustGoal={() => setPhase('goal')}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
