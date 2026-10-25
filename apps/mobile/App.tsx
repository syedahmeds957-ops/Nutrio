import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import {
  LifestyleSurveyPayload,
  bridgeSurveyToNutritionCore,
  savePersistedSurvey,
  hydratePersistedSurvey,
  releaseSurveyCache,
  stripRetiredSurveyFields,
} from './src/survey/index.js';
import { OnboardingSurveyScreen } from './src/survey/ui/index.js';
import { ComputedUserPlan, PlanUserContext } from './src/plan/index.js';
import { PlanWorkflowScreen, WeeklyPlanView } from './src/plan/ui/index.js';
import { TrackerDashboardScreen } from './src/tracker/ui/index.js';
import {
  resolveTargetsDestination,
  resolveWeightTrackerDestination,
  resolveMealPlanDestination,
  resolveCoachDestination,
  resolveWeeklyCheckInDestination,
  resolvePlanFlowBack,
  resolveSurveyBack,
  shouldOpenSavedPlan,
  type AppRoute,
  type PlanDestination,
  type SurveyEntry,
} from './src/navigation/planFlowRouting.js';
import {
  finishPlan,
  goBackFrom,
  navigateTo,
  openFromDashboard,
  startAt,
  type NavState,
} from './src/navigation/history.js';
import { WeightTrackerScreen } from './src/weight/ui/index.js';
import { hydrateWeighIns, loadWeighIns, releaseWeightCache } from './src/weight/weightStorage.js';
import { buildWeighInSeed, collectIntakeLogs } from './src/weight/weightSeed.js';
import { CoachChatScreen, WeeklyCheckInScreen } from './src/coach/index.js';
import { buildCoachContext } from './src/coach/coachContext.js';
import { buildWeeklyCheckIn } from './src/coach/weeklyCheckIn.js';
import { pickRestoredPlan } from './src/plan/restoredPlan.js';
import { planUserContextFromSurvey } from './src/plan/userContext.js';
import { AuthScreen, getAuthSession, clearAuthSession, restoreSession, markSurveyCompleted } from './src/auth/index.js';
import {
  syncCompleteOnboarding,
  syncNutritionTargets,
  hydrateUserDataFromCloud,
  resolveCurrentProfileId,
} from './src/sync/userDataSync.js';
import {
  loadPersistedPlan,
  savePersistedPlan,
  hydratePersistedPlan,
  hydrateActivityStorage,
  hydrateHistoryStartDate,
  primeActivitiesFromRemote,
  releaseLocalUserCache,
} from './src/tracker/activityStorage.js';
import {
  hydrateMealPresets,
  hydrateFoodUsage,
  releasePresetCache,
} from './src/tracker/mealPresets.js';
import { hydrateCustomDishes, releaseCustomDishCache } from './src/tracker/customDishes.js';
import { hydrateWorkoutPlan, loadWorkoutPlan, releaseWorkoutCache } from './src/workout/workoutStorage.js';
import { hydrateWorkoutLogs, loadWorkoutLogs, releaseWorkoutLogCache } from './src/workout/workoutLogStorage.js';
import { setActiveDraft } from './src/workout/workoutDraft.js';
import { TimeoutError, withTimeout } from './src/common/withTimeout.js';
import { WorkoutsScreen } from './src/workout/ui/WorkoutsScreen.js';
import { samplePlan } from './src/workout/samplePlan.js';
import { applyCoachSwap, coachSwapTopic, coachWorkoutContext } from './src/workout/coachWorkout.js';
import { fetchActivityHistory } from './src/sync/activitySync.js';
import { applyWorkoutBackup, fetchWorkoutBackup } from './src/sync/workoutSync.js';
import { purgeLegacyAiKeys } from './src/ai/ai-service.js';
import { addDaysToKey, localDateKey } from './src/common/dateKey.js';

import { ThemeProvider, useTheme } from './src/theme.js';
import { RegionProvider, useRegion } from './src/common/region/index.js';
import {
  I18nProvider,
  useTranslation,
  useTextDirection,
  useI18nState,
  appFontAssets,
  installFontPatch,
  setActiveFontScript,
  setActiveTextDirection,
  directionForLanguage,
} from './src/i18n/index.js';
import { DailyTrackerSummary } from './src/tracker/types.js';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Routes every Text/TextInput through the app's typeface — Inter for Latin,
// IBM Plex Sans Arabic for Arabic — once the files have registered. Installed
// at module scope so it is in place before the first screen mounts; it stays
// dormant until setActiveFontScript names a script.
installFontPatch();

// Built once: useFonts reads the map on every render, and rebuilding it there
// would re-resolve every asset per frame for no gain.
const APP_FONTS = appFontAssets();

// Earlier builds let users paste OpenAI/Gemini keys, saved in plain text on the
// device. AI now runs only through edge functions, so those copies are erased.
purgeLegacyAiKeys();

/**
 * A catch handler that falls back without blocking the app but still logs why.
 * Restores and background saves must never strand the user on the splash, yet
 * a silent fallback is how sync and storage bugs went unnoticed.
 */
function recoverWith<T>(step: string, fallback: T) {
  return (err: unknown): T => {
    console.warn(`[NutrioApp] ${step} failed:`, err instanceof Error ? err.message : err);
    return fallback;
  };
}

/**
 * Boot time limits. Each network step falls back to on-device data when it
 * stalls, fonts fall back to the system face, and the backstop guarantees the
 * splash clears even if something unforeseen never settles.
 */
const CLOUD_TIMEOUT_MS = 8000;
const FONT_WAIT_MS = 3000;
const BOOT_MAX_MS = 15000;

// Keep the native splash (app logo) up until the session restore finishes.
SplashScreen.preventAutoHideAsync().catch(recoverWith('Holding the splash screen', undefined));
SplashScreen.setOptions({ duration: 300, fade: true });

function NutrioAppContent() {
  const { theme } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const { language } = useI18nState();
  const [fontsLoaded, fontError] = useFonts(APP_FONTS);
  /** Set once fonts have had their chance; the app then shows in the system face and switches when they arrive. */
  const [fontWaitOver, setFontWaitOver] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  // The current screen plus the screens behind it, so Back returns to where the
  // user came from (see navigation/history.ts).
  const [nav, setNav] = useState<NavState>(() =>
    // If user has an active session, boot directly to tracker; otherwise start directly at auth (Login)
    startAt(getAuthSession() ? 'active_tracker' : 'auth')
  );
  const appState = nav.route;
  /** The live route, for async boot work that finishes after the user has moved on. */
  const routeRef = useRef(appState);
  routeRef.current = appState;
  /** Starts over at `route` with nothing behind it: sign-in, sign-out, a finished flow. */
  const resetTo = (route: AppRoute) => setNav(startAt(route));
  const [isGuest, setIsGuest] = useState<boolean>(false);
  /** The day the dashboard's Start opened Workouts on; null opens the week. */
  const [workoutDayKey, setWorkoutDayKey] = useState<string | null>(null);
  /** The exercise "Ask coach about this" opened the coach on; null for a general chat. */
  const [coachTopic, setCoachTopic] = useState<{ slotId: string; weekIndex: number } | null>(null);
  /** Bumped when the coach applies a swap, so its picture of today's workout is rebuilt from storage. */
  const [, setWorkoutRevision] = useState(0);
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
  /**
   * Why we're in `plan_flow`, which the state name alone can't say.
   *
   * 'create' is the onboarding path: fresh survey answers, run analysis then
   * goal selection. 'review' is the dashboard's Targets button: the user already
   * accepted a plan and wants to see it, not build another one.
   *
   * They differ in both directions — where the wizard opens and where Back
   * returns to — so guessing from `surveyData`/`activePlan` got both wrong:
   * a user with saved targets was re-asked to pick a goal, and Back from the
   * dashboard dropped them on page one of the survey.
   */
  const [planFlowMode, setPlanFlowMode] = useState<'create' | 'review'>('create');
  /** Where the survey was opened from, so cancelling returns there. */
  const [surveyEntry, setSurveyEntry] = useState<SurveyEntry>('onboarding');

  const routingInput = {
    hasActivePlan: !!activePlan,
    hasSurveyData: !!surveyData,
  };

  /**
   * Opens a dashboard button's destination on top of the dashboard. The mode is
   * always written before the route, and always written when the destination
   * names one, so a later navigation can never inherit a stale 'review' from an
   * earlier one. `wanted` is the screen the button is for: when the destination
   * is a detour through goal setting, accepting the plan finishes there.
   */
  const applyDestination = (destination: PlanDestination, wanted: AppRoute = destination.route) => {
    if (destination.planFlowMode) {
      setPlanFlowMode(destination.planFlowMode);
    }
    if (destination.surveyEntry) {
      setSurveyEntry(destination.surveyEntry);
    }
    setNav((current) => openFromDashboard(current, destination.route, wanted));
  };

  // Pulls the signed-in user's activity history down and seeds local storage,
  // so a re-login or a new device shows the days they already logged.
  const restoreActivityHistory = async () => {
    const remote = await withTimeout(fetchActivityHistory(), CLOUD_TIMEOUT_MS, 'Fetching activity history').catch(
      recoverWith('Fetching activity history', [])
    );
    if (remote.length > 0) {
      primeActivitiesFromRemote(remote);
    }
    // Cover today and yesterday from durable native storage for offline days
    // the backend has not seen yet.
    const today = localDateKey();
    await hydrateActivityStorage([today, addDaysToKey(today, -1)]).catch(
      recoverWith('Restoring recent diary days', undefined)
    );
    await hydrateHistoryStartDate().catch(recoverWith('Restoring history start date', undefined));
    // Saved meals and most-logged counts are read synchronously during render,
    // so they have to be in memory before the hub first opens.
    await Promise.all([
      hydrateMealPresets().catch(recoverWith('Restoring saved meals', undefined)),
      hydrateFoodUsage().catch(recoverWith('Restoring food usage', undefined)),
      hydrateCustomDishes().catch(recoverWith('Restoring your dishes', undefined)),
      hydrateWeighIns().catch(recoverWith('Restoring weigh-ins', undefined)),
      hydrateWorkoutPlan().catch(recoverWith('Restoring workout plan', undefined)),
      hydrateWorkoutLogs().catch(recoverWith('Restoring workout logs', undefined)),
    ]);
  };

  // A cloud restore that missed the boot time limit. It only fills gaps: the
  // device copy (or anything the user has done since) is never overwritten.
  const applyLateCloudData = (hydration: Awaited<ReturnType<typeof hydrateUserDataFromCloud>>) => {
    if (hydration?.surveyPayload) {
      const survey = stripRetiredSurveyFields(hydration.surveyPayload);
      setSurveyData((current) => {
        if (current) return current;
        savePersistedSurvey(survey);
        return { payload: survey, bridged: bridgeSurveyToNutritionCore(survey) };
      });
    }
    const latePlan = hydration?.computedPlan;
    if (latePlan) {
      setActivePlan((current) => {
        if (current) return current;
        savePersistedPlan(latePlan);
        return latePlan;
      });
    }
  };

  // Brings a signed-in user's plan and survey answers back, from the cloud when
  // the backend is reachable and from durable on-device storage otherwise, and
  // reports whether onboarding still needs to run.
  const restoreUserData = async (): Promise<{ plan: ComputedUserPlan | null }> => {
    const cloud = hydrateUserDataFromCloud();
    // Fetched alongside the rest, merged once the device copy is loaded below.
    // Its time limit runs from now, so a stalled network doesn't add a third wait.
    const workoutBackup = fetchWorkoutBackup();
    const workoutDeadline = Date.now() + CLOUD_TIMEOUT_MS;
    const hydration = await withTimeout(cloud, CLOUD_TIMEOUT_MS, 'Restoring cloud data').catch((err: unknown) => {
      // Too slow to hold the splash for, but still the user's data: fill in
      // whatever the device didn't have once it lands.
      if (err instanceof TimeoutError) {
        cloud.then(applyLateCloudData).catch(recoverWith('Restoring cloud data late', undefined));
      }
      return recoverWith('Restoring cloud data', null)(err);
    });
    await restoreActivityHistory();
    // A backup that misses the time limit still merges when it lands; the
    // newer copy wins, so nothing done meanwhile is lost.
    await withTimeout(
      workoutBackup.then((backup) => applyWorkoutBackup(backup)),
      Math.max(0, workoutDeadline - Date.now()),
      'Restoring workouts'
    ).catch(recoverWith('Restoring workouts', undefined));

    const storedSurvey =
      hydration?.surveyPayload || (await hydratePersistedSurvey().catch(recoverWith('Restoring saved survey', null)));
    const restoredSurvey = storedSurvey ? stripRetiredSurveyFields(storedSurvey) : null;
    if (restoredSurvey) {
      setSurveyData({
        payload: restoredSurvey,
        bridged: bridgeSurveyToNutritionCore(restoredSurvey),
      });
      savePersistedSurvey(restoredSurvey);
    }

    const localPlan =
      (await hydratePersistedPlan().catch(recoverWith('Restoring saved plan', null))) ||
      loadPersistedPlan();
    const restoredPlan = pickRestoredPlan(hydration?.computedPlan, localPlan);
    if (restoredPlan) {
      setActivePlan(restoredPlan);
      savePersistedPlan(restoredPlan);
    }
    // A plan rebuilt from an older targets row is saved back whole, so the next
    // sign-in anywhere restores it directly.
    if (restoredPlan && hydration?.planRebuilt && restoredPlan === hydration.computedPlan && hydration.profileId) {
      syncNutritionTargets(hydration.profileId, restoredPlan).catch(
        recoverWith('Saving the rebuilt plan', false)
      );
    }

    return { plan: restoredPlan ?? null };
  };

  // Restore Supabase session on boot & hydrate personalized cloud data
  useEffect(() => {
    let isMounted = true;
    const backstop = setTimeout(() => {
      if (!isMounted) return;
      console.warn(`[NutrioApp] Boot still restoring after ${BOOT_MAX_MS} ms; showing the app anyway`);
      setIsBootstrapping(false);
    }, BOOT_MAX_MS);
    restoreSession()
      .then(async (session) => {
        if (session) {
          const { plan } = await restoreUserData();
          // Read live: after the backstop the user may already have signed in or gone on as a guest.
          if (isMounted && routeRef.current === 'auth') {
            if (session.user.surveyCompleted || plan) {
              resetTo('active_tracker');
            } else {
              setSurveyEntry('onboarding');
              resetTo('survey');
            }
          }
        }
      })
      .catch(recoverWith('Restoring the session', undefined))
      .finally(() => {
        clearTimeout(backstop);
        if (isMounted) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(backstop);
    };
  }, []);

  // Fonts that fail or stall must not hold the splash: the system face is
  // used until (unless) they register.
  useEffect(() => {
    const timer = setTimeout(() => setFontWaitOver(true), FONT_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fontError) recoverWith('Loading fonts', undefined)(fontError);
  }, [fontError]);

  // Text only switches off the platform font once the files are registered —
  // naming a font the platform has not loaded renders nothing at all.
  useEffect(() => {
    if (!fontsLoaded) {
      setActiveFontScript(null);
      return;
    }
    setActiveFontScript(language === 'ar' ? 'arabic' : 'latin');
  }, [language, fontsLoaded]);

  // Direction needs no assets, so it is set straight away: it decides which
  // edge every string reads from, and almost no screen states it per Text.
  useEffect(() => {
    setActiveTextDirection(directionForLanguage(language));
  }, [language]);

  // The splash holds until the typefaces are ready, so no screen paints in
  // the system fallback face and then reflows into Inter, but only for a
  // few seconds, and not at all once loading has failed.
  const isWaitingForFonts = !fontsLoaded && !fontError && !fontWaitOver;

  useEffect(() => {
    if (!isBootstrapping && !isWaitingForFonts) {
      SplashScreen.hide();
    }
  }, [isBootstrapping, isWaitingForFonts]);

  /**
   * Where Back goes when nothing is behind the current screen — only the
   * survey reached straight after sign-in, in practice. Everything else
   * returns to the screen it was opened from.
   */
  const backFallback = (): AppRoute => {
    switch (appState) {
      case 'survey':
        return resolveSurveyBack(surveyEntry);
      case 'plan_flow':
        return resolvePlanFlowBack({ planFlowMode, hasSurveyData: !!surveyData });
      case 'auth':
        return 'auth';
      default:
        return 'active_tracker';
    }
  };

  /** New targets the user accepted (a check-in, or a workout plan's training): kept on the device and backed up. */
  const acceptPlan = (accepted: ComputedUserPlan) => {
    setActivePlan(accepted);
    savePersistedPlan(accepted);
    resolveCurrentProfileId()
      .then((profileId) => (profileId ? syncNutritionTargets(profileId, accepted) : false))
      .catch((err) => {
        console.warn('[NutrioApp] Syncing accepted targets failed:', err);
      });
  };

  // Every screen's back button and the edge swipe use this, so they agree.
  const goBack = () => setNav((current) => goBackFrom(current, backFallback()));
  const canSwipeBack = [
    'survey',
    'plan_flow',
    'coach_chat',
    'weekly_checkin',
    'weight_tracker',
    'weekly_plan',
    'workouts',
  ].includes(appState);

  // Only the leading edge of the app starts the gesture (matches iOS/Android
  // edge-back conventions) so it never fights horizontal ScrollViews/carousels
  // elsewhere on the screen. Direction flips for RTL: swipe left-to-right is
  // "back" in LTR, right-to-left is "back" in RTL.
  const EDGE_WIDTH = 32;
  // The app is a centred column (styles.appConstraint) on a wide browser
  // window, so the edge is measured from the column. Measuring it from the
  // window put it outside the app, and the swipe never started on desktop web.
  const columnWidth = Math.min(windowWidth, APP_MAX_WIDTH);
  const columnLeft = (windowWidth - columnWidth) / 2;
  const isAtLeadingEdge = (pageX: number) => {
    const x = pageX - columnLeft;
    return dir.isRTL ? x > columnWidth - EDGE_WIDTH && x <= columnWidth : x >= 0 && x < EDGE_WIDTH;
  };
  const isBackSwipe = (pageX: number, dx: number, dy: number) => {
    if (!canSwipeBack || !isAtLeadingEdge(pageX - dx)) return false;
    const movingBack = dir.isRTL ? dx < -8 : dx > 8;
    return movingBack && Math.abs(dx) > Math.abs(dy) * 1.5;
  };
  const swipeTranslateX = useRef(new Animated.Value(0)).current;
  const swipePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => canSwipeBack && isAtLeadingEdge(evt.nativeEvent.pageX),
    onMoveShouldSetPanResponder: (evt, g) => isBackSwipe(evt.nativeEvent.pageX, g.dx, g.dy),
    // Taken in the capture phase too, so a button or card under the finger at
    // the edge cannot keep the gesture once it is clearly a horizontal swipe.
    onMoveShouldSetPanResponderCapture: (evt, g) => isBackSwipe(evt.nativeEvent.pageX, g.dx, g.dy),
    onPanResponderMove: (_evt, gestureState) => {
      const clamped = dir.isRTL ? Math.min(0, gestureState.dx) : Math.max(0, gestureState.dx);
      swipeTranslateX.setValue(clamped);
    },
    onPanResponderRelease: (_evt, gestureState) => {
      const committed =
        Math.abs(gestureState.dx) > columnWidth * 0.28 || Math.abs(gestureState.vx) > 0.5;
      if (committed) {
        Animated.timing(swipeTranslateX, {
          toValue: dir.isRTL ? -columnWidth : columnWidth,
          duration: 180,
          useNativeDriver: true,
        }).start(() => {
          swipeTranslateX.setValue(0);
          goBack();
        });
      } else {
        Animated.spring(swipeTranslateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(swipeTranslateX, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    },
  });

  // Native mirroring only applies after a restart, and react-native-web reads
  // the CSS direction rather than I18nManager, so the root states it either way.
  const wrapScreen = (content: React.ReactNode) => (
    <View
      style={[styles.rootWrapper, { backgroundColor: theme.colors.canvas, direction: dir.direction }]}
    >
      <Animated.View
        style={[styles.appConstraint, { transform: [{ translateX: swipeTranslateX }] }]}
        {...swipePanResponder.panHandlers}
      >
        {content}
      </Animated.View>
    </View>
  );

  // Sign-in, shared by the auth route and the fallback for unrenderable routes.
  const renderAuth = () =>
    wrapScreen(
      <AuthScreen
        initialMode="login"
        onAuthSuccess={async (session) => {
          setIsGuest(false);
          const { plan } = await restoreUserData();
          if (plan || session.user.surveyCompleted) {
            // Returning user: their targets and answers are already on record,
            // so onboarding must not run again.
            resetTo('active_tracker');
          } else {
            // New user without a plan: the survey computes real targets (or
            // they can tap Skip for Now to track without targets).
            setSurveyEntry('onboarding');
            resetTo('survey');
          }
        }}
        onExploreGuest={() => {
          // Guests explore: Workouts shows them a sample plan, so no stored workouts are loaded.
          setIsGuest(true);
          resetTo('active_tracker');
        }}
      />
    );

  // Startup Splash Screen during session restore & telemetry synchronization
  if (isBootstrapping || isWaitingForFonts) {
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
    return renderAuth();
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
          markSurveyCompleted().catch(recoverWith('Recording survey completion', undefined));
          setPlanFlowMode('create');
          // On top of the survey, so Back from goal setting returns to it.
          setNav((current) => navigateTo(current, 'plan_flow'));
        }}
        onSkip={() => {
          // Skipping survey marks as completed/bypassed and routes directly to user dashboard
          markSurveyCompleted().catch(recoverWith('Recording survey completion', undefined));
          resetTo('active_tracker');
        }}
        onCancel={goBack}
      />
    );
  }

  // 4. Plan Workflow (Analysis -> Goal Selection -> Plan Reveal)
  if (appState === 'plan_flow' && (surveyData || activePlan)) {
    const userContext: PlanUserContext = surveyData
      ? planUserContextFromSurvey(surveyData.payload, surveyData.bridged)
      : activePlan!.userContext;

    return wrapScreen(
      <PlanWorkflowScreen
        userContext={userContext}
        // Only the create path runs the wizard. Reviewing opens straight on the
        // accepted plan — re-deriving it from the survey would ask the user to
        // choose a goal they already chose.
        existingPlan={shouldOpenSavedPlan(planFlowMode) ? activePlan : undefined}
        onPlanAccepted={(computedPlan) => {
          setActivePlan(computedPlan);
          savePersistedPlan(computedPlan);
          markSurveyCompleted().catch(recoverWith('Recording survey completion', undefined));
          if (surveyData) {
            syncCompleteOnboarding(surveyData.payload, computedPlan).catch((err) => {
              console.warn('[NutrioApp] Background onboarding sync error:', err);
            });
          }
          // To the screen the user was heading for (Coach, say), else the dashboard.
          setNav(finishPlan);
        }}
        onCancel={goBack}
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
        onRequireAuth={() => resetTo('auth')}
        onSummaryChange={setTrackerSummary}
        onOpenHome={() => resetTo('auth')}
        onLogout={() => {
          // Drop the in-memory copies so the next account starts clean. The
          // durable records stay: they are keyed by user id, and wiping them
          // here is what made a returning user redo the whole survey.
          releaseLocalUserCache();
          releasePresetCache();
          releaseCustomDishCache();
          releaseWeightCache();
          releaseWorkoutCache();
          releaseWorkoutLogCache();
          setActiveDraft(null);
          releaseSurveyCache();
          clearAuthSession().catch(recoverWith('Signing out', undefined));
          setIsGuest(false);
          setActivePlan(null);
          setSurveyData(null);
          setTrackerSummary(null);
          resetTo('auth');
        }}
        onBackToPlan={() => applyDestination(resolveTargetsDestination(routingInput), 'plan_flow')}
        onOpenWeightTracker={() =>
          applyDestination(resolveWeightTrackerDestination(routingInput), 'weight_tracker')
        }
        onOpenMealPlan={() =>
          applyDestination(
            resolveMealPlanDestination({
              ...routingInput,
              hasDietPreference: !!surveyData?.payload.preferencesBudget?.dietPreference,
            }),
            'weekly_plan'
          )
        }
        onOpenCoachChat={() => {
          setCoachTopic(null);
          applyDestination(resolveCoachDestination(routingInput), 'coach_chat');
        }}
        onOpenWorkouts={() => {
          setWorkoutDayKey(null);
          applyDestination({ route: 'workouts' });
        }}
        onOpenWorkoutDay={(dateKey: string) => {
          setWorkoutDayKey(dateKey);
          applyDestination({ route: 'workouts' });
        }}
        workoutPlan={isGuest ? samplePlan(localDateKey()) : loadWorkoutPlan()}
        workoutLogs={isGuest ? [] : loadWorkoutLogs()}
        onOpenWeeklyCheckIn={() =>
          applyDestination(resolveWeeklyCheckInDestination(routingInput), 'weekly_checkin')
        }
        // Still reachable from the profile sheet, just not from the nav row.
        onOpenSurvey={() => applyDestination({ route: 'survey', surveyEntry: 'dashboard' })}
      />
    );
  }

  // AI Nutritionist Chat. Reached only with an accepted plan (see
  // resolveCoachDestination), which is the source of the coach's profile.
  if (appState === 'coach_chat' && activePlan) {
    // Stored data only: guests never reach the coach, so there is no sample plan here.
    const workoutPlan = loadWorkoutPlan();
    return wrapScreen(
      <CoachChatScreen
        context={buildCoachContext({
          plan: activePlan,
          survey: surveyData?.payload,
          summary: trackerSummary,
          displayName: getAuthSession()?.user?.name || t('app.coachFallbackName'),
          region: activeRegion,
          workout: workoutPlan
            ? coachWorkoutContext({ plan: workoutPlan, logs: loadWorkoutLogs(), todayKey: localDateKey(), region: activeRegion, language, t })
            : undefined,
        })}
        swapTopic={coachTopic && workoutPlan ? coachSwapTopic(workoutPlan, coachTopic.slotId, coachTopic.weekIndex, language) : null}
        onApplySwap={(topic, toId) => {
          const result = applyCoachSwap(topic, toId, language, t);
          if (result.applied) setWorkoutRevision((n) => n + 1);
          return result;
        }}
        onBack={goBack}
      />
    );
  }

  // Weekly adaptive check-in, computed from the stored diary and weigh-ins.
  if (appState === 'weekly_checkin' && activePlan) {
    const checkIn = buildWeeklyCheckIn({
      plan: activePlan,
      weighIns: loadWeighIns(),
      intakeLogs: collectIntakeLogs(activeRegion),
    });

    return wrapScreen(
      <WeeklyCheckInScreen
        displayName={getAuthSession()?.user?.name || t('app.checkinFallbackName')}
        metrics={checkIn.metrics}
        narrative={{
          headline: t(`app.checkin.${checkIn.status}.headline`),
          summaryText: t(`app.checkin.${checkIn.status}.summary`),
          keyActionLever: t(`app.checkin.${checkIn.status}.keyAction`),
        }}
        onAcceptNewTargets={() => {
          acceptPlan(checkIn.proposedPlan);
          goBack();
        }}
        onBack={goBack}
      />
    );
  }

  // 6. Weight Trend & Closed-Loop Adaptive TDEE Screen
  if (appState === 'weight_tracker' && activePlan) {
    return wrapScreen(
      <WeightTrackerScreen
        initialState={{
          // Read back from storage. This used to fabricate a single weigh-in
          // dated today on every mount, which is why logging a weight three
          // times still showed one row and 0 kg of change.
          weighIns: buildWeighInSeed(activePlan.userContext.weightKg),
          // The adaptive TDEE calibrates against what was actually eaten, so
          // the days already in the diary are handed over rather than left
          // empty — "0 / 28 days logged" was counting an array we never filled.
          intakeLogs: collectIntakeLogs(activeRegion),
          formulaTDEE: activePlan.userContext.tdee,
          bmr: activePlan.userContext.bmr,
        }}
        onBackToTracker={goBack}
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
          dislikedFoods:
            surveyData?.payload.preferencesBudget?.dislikedFoods || [],
          medicalConditions:
            surveyData?.payload.healthClinical.medicalConditions || [],
        }}
        onBackToDashboard={goBack}
      />
    );
  }

  // Workouts need no plan or survey: setup asks for anything they would have given.
  if (appState === 'workouts') {
    return wrapScreen(
      <WorkoutsScreen
        survey={surveyData?.payload ?? null}
        activePlan={activePlan}
        initialDayKey={workoutDayKey}
        onBack={goBack}
        isGuest={isGuest}
        onRequireAuth={() => resetTo('auth')}
        onAcceptPlan={acceptPlan}
        onAskCoach={({ slotId, weekIndex, dateKey }) => {
          setCoachTopic({ slotId, weekIndex });
          // Back from the coach returns to this day.
          setWorkoutDayKey(dateKey);
          applyDestination(resolveCoachDestination(routingInput), 'coach_chat');
        }}
      />
    );
  }

  // A route whose data is missing (say, the weight tracker with no plan) lands
  // on sign-in, the same screen and behaviour as the auth route itself.
  return renderAuth();
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

/** Width of the centred app column on wide screens; the back swipe measures its edge from it. */
const APP_MAX_WIDTH = 500;

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  appConstraint: {
    flex: 1,
    width: '100%',
    maxWidth: APP_MAX_WIDTH,
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

