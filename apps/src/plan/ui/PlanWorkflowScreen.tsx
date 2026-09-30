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
  /**
   * An already-accepted plan being reviewed rather than created. When set,
   * the wizard opens directly on the reveal step with the saved goal instead
   * of making the user re-run analysis/goal-selection just to see their
   * existing targets.
   */
  existingPlan?: ComputedUserPlan | null;
  onPlanAccepted: (plan: ComputedUserPlan) => void;
  onCancel: () => void;
}

export type PlanPhase = 'analysis' | 'goal' | 'calculating' | 'reveal';

export const PlanWorkflowScreen: React.FC<PlanWorkflowScreenProps> = ({
  userContext,
  narrative,
  existingPlan,
  onPlanAccepted,
  onCancel,
}) => {
  const { theme } = useTheme();
  const [phase, setPhase] = useState<PlanPhase>(existingPlan ? 'reveal' : 'analysis');
  /**
   * Set once the user confirms a different goal while reviewing.
   *
   * Reviewing saved targets has nothing to accept — the plan was accepted when
   * it was created — so the accept button stays hidden until an adjustment
   * actually produces a new plan to confirm.
   */
  const [hasAdjustedGoal, setHasAdjustedGoal] = useState(false);
  const [goalSelection, setGoalSelection] = useState<GoalSelectionState>(
    existingPlan
      ? existingPlan.goalSelection
      : {
          goal: userContext.isPregnantOrBreastfeeding ? 'maintain' : 'lose',
          targetRateKgPerWeek: 0.5,
          targetWeightKg: Math.round(userContext.weightKg - 5),
        }
  );

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
            setHasAdjustedGoal(true);
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
          onBack={existingPlan ? onCancel : undefined}
          showAccept={!existingPlan || hasAdjustedGoal}
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
