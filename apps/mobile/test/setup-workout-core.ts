import { loadWorkoutCore } from '../src/workout/core.js';

// Workout code reaches the engine through workout/core.ts, which needs it in
// memory first; in the app the splash waits for it, here the test run does.
await loadWorkoutCore();
