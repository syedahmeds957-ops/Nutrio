import React, { useState, useMemo } from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { AnalysisView } from './AnalysisView.js';
import { GoalSelectionView } from './GoalSelectionView.js';
import { PlanRevealView } from './PlanRevealView.js';
import {
  ComputedUserPlan,
  GoalSelectionState,
  PlanUserContext,
  AssessmentNarrative,
} from '../types.js';
import { computePlan } from '../engine.js';

interface PlanWorkflowScreenProps {
  userContext: PlanUserContext;
  narrative?: AssessmentNarrative;
  onPlanAccepted: (plan: ComputedUserPlan) => void;
  onCancel?: () => void;
}

export type PlanPhase = 'analysis' | 'goal' | 'reveal';

export const PlanWorkflowScreen: React.FC<PlanWorkflowScreenProps> = ({
  userContext,
  narrative,
  onPlanAccepted,
  onCancel,
}) => {
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
    <SafeAreaView style={styles.container}>
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
            setPhase('reveal');
          }}
          onBack={() => setPhase('analysis')}
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
    backgroundColor: '#F6F8F6',
  },
});
