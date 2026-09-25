import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  LifestyleSurveyPayload,
  bridgeSurveyToNutritionCore,
  savePersistedSurvey,
  hydratePersistedSurvey,
  releaseSurveyCache,
} from './src/survey/index.js';
import { OnboardingSurveyScreen } from './src/survey/ui/index.js';
import { ComputedUserPlan, PlanUserContext } from './src/plan/index.js';
import { PlanWorkflowScreen, WeeklyPlanView } from './src/plan/ui/index.js';
import { TrackerDashboardScreen } from './src/tracker/ui/index.js';
import { WeightTrackerScreen } from './src/weight/ui/index.js';
import { CoachChatScreen, WeeklyCheckInScreen } from './src/coach/index.js';
import { AuthScreen, getAuthSession, clearAuthSession, restoreSession, markSurveyCompleted } from './src/auth/index.js';
import { syncCompleteOnboarding, hydrateUserDataFromCloud } from './src/sync/userDataSync.js';
import {
  loadPersistedPlan,
  savePersistedPlan,
  hydratePersistedPlan,
  hydrateActivityStorage,
  primeActivitiesFromRemote,
  releaseLocalUserCache,
} from './src/tracker/activityStorage.js';
import { fetchActivityHistory } from './src/sync/activitySync.js';

import { ThemeProvider, useTheme } from './src/theme.js';
import { RegionProvider, useRegion } from './src/common/region/index.js';
import { I18nProvider, useTranslation, useTextDirection } from './src/i18n/index.js';
import { DailyTrackerSummary } from './src/tracker/types.js';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Keep the native splash (app logo) up until the session restore finishes.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

function NutrioAppContent() {
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
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
  const [activePlan, setActivePlan] = useState<ComputedUserPlan | null>(() => {
    return loadPersistedPlan();
  });
  const [trackerSummary, setTrackerSummary] = useState<DailyTrackerSummary | null>(null);

  // Pulls the signed-in user's activity history down and seeds local storage,
  // so a re-login or a new device shows the days they already logged.
  const restoreActivityHistory = async () => {
    const remote = await fetchActivityHistory().catch(() => []);
    if (remote.length > 0) {
      primeActivitiesFromRemote(remote);
    }
    // Cover today and yesterday from durable native storage for offline days
    // the backend has not seen yet.
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    await hydrateActivityStorage([
      today.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
    ]).catch(() => {});
  };

  // Brings a signed-in user's plan and survey answers back, from the cloud when
  // the backend is reachable and from durable on-device storage otherwise, and
  // reports whether onboarding still needs to run.
  const restoreUserData = async (): Promise<{ plan: ComputedUserPlan | null }> => {
    const hydration = await hydrateUserDataFromCloud().catch(() => null);
    await restoreActivityHistory();

    const restoredSurvey =
      hydration?.surveyPayload || (await hydratePersistedSurvey().catch(() => null));
    if (restoredSurvey) {
      setSurveyData({
        payload: restoredSurvey,
        bridged: bridgeSurveyToNutritionCore(restoredSurvey),
      });
      savePersistedSurvey(restoredSurvey);
    }

    const restoredPlan =
      hydration?.computedPlan ||
      (await hydratePersistedPlan().catch(() => null)) ||
      loadPersistedPlan();
    if (restoredPlan) {
      setActivePlan(restoredPlan);
      savePersistedPlan(restoredPlan);
    }

    return { plan: restoredPlan ?? null };
  };

  // Restore Supabase session on boot & hydrate personalized cloud data
  useEffect(() => {
    let isMounted = true;
    restoreSession()
      .then(async (session) => {
        if (session) {
          const { plan } = await restoreUserData();
          if (isMounted && appState === 'auth') {
            if (session.user.surveyCompleted || plan) {
              setAppState('active_tracker');
            } else {
              setAppState('survey');
            }
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

  useEffect(() => {
    if (!isBootstrapping) {
      SplashScreen.hide();
    }
  }, [isBootstrapping]);

  // Native mirroring only applies after a restart, and react-native-web reads
  // the CSS direction rather than I18nManager, so the root states it either way.
  const wrapScreen = (content: React.ReactNode) => (
    <View
      style={[styles.rootWrapper, { backgroundColor: theme.colors.canvas, direction: dir.direction }]}
    >
      <View style={styles.appConstraint}>
        {content}
      </View>
    </View>
  );

  // Startup Splash Screen during session restore & telemetry synchronization
  if (isBootstrapping) {
    const accentColor = theme.colors.primaryLime;
    return (
      <View style={[styles.rootWrapper, { backgroundColor: theme.colors.canvas }]}>
        <View style={styles.splashContainer}>
          <Image
            source={require('./assets/logo.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
          <Text style={[styles.splashTitle, { color: theme.colors.textPrimary }]}>
            NUTRIO
          </Text>
          <Text style={[styles.splashSubtitle, dir.textCenter, { color: theme.colors.textSecondary }]}>
            {t('app.splash.tagline')}
          </Text>
          <View style={styles.splashIndicatorWrapper}>
            <ActivityIndicator size="small" color={accentColor} />
            <Text style={[styles.splashStatusText, dir.text, { color: theme.colors.textMuted }]}>
              {t('app.splash.status')}
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
        onAuthSuccess={async (session) => {
          setIsGuest(false);
          const { plan } = await restoreUserData();
          if (plan || session.user.surveyCompleted) {
            // Returning user: their targets and answers are already on record,
            // so onboarding must not run again.
            setAppState('active_tracker');
          } else {
            // New user without calculated plan: guide them to survey to calculate real targets
            // (or user can tap Skip for Now to track without targets)
            setAppState('survey');
          }
        }}
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
          savePersistedSurvey(payload);
          // Recorded here, not only once a plan is accepted: the answers are in
          // and the user must never be asked for them a second time, even if
          // they leave before the plan screen.
          markSurveyCompleted().catch(() => {});
          setAppState('plan_flow');
        }}
        onSkip={() => {
          // Skipping survey marks as completed/bypassed and routes directly to user dashboard
          markSurveyCompleted().catch(() => {});
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
          markSurveyCompleted().catch(() => {});
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
    const dynamicTargets = (!isGuest && activePlan)
      ? {
          targetCalories: activePlan.targetResult.kcalTarget,
          targetProteinGrams: activePlan.macros.proteinGrams,
          targetFatGrams: activePlan.macros.fatGrams,
          targetCarbGrams: activePlan.macros.carbGrams,
          targetWaterMl: activePlan.macros.waterMl,
        }
      : {
          targetCalories: 0,
          targetProteinGrams: 0,
          targetFatGrams: 0,
          targetCarbGrams: 0,
          targetWaterMl: 0,
        };

    return wrapScreen(
      <TrackerDashboardScreen
        userName={
          isGuest ? t('app.guest') : sessionUser?.name || t('app.defaultUserName')
        }
        targets={dynamicTargets}
        isGuest={isGuest}
        onRequireAuth={() => setAppState('auth')}
        onSummaryChange={setTrackerSummary}
        onOpenHome={() => setAppState('auth')}
        onLogout={() => {
          // Drop the in-memory copies so the next account starts clean. The
          // durable records stay: they are keyed by user id, and wiping them
          // here is what made a returning user redo the whole survey.
          releaseLocalUserCache();
          releaseSurveyCache();
          clearAuthSession().catch(() => {});
          setIsGuest(false);
          setActivePlan(null);
          setSurveyData(null);
          setTrackerSummary(null);
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
    const totalConsumed = trackerSummary ? trackerSummary.totalCaloriesConsumed : 0;
    const remainingCals = trackerSummary
      ? trackerSummary.remainingCalories
      : (activePlan?.targetResult.kcalTarget || 2000);
    const loggedFoodNames = trackerSummary && trackerSummary.items.length > 0
      ? trackerSummary.items.map((i) => i.foodName)
      : [];

    const coachContext = {
      displayName: sessionUser?.name || t('app.coachFallbackName'),
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
      headline: t('app.checkin.headline'),
      summaryText: t('app.checkin.summary'),
      keyActionLever: t('app.checkin.keyAction'),
    };

    return wrapScreen(
      <WeeklyCheckInScreen
        displayName={getAuthSession()?.user?.name || t('app.checkinFallbackName')}
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
      onAuthSuccess={async (session) => {
        setIsGuest(false);
        const { plan } = await restoreUserData();
        setAppState(plan || session.user.surveyCompleted ? 'active_tracker' : 'survey');
      }}
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
          <I18nProvider>
            <NutrioAppContent />
          </I18nProvider>
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
  splashLogo: {
    width: 120,
    height: 136,
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

