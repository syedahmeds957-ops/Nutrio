-- Workout plans and logs, backed up per signed-in user.
--
-- Both store the app's own JSON (WeeklyWorkoutPlan, WorkoutLog[] from
-- @nutrio/workout-core) whole, the same way activity_logs stores a diary day:
-- the plan and its logs round-trip without a mapping step. Guests never sync.

-- One plan per user. updated_at is the device's save time (sent by the
-- client, not now()), so two devices compare saves on the same clock and
-- the newer plan wins.
CREATE TABLE IF NOT EXISTS core.workout_plans (
  user_id UUID PRIMARY KEY REFERENCES core.profiles(id) ON DELETE CASCADE,
  plan JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per day holding every workout finished that day, so a second
-- session on the same date never overwrites the first.
CREATE TABLE IF NOT EXISTS core.workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workout_logs_unique_day UNIQUE (user_id, log_date)
);

ALTER TABLE core.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.workout_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own workout plan" ON core.workout_plans;
CREATE POLICY "Users manage own workout plan"
  ON core.workout_plans
  FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = (SELECT auth.uid())))
  WITH CHECK (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users manage own workout logs" ON core.workout_logs;
CREATE POLICY "Users manage own workout logs"
  ON core.workout_logs
  FOR ALL
  TO authenticated
  USING (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = (SELECT auth.uid())))
  WITH CHECK (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = (SELECT auth.uid())));

-- Default privileges only cover tables created by the role that set them, so
-- grant explicitly. Signed-in users only: anon gets nothing here.
GRANT SELECT, INSERT, UPDATE, DELETE ON core.workout_plans, core.workout_logs TO authenticated;
REVOKE ALL ON core.workout_plans, core.workout_logs FROM anon;

NOTIFY pgrst, 'reload schema';
