-- Daily activity persistence + PostgREST access to the `core` schema.
--
-- Why a denormalized table instead of core.meal_entries / core.meal_items:
-- meal_items.food_id is NOT NULL REFERENCES core.foods(id), but the mobile
-- tracker logs items out of the local @nutrio/food-db package, which has no
-- core.foods UUID, and core.foods is unpopulated. Writing meal_items would
-- require importing the whole local food catalogue into Postgres first. The
-- tracker already persists a self-contained per-day payload (items + water),
-- so activity_logs stores exactly that and round-trips without a mapping step.
-- meal_entries/meal_items stay in place for when foods are seeded server-side.

CREATE TABLE IF NOT EXISTS core.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('PK', 'SA')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  water_ml INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT activity_logs_unique_day UNIQUE (user_id, log_date, region)
);

CREATE INDEX IF NOT EXISTS activity_logs_user_date_idx
  ON core.activity_logs (user_id, log_date DESC);

ALTER TABLE core.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own activity logs" ON core.activity_logs;
CREATE POLICY "Users manage own activity logs"
  ON core.activity_logs
  FOR ALL
  USING (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid()));

-- PostgREST rejected every core.* request with PGRST106 ("Only the following
-- schemas are exposed: public, graphql_public"), so all sync silently failed.
GRANT USAGE ON SCHEMA core TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA core TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA core TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA core TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA core
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- Add core to the exposed schema list. On hosted Supabase this can be
-- overridden by Settings -> API -> Exposed schemas; set it there too.
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, core';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
