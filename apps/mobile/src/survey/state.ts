import {
  LifestyleSurveyPayload,
  SurveyBasics,
  SurveyExercise,
  SurveyHealthClinical,
  SurveyLifestyleDesi,
  SurveyOccupational,
  SurveyPreferencesBudget,
  SurveyStepId,
} from './types.js';
import {
  validateBasics,
  validateExercise,
  validateHealthClinical,
  validateLifestyleDesi,
  validateOccupational,
  validatePreferencesBudget,
} from './validation.js';

export const SURVEY_STEPS: SurveyStepId[] = [
  'basics',
  'occupational',
  'exercise',
  'lifestyle_desi',
  'health_clinical',
  'preferences_budget',
];

export class SurveyStateEngine {
  private currentStepIndex: number = 0;
  private basics: Partial<SurveyBasics> = {};
  private occupational: Partial<SurveyOccupational> = {};
  private exercise: Partial<SurveyExercise> = {};
  private lifestyleDesi: Partial<SurveyLifestyleDesi> = {};
  private healthClinical: Partial<SurveyHealthClinical> = {
    medicalConditions: ['none'],
    isPregnantOrBreastfeeding: false,
    medicalDisclaimerAccepted: true,
  };
  private preferencesBudget: Partial<SurveyPreferencesBudget> = {};
  private currentErrors: Record<string, string> = {};

  constructor(initialDraft?: Partial<LifestyleSurveyPayload>) {
    if (initialDraft) {
      this.loadDraft(initialDraft);
    }
  }

  public getCurrentStep(): SurveyStepId {
    return SURVEY_STEPS[this.currentStepIndex];
  }

  public getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  public getTotalSteps(): number {
    return SURVEY_STEPS.length;
  }

  public getProgressPercentage(): number {
    return Math.round(((this.currentStepIndex + 1) / SURVEY_STEPS.length) * 100);
  }

  public getErrors(): Record<string, string> {
    return { ...this.currentErrors };
  }

  // Section setters
  public setBasics(data: Partial<SurveyBasics>): void {
    this.basics = { ...this.basics, ...data };
    this.currentErrors = {};
  }

  public setOccupational(data: Partial<SurveyOccupational>): void {
    this.occupational = { ...this.occupational, ...data };
    this.currentErrors = {};
  }

  public setExercise(data: Partial<SurveyExercise>): void {
    this.exercise = { ...this.exercise, ...data };
    this.currentErrors = {};
  }

  public setLifestyleDesi(data: Partial<SurveyLifestyleDesi>): void {
    this.lifestyleDesi = { ...this.lifestyleDesi, ...data };
    this.currentErrors = {};
  }

  public setHealthClinical(data: Partial<SurveyHealthClinical>): void {
    this.healthClinical = { ...this.healthClinical, ...data };
    this.currentErrors = {};
  }

  public setPreferencesBudget(data: Partial<SurveyPreferencesBudget>): void {
    this.preferencesBudget = { ...this.preferencesBudget, ...data };
    this.currentErrors = {};
  }

  // Getters
  public getBasics(): Partial<SurveyBasics> {
    return { ...this.basics };
  }

  public getOccupational(): Partial<SurveyOccupational> {
    return { ...this.occupational };
  }

  public getExercise(): Partial<SurveyExercise> {
    return { ...this.exercise };
  }

  public getLifestyleDesi(): Partial<SurveyLifestyleDesi> {
    return { ...this.lifestyleDesi };
  }

  public getHealthClinical(): Partial<SurveyHealthClinical> {
    return { ...this.healthClinical };
  }

  public getPreferencesBudget(): Partial<SurveyPreferencesBudget> {
    return { ...this.preferencesBudget };
  }

  // Validation for current step
  public validateCurrentStep(): boolean {
    const step = this.getCurrentStep();
    let result = { isValid: true, errors: {} as Record<string, string> };

    switch (step) {
      case 'basics':
        result = validateBasics(this.basics);
        break;
      case 'occupational':
        result = validateOccupational(this.occupational);
        break;
      case 'exercise':
        result = validateExercise(this.exercise);
        break;
      case 'lifestyle_desi':
        result = validateLifestyleDesi(this.lifestyleDesi);
        break;
      case 'health_clinical':
        result = validateHealthClinical(this.healthClinical);
        break;
      case 'preferences_budget':
        result = validatePreferencesBudget(this.preferencesBudget);
        break;
    }

    this.currentErrors = result.errors;
    return result.isValid;
  }

  // Navigation
  public nextStep(): boolean {
    if (!this.validateCurrentStep()) {
      return false;
    }

    if (this.currentStepIndex < SURVEY_STEPS.length - 1) {
      this.currentStepIndex++;
      this.currentErrors = {};
      return true;
    }

    return true; // Reached end
  }

  public prevStep(): boolean {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.currentErrors = {};
      return true;
    }
    return false;
  }

  public isComplete(): boolean {
    return (
      validateBasics(this.basics).isValid &&
      validateOccupational(this.occupational).isValid &&
      validateExercise(this.exercise).isValid &&
      validateLifestyleDesi(this.lifestyleDesi).isValid &&
      validateHealthClinical(this.healthClinical).isValid &&
      validatePreferencesBudget(this.preferencesBudget).isValid
    );
  }

  public serializePayload(): LifestyleSurveyPayload {
    if (!this.isComplete()) {
      throw new Error('Cannot serialize survey: all sections must pass validation.');
    }

    return {
      version: 1,
      completedAt: new Date().toISOString(),
      basics: this.basics as SurveyBasics,
      occupational: this.occupational as SurveyOccupational,
      exercise: this.exercise as SurveyExercise,
      lifestyleDesi: this.lifestyleDesi as SurveyLifestyleDesi,
      healthClinical: this.healthClinical as SurveyHealthClinical,
      preferencesBudget: this.preferencesBudget as SurveyPreferencesBudget,
    };
  }

  public loadDraft(draft: Partial<LifestyleSurveyPayload>): void {
    if (draft.basics) this.basics = { ...draft.basics };
    if (draft.occupational) this.occupational = { ...draft.occupational };
    if (draft.exercise) this.exercise = { ...draft.exercise };
    if (draft.lifestyleDesi) this.lifestyleDesi = { ...draft.lifestyleDesi };
    if (draft.healthClinical) this.healthClinical = { ...draft.healthClinical };
    if (draft.preferencesBudget) this.preferencesBudget = { ...draft.preferencesBudget };
  }
}
