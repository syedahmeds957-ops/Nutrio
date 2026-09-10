import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  LifestyleSurveyPayload,
  bridgeSurveyToNutritionCore,
} from './src/survey/index.js';
import { OnboardingSurveyScreen } from './src/survey/ui/index.js';
import {
  ComputedUserPlan,
  PlanUserContext,
} from './src/plan/index.js';
import { PlanWorkflowScreen, WeeklyPlanView } from './src/plan/ui/index.js';
import { TrackerDashboardScreen } from './src/tracker/ui/index.js';
import { WeightTrackerScreen } from './src/weight/ui/index.js';
import { CoachChatScreen, WeeklyCheckInScreen } from './src/coach/index.js';
import { HomeScreen } from './src/home/index.js';
import { AuthScreen, getAuthSession, clearAuthSession, restoreSession } from './src/auth/index.js';
import { syncCompleteOnboarding } from './src/sync/userDataSync.js';

const DEFAULT_ACTIVE_PLAN: ComputedUserPlan = {
  userContext: {
    weightKg: 78,
    heightCm: 175,
    ageYears: 28,
    sex: 'male',
    bmr: 1720,
    tdee: 2360,
    chaiSugarKcalPerDay: 180,
    weeklyChaiSugarKcal: 1260,
    isNightShift: false,
    dailySittingHours: 7,
  },
  goalSelection: {
    goal: 'lose',
    targetRateKgPerWeek: 0.5,
    targetWeightKg: 72,
  },
  targetResult: {
    kcalTarget: 1850,
    deficitKcal: 510,
    isSafe: true,
  } as any,
  macros: {
    proteinGrams: 140,
    fatGrams: 55,
    carbGrams: 195,
    waterMl: 2500,
  } as any,
  projection: {
    currentWeightKg: 78,
    targetWeightKg: 72,
    weeklyRateKg: 0.5,
    isRealistic: true,
    pacingAdvice: 'Sustainable deficit with daily chai accounted for',
  },
};

import { ThemeProvider, useTheme } from './src/theme.js';

function NutrioAppContent() {
  const { theme } = useTheme();
  const [appState, setAppState] = useState<
    | 'home'
    | 'auth'
    | 'survey'
    | 'plan_flow'
    | 'active_tracker'
    | 'weight_tracker'
    | 'weekly_plan'
    | 'coach_chat'
    | 'weekly_checkin'
  >(() => {
    // If user has an active session, boot directly to tracker; otherwise start at home
    return getAuthSession() ? 'active_tracker' : 'home';
  });
  const [surveyData, setSurveyData] = useState<{
    payload: LifestyleSurveyPayload;
    bridged: ReturnType<typeof bridgeSurveyToNutritionCore>;
  } | null>(null);
  const [activePlan, setActivePlan] = useState<ComputedUserPlan | null>(
    DEFAULT_ACTIVE_PLAN
  );

  // Restore Supabase session on boot
  useEffect(() => {
    restoreSession()
      .then((session) => {
        if (session && appState === 'home') {
          setAppState('active_tracker');
        }
      })
      .catch(() => {});
  }, []);

  const wrapScreen = (content: React.ReactNode) => (
    <View style={[styles.rootWrapper, { backgroundColor: theme.colors.canvas }]}>
      <View style={styles.appConstraint}>
        {content}
      </View>
    </View>
  );

  // 1. Home / Landing Screen (First Visit & Logged Out)
  if (appState === 'home') {
    return wrapScreen(
      <HomeScreen
        onGetStarted={() => setAppState('survey')}
        onLogin={() => setAppState('auth')}
        onExploreGuest={() => setAppState('active_tracker')}
      />
    );
  }

  // 2. Authentication Screen (Sign In / Register)
  if (appState === 'auth') {
    return wrapScreen(
      <AuthScreen
        initialMode="login"
        onAuthSuccess={(_session) => setAppState('active_tracker')}
        onBackToHome={() => setAppState('home')}
        onExploreGuest={() => setAppState('active_tracker')}
      />
    );
  }

  // 3. Survey Flow (First Visit Onboarding)
  if (appState === 'survey') {
    return wrapScreen(
      <OnboardingSurveyScreen
        onComplete={(payload, bridged) => {
          setSurveyData({ payload, bridged });
          setAppState('plan_flow');
        }}
        onCancel={() => setAppState('home')}
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
            setAppState('home');
          }
        }}
      />
    );
  }

  // 5. Active Daily Tracker Dashboard
  if (appState === 'active_tracker' && activePlan) {
    const sessionUser = getAuthSession()?.user;
    return wrapScreen(
      <TrackerDashboardScreen
        userName={sessionUser?.name || 'Talha'}
        targets={{
          targetCalories: activePlan.targetResult.kcalTarget,
          targetProteinGrams: activePlan.macros.proteinGrams,
          targetFatGrams: activePlan.macros.fatGrams,
          targetCarbGrams: activePlan.macros.carbGrams,
          targetWaterMl: activePlan.macros.waterMl,
        }}
        onOpenHome={() => setAppState('home')}
        onLogout={() => {
          clearAuthSession();
          setAppState('home');
        }}
        onBackToPlan={() => setAppState('plan_flow')}
        onOpenWeightTracker={() => setAppState('weight_tracker')}
        onOpenMealPlan={() => setAppState('weekly_plan')}
        onOpenCoachChat={() => setAppState('coach_chat')}
        onOpenSurvey={() => setAppState('survey')}
      />
    );
  }

  // 4. AI Nutritionist Chat Screen
  if (appState === 'coach_chat') {
    const coachContext = {
      displayName: 'Talha',
      sex: (surveyData?.payload.basics.sex as any) || 'male',
      ageYears: surveyData?.payload.basics.ageYears || 28,
      weightKg: activePlan?.userContext.weightKg || 75,
      goal: (activePlan?.goalSelection.goal as any) || 'lose',
      targets: {
        kcalTarget: activePlan?.targetResult.kcalTarget || 2000,
        proteinGrams: activePlan?.macros.proteinGrams || 140,
        fatGrams: activePlan?.macros.fatGrams || 55,
        carbGrams: activePlan?.macros.carbGrams || 235,
        waterMl: activePlan?.macros.waterMl || 3000,
      },
      todaySummary: {
        caloriesConsumed: 1200,
        proteinConsumed: 85,
        fatConsumed: 40,
        carbConsumed: 135,
        remainingCalories: (activePlan?.targetResult.kcalTarget || 2000) - 1200,
        foodsLoggedToday: ['2 Roti (Whole Wheat)', '1 Katori Daal Chana'],
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

  // 5. Weekly Adaptive Check-In Screen
  if (appState === 'weekly_checkin') {
    const mockMetrics = {
      daysLogged: 7,
      meanDailyIntake: 1820,
      currentEWMAWeightKg: (activePlan?.userContext.weightKg || 80) - 0.4,
      weightDeltaKg: -0.4,
      adherenceRatePct: 86,
      oldTDEE: activePlan?.userContext.tdee || 2300,
      newTDEE: (activePlan?.userContext.tdee || 2300) + 45,
      tdeeDelta: 45,
      oldKcalTarget: activePlan?.targetResult.kcalTarget || 1800,
      newKcalTarget: (activePlan?.targetResult.kcalTarget || 1800) + 45,
      targetDelta: 45,
    };

    const mockNarrative = {
      headline: 'Metabolic Recalibration: +45 kcal/day',
      summaryText:
        'Over the past 7 days, you logged 6 out of 7 days with high consistency. Your smoothed EWMA weight dropped 0.4 kg, indicating your true energy expenditure is slightly higher than baseline. Your daily target has been nudged up by 45 kcal to protect lean mass while sustaining fat loss.',
      keyActionLever:
        'Continue measuring cooking oil in curries and add a 15-minute brisk walk after dinner.',
    };

    return wrapScreen(
      <WeeklyCheckInScreen
        displayName="Client"
        metrics={mockMetrics}
        narrative={mockNarrative}
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

  // 6. Welcome Dashboard
  return wrapScreen(
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nutrio</Text>
          <Text style={styles.subtitle}>
            AI Nutrition & Calorie Coach (Pakistan-First)
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>● Task 1.4: Plan Engine Ready</Text>
            </View>
          </View>
        </View>

        {activePlan ? (
          /* Active Target Card */
          <View style={styles.activePlanCard}>
            <View style={styles.cardTop}>
              <Text style={styles.cardHeader}>Active Plan</Text>
              <View style={styles.goalTag}>
                <Text style={styles.goalTagText}>
                  {activePlan.goalSelection.goal.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.targetKcal}>{activePlan.targetResult.kcalTarget}</Text>
            <Text style={styles.targetUnit}>target calories / day</Text>

            <View style={styles.macroPillsRow}>
              <View style={styles.macroPill}>
                <Text style={styles.pillLabel}>Protein</Text>
                <Text style={styles.pillVal}>{activePlan.macros.proteinGrams}g</Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.pillLabel}>Fats</Text>
                <Text style={styles.pillVal}>{activePlan.macros.fatGrams}g</Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.pillLabel}>Carbs</Text>
                <Text style={styles.pillVal}>{activePlan.macros.carbGrams}g</Text>
              </View>
            </View>

            {/* Pakistani Cultural Lever Card */}
            <View style={styles.chaiSummary}>
              <Text style={styles.chaiSummaryTitle}>☕ Sweetened Tea Impact</Text>
              <Text style={styles.chaiSummaryDesc}>
                {activePlan.userContext.chaiSugarKcalPerDay} kcal/day (~{activePlan.userContext.weeklyChaiSugarKcal.toLocaleString()} kcal/wk) accounted for in daily budget.
              </Text>
            </View>

            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={styles.openDashboardBtn}
                onPress={() => setAppState('active_tracker')}
                activeOpacity={0.8}
              >
                <Text style={styles.openDashboardBtnText}>
                  🏠 Open Tracker Dashboard →
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reconfigureBtn}
                onPress={() => setAppState('survey')}
                activeOpacity={0.7}
              >
                <Text style={styles.reconfigureBtnText}>Reconfigure Assessment</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Welcome Card */
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Personalized Nutrition & Coaching</Text>
            <Text style={styles.welcomeDesc}>
              Explore your clinical metabolic profile, Pakistani lifestyle levers (including sweetened chai), and personalized targets.
            </Text>

            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => {
                setActivePlan(DEFAULT_ACTIVE_PLAN);
                setAppState('active_tracker');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.startBtnText}>Launch Live Tracker Dashboard →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reconfigureBtn}
              onPress={() => setAppState('survey')}
              activeOpacity={0.7}
            >
              <Text style={styles.reconfigureBtnText}>Start New Assessment Survey</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Inviolable Rules */}
        <View style={styles.footer}>
          <Text style={styles.footerRule}>
            • Rule 1: All nutrient values come from database, never from an LLM.
          </Text>
          <Text style={styles.footerRule}>
            • Rule 2: Targets are computed in nutrition-core with unit tests.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider initialMode="dark">
      <NutrioAppContent />
    </ThemeProvider>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F8F6',
  },
  container: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 4,
  },
  badgeRow: {
    marginTop: 10,
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  badgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
    gap: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  welcomeDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
    marginTop: 4,
    marginBottom: 8,
  },
  startBtn: {
    backgroundColor: '#10B981',
    borderRadius: 9999,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  actionBtnRow: {
    gap: 10,
    marginTop: 6,
  },
  openDashboardBtn: {
    backgroundColor: '#10B981',
    borderRadius: 9999,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  openDashboardBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  activePlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeader: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalTag: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  goalTagText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  targetKcal: {
    color: '#059669',
    fontSize: 44,
    fontWeight: '900',
    marginTop: 8,
  },
  targetUnit: {
    color: '#64748B',
    fontSize: 13,
    marginTop: -4,
    marginBottom: 18,
  },
  macroPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  macroPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  pillVal: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  chaiSummary: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
    marginBottom: 16,
  },
  chaiSummaryTitle: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '700',
  },
  chaiSummaryDesc: {
    color: '#B45309',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  reconfigureBtn: {
    paddingVertical: 13,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  reconfigureBtnText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  footerRule: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
});
