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
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

interface OnboardingSurveyScreenProps {
  onComplete: (
    payload: LifestyleSurveyPayload,
    bridged: ReturnType<typeof bridgeSurveyToNutritionCore>
  ) => void;
  onCancel?: () => void;
  onSkip?: () => void;
}

export const OnboardingSurveyScreen: React.FC<OnboardingSurveyScreenProps> = ({
  onComplete,
  onCancel,
  onSkip,
}) => {
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const stepTitle = (id: string) => t(`survey.stepTitles.${id}.${activeRegion}`);
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
        stepTitle={stepTitle(currentStep)}
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
            userSex={engine.getBasics().sex}
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
        <View style={styles.buttonRow}>
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
            <Text style={[styles.backBtnText, dir.textCenter, { color: theme.colors.textPrimary }]}>
              {isFirstStep ? t('common.cancel') : t('common.back')}
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
            <Text style={[styles.nextBtnText, dir.textCenter, { color: theme.colors.limeText }]}>
              {isLastStep ? t('survey.completeAssessment') : t('common.continue')}
            </Text>
          </TouchableOpacity>
        </View>

        {onSkip && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={onSkip}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('survey.skip')}
          >
            <Text style={[styles.skipBtnText, dir.textCenter, { color: theme.colors.textMuted }]}>
              {t('survey.skip')} {dir.isRTL ? '←' : '→'}
            </Text>
          </TouchableOpacity>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
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
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 44,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
