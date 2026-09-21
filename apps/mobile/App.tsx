import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  LifestyleSurveyPayload,
  bridgeSurveyToNutritionCore,
} from './src/survey/index.js';
import { OnboardingSurveyScreen } from './src/survey/ui/index.js';
import { ComputedUserPlan, PlanUserContext } from './src/plan/index.js';
import { PlanWorkflowScreen, WeeklyPlanView } from './src/plan/ui/index.js';
import { TrackerDashboardScreen } from './src/tracker/ui/index.js';
import { WeightTrackerScreen } from './src/weight/ui/index.js';
import { CoachChatScreen, WeeklyCheckInScreen } from './src/coach/index.js';
import { AuthScreen, getAuthSession, clearAuthSession, restoreSession, markSurveyCompleted } from './src/auth/index.js';
import { syncCompleteOnboarding, hydrateUserDataFromCloud } from './src/sync/userDataSync.js';
import { loadPersistedPlan, savePersistedPlan } from './src/tracker/activityStorage.js';
import { Icon } from './src/ui/Icon.js';

import { ThemeProvider, useTheme } from './src/theme.js';
import { RegionProvider, useRegion } from './src/common/region/index.js';
import { DailyTrackerSummary } from './src/tracker/types.js';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const DEFAULT_ACTIVE_PLAN: ComputedUserPlan = {
  region: 'PK',
  userContext: {
    weightKg: 75,
    heightCm: 175,
    ageYears: 28,
    sex: 'male',
    bmr: 1700,
    tdee: 2350,
    bodyFatPct: 18,
    isPregnantOrBreastfeeding: false,
    medicalConditions: [],
    chaiSugarKcalPerDay: 130,
    weeklyChaiSugarKcal: 910,
    isNightShift: false,
    dailySittingHours: 8,
  },
  goalSelection: {
    goal: 'lose',
    targetRateKgPerWeek: 0.5,
    targetWeightKg: 70,
  },
  targetResult: {
    kcalTarget: 1850,
    floorApplied: false,
    weeklyChaiDeductionKcal: 130,
    rawDeficit: 500,
    flags: [],
  },
  macros: {
    proteinGrams: 140,
    fatGrams: 50,
    carbGrams: 210,
    fiberGrams: 30,
    waterMl: 2800,
  },
  projection: {
    currentWeightKg: 75,
    targetWeightKg: 70,
    totalKgToChange: 5,
    weeklyRateKg: 0.5,
    estimatedWeeks: 10,
    isRealistic: true,
    pacingAdvice: 'Healthy, sustainable cultural fat loss pace.',
  },
};

function NutrioAppContent() {
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const [appState, setAppState] = useState<
    | 'auth'
    | 'survey'
    | 'plan_flow'
    | 'active_tracker'
    | 'weight_tracker'
    | 'weekly_plan'
    | 'coach_chat'
    | 'weekly_checkin'
  >(() => {
    // If user has an active session, boot directly to tracker; otherwise start directly at auth (Login)
    return getAuthSession() ? 'active_tracker' : 'auth';
  });
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(() => {
    // In test environment, skip splash to ensure deterministic renders
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return false;
    }
    return true;
  });
  const [surveyData, setSurveyData] = useState<{
    payload: LifestyleSurveyPayload;
    bridged: ReturnType<typeof bridgeSurveyToNutritionCore>;
  } | null>(null);
  const [activePlan, setActivePlan] = useState<ComputedUserPlan>(() => {
    return loadPersistedPlan() || DEFAULT_ACTIVE_PLAN;
  });
  const [trackerSummary, setTrackerSummary] = useState<DailyTrackerSummary | null>(null);

  // Restore Supabase session on boot & hydrate personalized cloud data
  useEffect(() => {
    let isMounted = true;
    restoreSession()
      .then(async (session) => {
        if (session) {
          const hydration = await hydrateUserDataFromCloud().catch(() => null);
          const restoredPlan = hydration?.computedPlan || loadPersistedPlan();
          if (restoredPlan && isMounted) {
            setActivePlan(restoredPlan);
            savePersistedPlan(restoredPlan);
          }
          if (isMounted && appState === 'auth') {
            setAppState('active_tracker');
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const wrapScreen = (content: React.ReactNode) => (
    <View style={[styles.rootWrapper, { backgroundColor: theme.colors.canvas }]}>
      <View style={styles.appConstraint}>
        {content}
      </View>
    </View>
  );

  // Startup Splash Screen during session restore & telemetry synchronization
  if (isBootstrapping) {
    const isSaudi = activeRegion === 'SA';
    const accentColor = theme.colors.primaryLime;
    return (
      <View style={[styles.rootWrapper, { backgroundColor: theme.colors.canvas }]}>
        <View style={styles.splashContainer}>
          <View
            style={[
              styles.splashIconCircle,
              {
                backgroundColor: theme.colors.surface,
                borderColor: accentColor,
              },
            ]}
          >
            <Icon name="zap" size={36} color={accentColor} />
          </View>
          <Text style={[styles.splashTitle, { color: theme.colors.textPrimary }]}>
            NUTRIO
          </Text>
          <Text style={[styles.splashSubtitle, { color: theme.colors.textSecondary }]}>
            {isSaudi
              ? 'النظام الغذائي الذكي والمتخصص · Saudi Arabia'
              : 'Precision Cultural Nutrition · Pakistan'}
          </Text>
          <View style={styles.splashIndicatorWrapper}>
            <ActivityIndicator size="small" color={accentColor} />
            <Text style={[styles.splashStatusText, { color: theme.colors.textMuted }]}>
              {isSaudi
                ? 'جاري استعادة الجلسة والبيانات...'
                : 'Synchronizing telemetry...'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // 2. Authentication Screen (Sign In / Register - Primary Entry)
  if (appState === 'auth') {
    return wrapScreen(
      <AuthScreen
        initialMode="login"
        onAuthSuccess={async (_session) => {
          setIsGuest(false);
          const hydration = await hydrateUserDataFromCloud().catch(() => null);
          const restoredPlan = hydration?.computedPlan || loadPersistedPlan();
          if (restoredPlan) {
            setActivePlan(restoredPlan);
            savePersistedPlan(restoredPlan);
          }
          // Directly enter active tracker dashboard to track user activity immediately
          setAppState('active_tracker');
        }}
        onBackToHome={() => setAppState('auth')}
        onExploreGuest={() => {
          setIsGuest(true);
          setAppState('active_tracker');
        }}
      />
    );
  }

  // 3. Survey Flow (Onboarding with Skip for Now option)
  if (appState === 'survey') {
    return wrapScreen(
      <OnboardingSurveyScreen
        onComplete={(payload, bridged) => {
          setSurveyData({ payload, bridged });
          setAppState('plan_flow');
        }}
        onSkip={() => {
          // Skipping survey marks as completed/bypassed and routes directly to user dashboard
          markSurveyCompleted();
          setAppState('active_tracker');
        }}
        onCancel={() => setAppState('auth')}
      />
    );
  }

  // 4. Plan Workflow (Analysis -> Goal Selection -> Plan Reveal)
  if (appState === 'plan_flow' && (surveyData || activePlan)) {
    const userContext: PlanUserContext = surveyData ? {
      weightKg: surveyData.payload.basics.weightKg,
      heightCm: surveyData.payload.basics.heightCm,
      ageYears: surveyData.payload.basics.ageYears,
      sex: surveyData.payload.basics.sex,
      bmr: surveyData.bridged.bmrResults.selectedBMR,
      tdee: surveyData.bridged.tdeeResults.tdee,
      bodyFatPct: surveyData.payload.basics.bodyFatPct,
      isPregnantOrBreastfeeding: surveyData.payload.healthClinical.isPregnantOrBreastfeeding,
      medicalConditions: surveyData.payload.healthClinical.medicalConditions,
      chaiSugarKcalPerDay: surveyData.bridged.culturalMetrics.dailyChaiKcal ?? 130,
      weeklyChaiSugarKcal: surveyData.bridged.culturalMetrics.weeklyChaiKcal ?? 910,
      isNightShift: surveyData.bridged.culturalMetrics.isNightShift ?? false,
      dailySittingHours: surveyData.payload.occupational.dailySittingHours ?? 8,
    } : activePlan!.userContext;

    return wrapScreen(
      <PlanWorkflowScreen
        userContext={userContext}
        onPlanAccepted={(computedPlan) => {
          setActivePlan(computedPlan);
          savePersistedPlan(computedPlan);
          markSurveyCompleted();
          if (surveyData) {
            syncCompleteOnboarding(surveyData.payload, computedPlan).catch((err) => {
              console.warn('[NutrioApp] Background onboarding sync error:', err);
            });
          }
          setAppState('active_tracker');
        }}
        onCancel={() => {
          if (activePlan) {
            setAppState('active_tracker');
          } else if (surveyData) {
            setAppState('survey');
          } else {
            setAppState('auth');
          }
        }}
      />
    );
  }

  // 5. Active Daily Tracker Dashboard
  if (appState === 'active_tracker') {
    const sessionUser = getAuthSession()?.user;
    const dynamicTargets = activePlan
      ? {
          targetCalories: activePlan.targetResult.kcalTarget,
          targetProteinGrams: activePlan.macros.proteinGrams,
          targetFatGrams: activePlan.macros.fatGrams,
          targetCarbGrams: activePlan.macros.carbGrams,
          targetWaterMl: activePlan.macros.waterMl,
        }
      : {
          targetCalories: DEFAULT_ACTIVE_PLAN.targetResult.kcalTarget,
          targetProteinGrams: DEFAULT_ACTIVE_PLAN.macros.proteinGrams,
          targetFatGrams: DEFAULT_ACTIVE_PLAN.macros.fatGrams,
          targetCarbGrams: DEFAULT_ACTIVE_PLAN.macros.carbGrams,
          targetWaterMl: DEFAULT_ACTIVE_PLAN.macros.waterMl,
        };

    return wrapScreen(
      <TrackerDashboardScreen
        userName={
          isGuest
            ? (activeRegion === 'SA' ? 'ضيف' : 'Guest')
            : (sessionUser?.name || (activeRegion === 'SA' ? 'Habibi' : 'User'))
        }
        targets={dynamicTargets}
        isGuest={isGuest}
        onRequireAuth={() => setAppState('auth')}
        onSummaryChange={setTrackerSummary}
        onOpenHome={() => setAppState('auth')}
        onLogout={() => {
          clearAuthSession();
          setIsGuest(false);
          setAppState('auth');
        }}
        onBackToPlan={() => setAppState('plan_flow')}
        onOpenWeightTracker={() => setAppState('weight_tracker')}
        onOpenMealPlan={() => setAppState('weekly_plan')}
        onOpenCoachChat={() => setAppState('coach_chat')}
        onOpenSurvey={() => setAppState('survey')}
      />
    );
  }

  // 4. AI Nutritionist Chat Screen (Dynamic from user activity)
  if (appState === 'coach_chat') {
    const sessionUser = getAuthSession()?.user;
    const isSaudi = activeRegion === 'SA';
    const totalConsumed = trackerSummary ? trackerSummary.totalCaloriesConsumed : 0;
    const remainingCals = trackerSummary
      ? trackerSummary.remainingCalories
      : (activePlan?.targetResult.kcalTarget || 2000);
    const loggedFoodNames = trackerSummary && trackerSummary.items.length > 0
      ? trackerSummary.items.map((i) => i.foodName)
      : [];

    const coachContext = {
      displayName: sessionUser?.name || (isSaudi ? 'Habibi' : 'Friend'),
      sex: (surveyData?.payload.basics.sex as any) || 'male',
      ageYears: surveyData?.payload.basics.ageYears || 28,
      weightKg: activePlan?.userContext.weightKg || 75,
      goal: (activePlan?.goalSelection.goal as any) || 'lose',
      region: activeRegion,
      targets: {
        kcalTarget: activePlan?.targetResult.kcalTarget || 2000,
        proteinGrams: activePlan?.macros.proteinGrams || 140,
        fatGrams: activePlan?.macros.fatGrams || 55,
        carbGrams: activePlan?.macros.carbGrams || 235,
        waterMl: activePlan?.macros.waterMl || 3000,
      },
      todaySummary: {
        caloriesConsumed: totalConsumed,
        proteinConsumed: trackerSummary ? trackerSummary.totalProteinConsumed : 0,
        fatConsumed: trackerSummary ? trackerSummary.totalFatConsumed : 0,
        carbConsumed: trackerSummary ? trackerSummary.totalCarbConsumed : 0,
        remainingCalories: remainingCals,
        foodsLoggedToday: loggedFoodNames,
      },
      medicalFlags: surveyData?.payload.healthClinical.medicalConditions || [],
      dietaryPreferences: [surveyData?.payload.preferencesBudget?.dietPreference || 'halal_omnivore'],
    };

    return wrapScreen(
      <CoachChatScreen
        context={coachContext}
        onBack={() => setAppState('active_tracker')}
      />
    );
  }

  // 5. Weekly Adaptive Check-In Screen (Dynamic from user activity)
  if (appState === 'weekly_checkin') {
    const isSaudi = activeRegion === 'SA';
    const hasLogs = trackerSummary && trackerSummary.items.length > 0;
    const daysLogged = hasLogs ? 1 : 0;
    const meanDailyIntake = hasLogs ? trackerSummary!.totalCaloriesConsumed : 0;

    const dynamicMetrics = {
      daysLogged: daysLogged,
      meanDailyIntake: meanDailyIntake || (activePlan?.targetResult.kcalTarget || 1800),
      currentEWMAWeightKg: activePlan?.userContext.weightKg || 75,
      weightDeltaKg: 0,
      adherenceRatePct: daysLogged > 0 ? 100 : 0,
      oldTDEE: activePlan?.userContext.tdee || 2300,
      newTDEE: activePlan?.userContext.tdee || 2300,
      tdeeDelta: 0,
      oldKcalTarget: activePlan?.targetResult.kcalTarget || 1800,
      newKcalTarget: activePlan?.targetResult.kcalTarget || 1800,
      targetDelta: 0,
    };

    const dynamicNarrative = {
      headline: isSaudi
        ? 'المعايرة الحيوية الأسبوعية · Weekly Metabolic Calibration'
        : 'Metabolic Recalibration: Active Pace',
      summaryText: isSaudi
        ? 'يقوم النظام السريري بتحليل استهلاكك اليومي ومعدل حرق الطاقة TDEE لحماية كتلتك العضلية وضمان نزول دهون مستدام مع أسلوب حياتك في المملكة.'
        : 'Your closed-loop clinical engine analyzes daily food intake and scale trends to continuously calibrate your true energy expenditure.',
      keyActionLever: isSaudi
        ? 'وازن حصص الأرز في الكبسة واعتمد على قياس قبضة اليد للبروتين مع موازنة التمر والقهوة.'
        : 'Continue measuring cooking oil in curries and add a 15-minute brisk walk after dinner.',
    };

    return wrapScreen(
      <WeeklyCheckInScreen
        displayName={getAuthSession()?.user?.name || (isSaudi ? 'Habibi' : 'Client')}
        metrics={dynamicMetrics}
        narrative={dynamicNarrative}
        onAcceptNewTargets={(_newTarget) => {
          setAppState('active_tracker');
        }}
        onBack={() => setAppState('active_tracker')}
      />
    );
  }

  // 6. Weight Trend & Closed-Loop Adaptive TDEE Screen
  if (appState === 'weight_tracker' && activePlan) {
    return wrapScreen(
      <WeightTrackerScreen
        initialState={{
          weighIns: [
            {
              id: 'initial_weigh_in',
              date: new Date().toISOString().split('T')[0],
              weightKg: activePlan.userContext.weightKg,
              loggedAt: new Date().toISOString(),
            },
          ],
          intakeLogs: [],
          formulaTDEE: activePlan.userContext.tdee,
          bmr: activePlan.userContext.bmr,
        }}
        onBackToTracker={() => setAppState('active_tracker')}
      />
    );
  }

  // 5. Weekly 7-Day Meal Plan & One-Tap Swap Screen
  if (appState === 'weekly_plan' && activePlan) {
    return wrapScreen(
      <WeeklyPlanView
        solverInput={{
          targetCalories: activePlan.targetResult.kcalTarget,
          targetProteinGrams: activePlan.macros.proteinGrams,
          targetFatGrams: activePlan.macros.fatGrams,
          targetCarbGrams: activePlan.macros.carbGrams,
          dietPreference:
            surveyData?.payload.preferencesBudget?.dietPreference ||
            'halal_omnivore',
          budgetTierPKR:
            surveyData?.payload.preferencesBudget?.budgetTierPKR ||
            'standard_3500_7000',
          dislikedFoods:
            surveyData?.payload.preferencesBudget?.dislikedFoods || [],
          medicalConditions:
            surveyData?.payload.healthClinical.medicalConditions || [],
        }}
        onBackToDashboard={() => setAppState('active_tracker')}
      />
    );
  }

  // 6. Modern Default Landing Fallback (Direct to Login)
  return wrapScreen(
    <AuthScreen
      initialMode="login"
      onAuthSuccess={async (_session) => {
        setIsGuest(false);
        const hydration = await hydrateUserDataFromCloud().catch(() => null);
        if (hydration?.computedPlan) {
          setActivePlan(hydration.computedPlan);
          savePersistedPlan(hydration.computedPlan);
        }
        setAppState('survey');
      }}
      onBackToHome={() => setAppState('auth')}
      onExploreGuest={() => {
        setIsGuest(true);
        setAppState('active_tracker');
      }}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="light">
        <RegionProvider>
          <NutrioAppContent />
        </RegionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  appConstraint: {
    flex: 1,
    width: '100%',
    maxWidth: 500,
  },
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  splashIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 6,
  },
  splashSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 32,
    textAlign: 'center',
  },
  splashIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splashStatusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

