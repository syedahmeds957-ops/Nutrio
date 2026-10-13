-- core.targets: let users record their own targets, and keep the full plan.
--
-- The table only had a SELECT policy, so RLS rejected every insert from the
-- app: no target ever reached the cloud, and a sign-in on a new device could
-- not restore the plan. Targets stay an append-only history, so users get
-- INSERT but no UPDATE or DELETE.

DROP POLICY IF EXISTS "Users insert own targets" ON core.targets;
CREATE POLICY "Users insert own targets"
  ON core.targets
  FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = (SELECT auth.uid())));

-- The summary columns lack sex, age and height, so a plan rebuilt from them
-- had to guess. The accepted plan is stored whole and restored as-is.
ALTER TABLE core.targets ADD COLUMN IF NOT EXISTS plan JSONB;

-- Restores read the newest row per user.
CREATE INDEX IF NOT EXISTS targets_user_effective_idx
  ON core.targets (user_id, effective_from DESC);

-- Unused tables, all empty when dropped:
-- - meal_entries / meal_items: superseded by core.activity_logs, which stores
--   each day's items without needing the food catalogue imported into core.foods.
-- - vision_corrections: the photo scanner has been removed.
-- No CASCADE, so anything still depending on them makes this fail loudly.
DROP TABLE IF EXISTS core.vision_corrections;
DROP TABLE IF EXISTS core.meal_items;
DROP TABLE IF EXISTS core.meal_entries;
