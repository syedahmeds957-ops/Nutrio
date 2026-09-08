-- ============================================================================
-- Nutrio Initial Dual-Schema Migration
-- Enforces strict ODbL isolation between 'core' (proprietary) and 'off' (Open Food Facts)
-- Date: September 2026
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 2. Create Isolated Schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS off;

-- ============================================================================
-- SCHEMA: CORE (Proprietary Company Asset — USDA CC0 + INDB + Pakistani Foods)
-- ============================================================================

-- 2.1 User Profiles
CREATE TABLE IF NOT EXISTS core.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_uid UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  sex TEXT CHECK (sex IN ('male', 'female')),
  dob DATE,
  height_cm NUMERIC(5,2),
  locale TEXT DEFAULT 'en-PK',
  country TEXT DEFAULT 'PK',
  timezone TEXT DEFAULT 'Asia/Karachi',
  units_pref TEXT DEFAULT 'metric' CHECK (units_pref IN ('metric', 'imperial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Body Metrics (Immutable Log)
CREATE TABLE IF NOT EXISTS core.body_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight_kg NUMERIC(5,2) NOT NULL,
  bodyfat_pct NUMERIC(4,1),
  waist_cm NUMERIC(5,2),
  hip_cm NUMERIC(5,2),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'healthkit', 'scale'))
);

-- 2.3 Lifestyle Surveys (Versioned JSONB, Never Overwritten)
CREATE TABLE IF NOT EXISTS core.lifestyle_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL,
  CONSTRAINT uq_user_survey_version UNIQUE (user_id, version)
);

-- 2.4 Targets (Full Audit Trail)
CREATE TABLE IF NOT EXISTS core.targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  bmr INTEGER NOT NULL,
  tdee_formula INTEGER NOT NULL,
  tdee_adaptive INTEGER,
  goal TEXT NOT NULL CHECK (goal IN ('lose', 'maintain', 'gain')),
  rate_kg_per_week NUMERIC(4,2) NOT NULL,
  kcal_target INTEGER NOT NULL,
  protein_g INTEGER NOT NULL,
  carb_g INTEGER NOT NULL,
  fat_g INTEGER NOT NULL,
  fibre_g INTEGER NOT NULL,
  water_ml INTEGER NOT NULL,
  method TEXT NOT NULL,
  safety_flags JSONB DEFAULT '[]'::jsonb,
  generated_by TEXT NOT NULL CHECK (generated_by IN ('rule', 'adaptive'))
);

-- 2.5 Canonical Food Graph
CREATE TABLE IF NOT EXISTS core.foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ur TEXT,
  brand TEXT,
  category TEXT,
  cuisine_tags TEXT[] DEFAULT '{}',
  kcal_100g NUMERIC(6,1) NOT NULL,
  protein_100g NUMERIC(5,1) NOT NULL,
  carb_100g NUMERIC(5,1) NOT NULL,
  fat_100g NUMERIC(5,1) NOT NULL,
  fibre_100g NUMERIC(5,1) DEFAULT 0,
  sugar_100g NUMERIC(5,1) DEFAULT 0,
  sodium_mg_100g NUMERIC(7,1) DEFAULT 0,
  sat_fat_100g NUMERIC(5,1) DEFAULT 0,
  micros JSONB DEFAULT '{}'::jsonb,
  source TEXT NOT NULL CHECK (source IN ('usda', 'indb', 'pak_custom', 'user')),
  source_ref TEXT,
  verified_by TEXT DEFAULT 'computed',
  verified_at TIMESTAMPTZ,
  confidence SMALLINT DEFAULT 100,
  is_recipe BOOLEAN DEFAULT FALSE,
  oil_added_g NUMERIC(5,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Local Serving Sizes (Critical Desi UX: 1 roti = 45g, 1 katori daal = 150g)
CREATE TABLE IF NOT EXISTS core.food_servings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_id UUID NOT NULL REFERENCES core.foods(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  label_ur TEXT,
  grams NUMERIC(6,1) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE
);

-- 2.7 Recipe Composition Items
CREATE TABLE IF NOT EXISTS core.recipe_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_food_id UUID NOT NULL REFERENCES core.foods(id) ON DELETE CASCADE,
  component_food_id UUID NOT NULL REFERENCES core.foods(id) ON DELETE RESTRICT,
  grams NUMERIC(6,1) NOT NULL,
  yield_factor NUMERIC(4,2) DEFAULT 1.0,
  retention_factor NUMERIC(4,2) DEFAULT 1.0
);

-- 2.8 Meal Log Entries
CREATE TABLE IF NOT EXISTS core.meal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meal_slot TEXT NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  source TEXT NOT NULL CHECK (source IN ('search', 'barcode', 'photo', 'voice', 'recipe', 'quick')),
  photo_path TEXT, -- 100x100 thumbnail only, original photo is discarded
  ai_job_id UUID,
  note TEXT
);

-- 2.9 Meal Items (Calories always derived from grams x db per-100g nutrients)
CREATE TABLE IF NOT EXISTS core.meal_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_entry_id UUID NOT NULL REFERENCES core.meal_entries(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES core.foods(id) ON DELETE RESTRICT,
  grams NUMERIC(6,1) NOT NULL,
  kcal NUMERIC(6,1) NOT NULL,
  protein_g NUMERIC(5,1) NOT NULL,
  carb_g NUMERIC(5,1) NOT NULL,
  fat_g NUMERIC(5,1) NOT NULL,
  confidence TEXT DEFAULT 'high' CHECK (confidence IN ('high', 'med', 'low')),
  was_corrected BOOLEAN DEFAULT FALSE,
  original_grams NUMERIC(6,1)
);

-- 2.10 AI Audit Trail
CREATE TABLE IF NOT EXISTS core.ai_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('assess', 'coach', 'vision', 'plan')),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cost_usd NUMERIC(8,6) DEFAULT 0,
  latency_ms INTEGER,
  input_ref TEXT,
  output JSONB,
  validated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 Vision Corrections (Proprietary Training Corpus)
CREATE TABLE IF NOT EXISTS core.vision_corrections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
  ai_job_id UUID REFERENCES core.ai_jobs(id) ON DELETE SET NULL,
  predicted JSONB NOT NULL,
  corrected JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SCHEMA: OFF (Open Food Facts — STRICTLY ISOLATED TO COMPLY WITH ODbL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS off.products (
  barcode TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  nutrients JSONB NOT NULL,
  last_synced TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES & PERFORMANCE
-- ============================================================================

-- Core foods search: FTS + Trigram for fuzzy desi matching ("chicken karahi" / "murgh karahi")
CREATE INDEX IF NOT EXISTS idx_core_foods_name_trgm ON core.foods USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_core_foods_name_ur ON core.foods (name_ur);
CREATE INDEX IF NOT EXISTS idx_core_foods_category ON core.foods (category);
CREATE INDEX IF NOT EXISTS idx_core_food_servings_food_id ON core.food_servings (food_id);

-- OFF barcode lookup index (must return in <50ms)
CREATE INDEX IF NOT EXISTS idx_off_products_barcode ON off.products (barcode);

-- User logs indexing for daily/weekly lookups
CREATE INDEX IF NOT EXISTS idx_core_meal_entries_user_date ON core.meal_entries (user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_core_body_metrics_user_date ON core.body_metrics (user_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_core_meal_items_entry ON core.meal_items (meal_entry_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — User Health Data Protection
-- ============================================================================

ALTER TABLE core.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.body_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.lifestyle_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.vision_corrections ENABLE ROW LEVEL SECURITY;

-- Profiles Policy
CREATE POLICY "Users can view own profile"
  ON core.profiles FOR SELECT
  USING (auth.uid() = auth_uid);

CREATE POLICY "Users can update own profile"
  ON core.profiles FOR UPDATE
  USING (auth.uid() = auth_uid);

CREATE POLICY "Users can insert own profile"
  ON core.profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_uid);

-- Body Metrics Policy
CREATE POLICY "Users manage own metrics"
  ON core.body_metrics FOR ALL
  USING (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid()));

-- Lifestyle Surveys Policy
CREATE POLICY "Users manage own surveys"
  ON core.lifestyle_surveys FOR ALL
  USING (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid()));

-- Targets Policy
CREATE POLICY "Users view own targets"
  ON core.targets FOR SELECT
  USING (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid()));

-- Meal Entries Policy
CREATE POLICY "Users manage own meal entries"
  ON core.meal_entries FOR ALL
  USING (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid()));

-- Meal Items Policy
CREATE POLICY "Users manage own meal items"
  ON core.meal_items FOR ALL
  USING (meal_entry_id IN (
    SELECT id FROM core.meal_entries WHERE user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid())
  ));

-- Food Catalog: Public Read, Service-Role Write
ALTER TABLE core.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read foods" ON core.foods FOR SELECT USING (true);

ALTER TABLE core.food_servings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read servings" ON core.food_servings FOR SELECT USING (true);

ALTER TABLE off.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read off products" ON off.products FOR SELECT USING (true);
