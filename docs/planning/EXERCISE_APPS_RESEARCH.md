# Exercise plan: market research

> **Built (2026-10-25).** Workout plans shipped as a 12-phase plan, using most of §6. See [`docs/design/plans/workout-plans/`](../design/plans/workout-plans/README.md) (decisions and an execution record per phase) and [`packages/workout-core`](../../packages/workout-core). In short:
> - **Engine:** a deterministic fixed split with double progression and a reason code per change, and Ramadan mode.
> - **App:** the set logger, a calorie target offer, the coach suggesting safe swaps (applied only on the user's tap), and workouts in the weekly check-in.
> - **Data:** exercises are from free-exercise-db (public domain, images bundled). The `hasaneyldrm/exercises-dataset` media wasn't used.
> - **Done differently:** a missed day can be done later with "Do it today" instead of an automatic recovery-aware swap. There's no scheduled deload; two failed sessions cut the load by 10% instead.

Research for adding workout plans to Nutrio. Covers how the top-rated workout apps build plans, what their users praise and complain about, where Nutrio can do better, and which exercise data we can legally ship at $0.

Researched 2026-10-22. A caution on sources: most "best workout app 2026" rankings are published by one of the apps being ranked (Alpha Progression, Jefit, SensAI, Planfit, Load Muscle each rank themselves first). Review figures from aggregators (Kimola, JustUseApp) are machine summaries. Treat every number below as indicative, not measured.

---

## 1. The apps that matter

| App | Type | How the plan is made | Price | Known for |
|---|---|---|---|---|
| **Fitbod** | AI gym planner | Generates each session on the fly from per-muscle recovery + logged performance | ~$15.99/mo or ~$96/yr, no free tier | Most-cited "best AI planner"; 4.8 App Store, 4.6 Play |
| **Alpha Progression** | Plan generator + tracker | Questionnaire → full split (days, exercises, sets, reps), then per-set targets | Free tracker; Pro $12.99/mo, $79.99/yr | Precise per-set progression using real gym weight increments |
| **MacroFactor Workouts** | Plan generator + tracker | Generator, or build your own; "Smart Progression" is highly configurable | $11.99/mo, $71.99/yr, no free tier | Same company as MacroFactor nutrition; dense, data-heavy |
| **JEFIT** | Tracker + plan library | 1,400+ exercises, per-muscle recovery; generated plan in paid Elite tier | Freemium | Analytics, big library |
| **Hevy** | Tracker (no generator) | User builds routines or copies community ones | Free; Pro $23.99/yr or $74.99 lifetime | Best value, social feed, most generous free tier |
| **Strong** | Tracker (no generator) | User builds routines; suited to 5×5 style barbell programs | Free; $99.99 lifetime | Minimalist, fast logging, Apple Watch |
| **Freeletics** | AI bodyweight coach | Adapts each workout from post-workout feedback; user can say "travelling, no equipment" | ~$1.83–3.85/wk, $235 lifetime | Bodyweight/HIIT, no gym needed |
| **Planfit** | AI gym planner | Plan from goal, equipment, history; adapts from logs; ChatGPT coach "Max" | Free first plan; paid tiers | Free tier, chat coach |
| **Nike Training Club** | Video classes | Follow-along programs, beginner tracks | Free | Best free home-workout app |
| **Apple Fitness+ / Peloton** | Video classes | Instructor-led classes and programs | ~$10–13/mo | Fitness+ is best for true beginners; Peloton too hard for many beginners |
| **BetterMe / Sweat** | Home workouts, women-focused | Quiz → program; mostly bodyweight/Pilates | Subscription | Sweat built for women; BetterMe has many billing complaints |

The market splits into three kinds of app:

1. **Generators** (Fitbod, Alpha Progression, MacroFactor, Planfit, Freeletics) ask questions and write the plan for you.
2. **Trackers** (Hevy, Strong, JEFIT free) give you a fast log and leave planning to you.
3. **Class libraries** (NTC, Fitness+, Peloton, Sweat) give you videos to follow.

Nutrio's users are mostly beginners who came for diet. They need a generator that feels like a class (simple, guided, at home) with a tracker's fast logging.

---

## 2. How plan generation works

### Inputs every serious generator asks for

From Alpha Progression's and MacroFactor's published generator inputs, plus Fitbod and Freeletics:

- **Goal**: build muscle, lose fat, get stronger, general fitness
- **Experience**: beginner, intermediate, advanced
- **Days per week** and **session length** (minutes)
- **Equipment / location**: full gym, home with dumbbells, bodyweight only. MacroFactor and Alpha Progression allow several saved "gym profiles"
- **Available weights**: so targets land on real plate or dumbbell increments
- **Muscle priorities**: e.g. "bring up arms"
- **Limitations**: injuries, things to avoid

### Two engine designs

**A. Fixed plan (Alpha Progression, MacroFactor, JEFIT, Sweat).** The questionnaire picks a split (full body 2–3 days, upper/lower 4 days, push/pull/legs 3–6 days), fills each day with exercises, then sets and rep ranges. The user sees the whole week in advance and can edit it. Progression happens inside the plan from week to week.

**B. Session-by-session (Fitbod, Freeletics).** There is no fixed week. Each time you open the app:
1. Every muscle has a **recovery score (0–100%)** based on how much and how recently it was trained. Fitbod cites a 48–72 h recovery window (Schoenfeld 2010).
2. Exercises that hit the most-recovered muscles score highest; equipment and history filter the list.
3. Sets, reps and weight come from your last logged performance. Easy sets lead to more weight or reps; failed sets lead to holding or dropping.
4. Fatigue signals (high recent volume, low recovery) switch the day to lighter or accessory work.
5. Reps-in-reserve (RIR) ratings and occasional "max effort" days calibrate strength estimates.

Option A is predictable and easy to trust. Option B adapts to missed days but can feel random (see complaints). The best-reviewed generators combine them: **a fixed weekly structure, with progression and swaps that adapt from logs.**

### Progression (the "AI" most users actually notice)

- **Double progression**: work in a rep range (e.g. 8–12). When all sets hit the top, raise the weight and go back to the bottom.
- **Per-set targets** using real increments (Alpha Progression). For example, it won't tell you to lift 23.7 kg.
- **RIR / effort feedback** after each set or workout (Fitbod, Freeletics).
- **Deload** after several weeks or when performance stalls.

All of this is deterministic arithmetic. The "AI" label is mostly marketing for rules plus logged data. That suits our hard rules: like nutrition targets, workout prescriptions can be computed and unit-tested, with an LLM only explaining them.

---

## 3. What users say

### What they praise

- **Not having to think**: open the app and the session is ready (Fitbod, Freeletics)
- **Automatic progressive overload**: weights go up on their own (Fitbod, Alpha Progression, PUSH)
- **Clear exercise demos**: videos and animations with cues (BetterMe's videos are rated well)
- **Fast logging**: Strong and Hevy win on this alone
- **Generous free tier**: Hevy, NTC, Planfit's free first plan
- **Adapts to real life**: "travelling, no equipment today" (Freeletics), multiple gym profiles
- **Community / accountability**: Hevy's feed

### What they complain about (ranked by how often it appears)

1. **Billing and cancellation** is the biggest complaint everywhere. About 15% of analysed Fitbod reviews mention charges after cancelling. BetterMe is called a "scam" over the same problem. Planfit users dislike being dropped straight into a premium trial. Freeletics has the same complaint.
2. **Plans feel random or repetitive**: "the algorithm is broken", the same exercises keep coming back (about 10% of Fitbod reviews), and Sweat programs feel repetitive.
3. **Unsafe or wrong weights**: suggested weights "dangerously heavy"; wrong order, reps or weights.
4. **No results**: "after 3 months, muscle was down and fat percent was up". This is often a nutrition problem, which is exactly the gap Nutrio fills.
5. **Too hard for beginners**: Peloton's classes. Too easy or low on variety: BetterMe.
6. **Bad AI advice**: a TechRadar writer followed PUSH's AI suggestion to cut training days, "and the results were a disaster".
7. **Thin equipment options**: users want better home-equipment choices and heart-rate support.
8. **Scheduling bugs**: can't access the planned day's workout after changing training days (Freeletics).
9. **Unclear tutorials, ads, crashes, silent support.**

---

## 4. Where Nutrio can win

What no top app does well for our market:

1. **Diet and training in one plan.** Only MacroFactor sells both, as two separate paid apps. In Nutrio, a workout day can change that day's calorie and protein target (computed in `nutrition-core`, Hard Rule 2), and the weekly check-in can read both. This directly answers complaint 4.
2. **Ramadan mode.** We found no app that schedules training around suhoor and iftar. Published guidance says: 30–45 min at light to moderate intensity, ideally about 45 min before iftar or after taraweeh; strength work with 1–2 min rest instead of HIIT; finish at least 1 h before bed. This is a clear first for Pakistan and Saudi Arabia.
3. **Home and bodyweight first.** Most of our users won't have a commercial gym. Make "home, no equipment" and "home, dumbbells" first-class, not afterthoughts.
4. **Women-friendly options**: home or women-only gym settings, and a program style closer to Sweat, without BetterMe's billing behaviour.
5. **Arabic + RTL.** None of the generators above is Arabic-first.
6. **Honest free tier.** No surprise trials, and cancellation that is obvious. This alone beats the most common complaint in the category. It also fits our $0, no-paywall direction.
7. **Predictable plans with explained changes.** A fixed weekly split (no "random" feeling), and every swap or weight change comes with a one-line reason ("Bench +2.5 kg: you hit 12 reps on all 3 sets").
8. **Conservative, safe progression.** Small increments, caps on weekly jumps, a beginner-safe exercise pool, and injury flags that remove exercises. This answers complaint 3.

---

## 5. Exercise data: what we can legally ship

### `hasaneyldrm/exercises-dataset` (the repo you found)

- 1,324 exercises with animated GIFs, 180×180 thumbnails, body part, target muscle, secondary muscles, equipment, and step-by-step instructions in 10 languages.
- **The data and instruction text are MIT.** We can use names, muscles, equipment and English instructions freely.
- **The GIFs and images are NOT MIT.** They are © Gym visual (gymvisual.com). The license file says plainly: *"Cloning this repository does not grant you any license to the media; obtain your own from Gym visual."* The author has written permission for their own app (LogPress). We don't.
- **Languages:** English, Spanish, Italian, Turkish, Russian, Chinese, Hindi, Polish, Korean, French. **No Arabic and no Urdu**, so we'd translate the instructions ourselves.

**Verdict:** use the MIT data. Do **not** ship the GIFs unless we buy a license from Gym visual, which breaks the $0 budget. A May 2026 Reddit thread reports a developer getting a legal notice after buying Gym visual GIFs from a reseller, so this risk is real. ExerciseDB sells a similar GIF set with commercial rights for a one-time $300, if a budget ever appears.

### Free alternatives

| Source | Size | License | Media |
|---|---|---|---|
| **`yuhonas/free-exercise-db`** | 800+ exercises | **Unlicense (public domain)**, data and images | 2 still JPGs per exercise (start and end position) |
| **wger** | Large, community-run | Code AGPL-3.0; exercise data CC-BY-SA 3.0 (share-alike); images vary per folder | Mixed photos |
| **`hasaneyldrm/exercises-dataset`** | 1,324 | Data MIT; media © Gym visual | GIFs not usable for free |

**Recommendation:** take **free-exercise-db** as the base catalogue (public domain, so no attribution or share-alike burden, and the images are safe to ship). Its two-frame start/end images can be shown as a simple two-frame loop, which gives most of the "animated" feel. Use the MIT `exercises-dataset` records to fill in muscles, equipment and instructions where useful. Keep wger out of our own tables for the same reason we keep Open Food Facts in its own schema: CC-BY-SA is share-alike.

Like `food-db`, this would be a new pure package (e.g. `packages/exercise-db`) with curated data, a search index and tests. The plan generator itself would go in `nutrition-core` or a sibling pure package, deterministic and unit-tested.

---

## 6. Suggested direction for the implementation plan

- **Onboarding**: reuse the existing survey's exercise step (`StepExercise.tsx` already asks training type and intensity). Add days per week, session length, location/equipment, experience, injuries and an optional Ramadan toggle.
- **Engine**: fixed weekly split chosen by days per week and equipment, filled from the exercise catalogue with a beginner-safe pool. Use double progression with real increments, a recovery-aware swap when a day is missed, and a deload every 4–6 weeks. All deterministic, all tested.
- **Logging**: a Strong/Hevy-speed set logger with a rest timer and an "easy / right / hard" rating after each workout.
- **Nutrition link**: training days feed `nutrition-core` (calorie and protein adjustment, adaptive TDEE input) and the weekly check-in.
- **Coach**: the existing coach can explain the plan and answer questions, but never writes sets, reps or weights (same rule as calories).
- **Ramadan mode**: shorter sessions, lower intensity and session timing tied to suhoor and iftar.

Questions to settle before planning: gym vs home priority for v1, whether to show the whole week or just today, how much the coach may swap, and whether exercise images ship in the app bundle or load from storage.

---

## Sources

Rankings and comparisons
- [The 7 Best Workout Planner Apps in 2026 (Alpha Progression)](https://alphaprogression.com/en/blog/best-workout-planner-apps)
- [Which Workout App Has the Best Plan Generator in 2026? (Alpha Progression)](https://alphaprogression.com/en/blog/best-workout-plan-generator)
- [Alpha Progression vs MacroFactor Workouts (Alpha Progression)](https://alphaprogression.com/en/blog/alpha-progression-vs-macrofactor-workouts)
- [Best AI-Powered Fitness Apps in 2026 (SensAI)](https://www.sensai.fit/blog/best-ai-workout-app)
- [Hevy vs Strong vs Fitbod vs Jefit (SensAI)](https://www.sensai.fit/blog/hevy-vs-strong-vs-fitbod-vs-jefit)
- [Fitbod vs Strong vs Jefit vs Hevy (Jefit)](https://www.jefit.com/blog/fitbod-vs-strong-vs-jefit-vs-hevy)
- [8 Best AI Workout Apps in 2026 (Load Muscle)](https://loadmuscle.com/blog/best-ai-workout-apps-2026)
- [Boostcamp: best workout apps](https://www.boostcamp.app/best/workout-apps)
- [Peloton's free app bites the dust (Tom's Guide)](https://www.tomsguide.com/wellness/fitness/pelotons-free-app-bites-the-dust-heres-3-workout-apps-to-use-instead)
- [Fitness review roundup (MacStories)](https://www.macstories.net/roundups/fitness-review-roundup/)
- [Best running apps (Healthline)](https://www.healthline.com/health/fitness/best-running-apps)

How Fitbod generates workouts
- [How Fitbod Creates Your Workout (help center)](https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout)
- [Fitbod algorithm (blog)](https://fitbod.me/blog/fitbod-algorithm)
- [How Fitbod's AI knows when to lift heavier and when to recover](https://fitbod.me/blog/how-fitbods-ai-knows-exactly-when-you-should-lift-heavier-and-when-to-recover/)

Reviews and complaints
- [Fitbod on Trustpilot](https://www.trustpilot.com/review/fitbod.me)
- [Fitbod feedback analysis (Kimola)](https://kimola.com/reports/comprehensive-fitbod-feedback-analysis-report-available-now-app-store-us-141682)
- [Fitbod review (Dr. Muscle, 2024)](https://dr-muscle.com/fitbod-app-review-alternative/)
- [Fitbod review 2026 (Indie Hackers)](https://www.indiehackers.com/post/fitbod-app-review-2026-honest-take-after-real-testing-45d5f07a1b)
- [Freeletics reviews (ConsumerAffairs)](https://www.consumeraffairs.com/health/freeletics.html)
- [Freeletics feedback analysis (Kimola)](https://kimola.com/reports/exclusive-freeletics-feedback-analysis-report-get-now-app-store-us-141427)
- [Planfit reviews (JustUseApp)](https://justuseapp.com/en/app/1511876936/planfit-gym-fitness-planner/reviews)
- [Planfit (G2)](https://www.g2.com/sellers/planfit)
- [BetterMe review (Garage Gym Reviews)](https://www.garagegymreviews.com/betterme-review)
- [BetterMe Trustpilot summary (Kimola)](https://kimola.com/reports/unlock-betterme-app-insights-comprehensive-review-analysis-trustpilot-en-us-146549)
- [Sweat app review (Tom's Guide)](https://tomsguide.com/wellness/workouts/sweat-app-review-ive-been-using-this-app-for-the-past-decade-and-heres-why-i-think-its-the-best-workout-app-for-women)
- [PUSH review (TechRadar)](https://techradar.com/health-fitness/fitness-apps/push-review-the-ai-app-of-choice-for-strength-based-athletes)
- [AI told me to work out less (TechRadar)](https://www.techradar.com/health-fitness/ai-told-me-to-work-out-less-and-the-results-were-a-disaster)

Ramadan
- [How to work out safely during Ramadan (Sweat)](https://sweat.com/blogs/Fitness/how-to-workout-during-ramadan)
- [How to stay fit and healthy fasting in Ramadan (Buro 24/7)](https://www.buro247.my/lifestyle/health-fitness/how-to-stay-fit-and-healthy-fasting-ramadan.html)

Exercise data
- [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) (LICENSE and NOTICE.md read directly)
- [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense)
- [wger documentation (licensing)](https://wger.readthedocs.io/en/2.4/)
- [ExerciseDB on Gumroad](https://exercisedb.gumroad.com/l/exercisedb)
- [Reddit thread on Gym visual reseller GIFs](https://reddit.sentinel-team.org/posts/1tnjhg2/snapshots/2026-05-25T20%3A18%3A25.2497Z)
