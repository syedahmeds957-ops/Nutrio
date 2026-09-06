import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { ProgressBar } from './ProgressBar.js';
import { StepBasics } from './StepBasics.js';
import { StepOccupational } from './StepOccupational.js';
import { StepExercise } from './StepExercise.js';
import { StepLifestyleDesi } from './StepLifestyleDesi.js';
import { StepHealthClinical } from './StepHealthClinical.js';
import { StepPreferencesBudget } from './StepPreferencesBudget.js';
import { SurveyStateEngine } from '../state.js';
import { LifestyleSurveyPayload } from '../types.js';
import { bridgeSurveyToNutritionCore } from '../nutrition-bridge.js';
import { useTheme } from '../../theme.js';

interface OnboardingSurveyScreenProps {
  onComplete: (
    payload: LifestyleSurveyPayload,
    bridged: ReturnType<typeof bridgeSurveyToNutritionCore>
  ) => void;
  onCancel?: () => void;
}

const STEP_TITLES: Record<string, string> = {
  basics: 'Physical Metrics',
  occupational: 'Work & Daily Activity',
  exercise: 'Workouts & Training',
  lifestyle_desi: 'Desi Lifestyle & Chai',
  health_clinical: 'Health & Medical Safety',
  preferences_budget: 'Diet & Household Budget',
};

export const OnboardingSurveyScreen: React.FC<OnboardingSurveyScreenProps> = ({
  onComplete,
  onCancel,
}) => {
  const { theme } = useTheme();
  const [engine] = useState(() => new SurveyStateEngine());
  const [stepIndex, setStepIndex] = useState(engine.getCurrentStepIndex());
  const [, setRerender] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const forceUpdate = () => setRerender((prev) => prev + 1);

  const currentStep = engine.getCurrentStep();
  const errors = engine.getErrors();
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === engine.getTotalSteps() - 1;

  const handleNext = () => {
    const success = engine.nextStep();
    if (success) {
      if (isLastStep && engine.isComplete()) {
        const payload = engine.serializePayload();
        const bridged = bridgeSurveyToNutritionCore(payload);
        onComplete(payload, bridged);
      } else {
        setStepIndex(engine.getCurrentStepIndex());
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    } else {
      forceUpdate();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePrev = () => {
    if (engine.prevStep()) {
      setStepIndex(engine.getCurrentStepIndex());
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      forceUpdate();
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      <ProgressBar
        currentStep={stepIndex}
        totalSteps={engine.getTotalSteps()}
        stepTitle={STEP_TITLES[currentStep] || 'Onboarding Assessment'}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 'basics' && (
          <StepBasics
            data={engine.getBasics()}
            onChange={(updated) => {
              engine.setBasics(updated);
              forceUpdate();
            }}
            errors={errors}
          />
        )}

        {currentStep === 'occupational' && (
          <StepOccupational
            data={engine.getOccupational()}
            onChange={(updated) => {
              engine.setOccupational(updated);
              forceUpdate();
            }}
            errors={errors}
          />
        )}

        {currentStep === 'exercise' && (
          <StepExercise
            data={engine.getExercise()}
            onChange={(updated) => {
              engine.setExercise(updated);
              forceUpdate();
            }}
            errors={errors}
          />
        )}

        {currentStep === 'lifestyle_desi' && (
          <StepLifestyleDesi
            data={engine.getLifestyleDesi()}
            onChange={(updated) => {
              engine.setLifestyleDesi(updated);
              forceUpdate();
            }}
            errors={errors}
          />
        )}

        {currentStep === 'health_clinical' && (
          <StepHealthClinical
            data={engine.getHealthClinical()}
            onChange={(updated) => {
              engine.setHealthClinical(updated);
              forceUpdate();
            }}
            errors={errors}
          />
        )}

        {currentStep === 'preferences_budget' && (
          <StepPreferencesBudget
            data={engine.getPreferencesBudget()}
            onChange={(updated) => {
              engine.setPreferencesBudget(updated);
              forceUpdate();
            }}
            errors={errors}
          />
        )}
      </ScrollView>

      {/* Persistent Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: theme.colors.surfaceSecondary },
            isFirstStep && !onCancel && styles.btnDisabled,
          ]}
          onPress={handlePrev}
          disabled={isFirstStep && !onCancel}
          activeOpacity={0.7}
        >
          <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>
            {isFirstStep ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextBtn,
            {
              backgroundColor: theme.colors.primaryLime,
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.7}
        >
          <Text style={[styles.nextBtnText, { color: theme.colors.limeText }]}>
            {isLastStep ? 'Complete Assessment' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.3,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
