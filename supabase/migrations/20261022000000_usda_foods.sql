-- USDA FoodData Central reference foods, held in our own database.
--
-- dish-breakdown values the ingredients the app's catalogue lacks from USDA.
-- Calling the FDC API needs a data.gov key and caps requests per hour; the
-- generic foods it searched (Foundation and SR Legacy) are a public-domain
-- (CC0) download of about 8,200 rows, so they live here instead and the
-- function searches them with search_usda_foods(). The rows are loaded by the
-- generated *_usda_foods_data.sql migration (scripts/import-usda.mjs).
--
-- Values are per 100 g, copied from the USDA record by the same per100gFrom()
-- the function used on API results. Nothing here is estimated.

CREATE SCHEMA IF NOT EXISTS usda;

CREATE TABLE IF NOT EXISTS usda.foods (
  fdc_id INTEGER PRIMARY KEY,
  data_type TEXT NOT NULL CHECK (data_type IN ('Foundation', 'SR Legacy')),
  description TEXT NOT NULL,
  kcal INTEGER NOT NULL CHECK (kcal BETWEEN 0 AND 902),
  protein NUMERIC(5, 1) NOT NULL CHECK (protein >= 0),
  carbs NUMERIC(5, 1) NOT NULL CHECK (carbs >= 0),
  fat NUMERIC(5, 1) NOT NULL CHECK (fat >= 0),
  fibre NUMERIC(5, 1) NOT NULL CHECK (fibre >= 0),
  sugar NUMERIC(5, 1) NOT NULL CHECK (sugar >= 0),
  sodium_mg INTEGER NOT NULL CHECK (sodium_mg >= 0),
  sat_fat NUMERIC(5, 1) NOT NULL CHECK (sat_fat >= 0),
  -- USDA names lead with the food itself ("Nuts, coconut milk, canned"), so
  -- the part before the first comma ranks above the qualifiers after it.
  search TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', split_part(description, ',', 1)), 'A') ||
    setweight(to_tsvector('english', description), 'B')
  ) STORED
);

CREATE INDEX IF NOT EXISTS foods_search_idx ON usda.foods USING GIN (search);

-- Only the edge function reads this, with the service key.
ALTER TABLE usda.foods ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA usda TO service_role;
GRANT SELECT ON usda.foods TO service_role;

-- The best-matching records for one ingredient name. Records holding every
-- word come first; when none does (a word USDA never uses, like "basmati"),
-- records holding some of the words are still offered, and the model that
-- picks among them rejects any that are not the same food. Shorter names win
-- ties, since the plain food ("Butter, salted") is shorter than its variants.
--
-- In `public` so PostgREST exposes it without changing the API schema list.
CREATE OR REPLACE FUNCTION public.search_usda_foods(query TEXT, max_results INTEGER DEFAULT 5)
RETURNS TABLE (
  fdc_id INTEGER,
  data_type TEXT,
  description TEXT,
  kcal INTEGER,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  fibre NUMERIC,
  sugar NUMERIC,
  sodium_mg INTEGER,
  sat_fat NUMERIC
)
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  WITH q AS (
    SELECT
      plainto_tsquery('english', query) AS all_words,
      replace(plainto_tsquery('english', query)::text, ' & ', ' | ')::tsquery AS any_word
  )
  SELECT f.fdc_id, f.data_type, f.description, f.kcal, f.protein, f.carbs, f.fat,
         f.fibre, f.sugar, f.sodium_mg, f.sat_fat
  FROM usda.foods f, q
  WHERE f.search @@ q.any_word
  ORDER BY (f.search @@ q.all_words) DESC,
           ts_rank(f.search, q.any_word) DESC,
           length(f.description),
           f.fdc_id
  LIMIT least(greatest(max_results, 1), 20);
$$;

REVOKE EXECUTE ON FUNCTION public.search_usda_foods(TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_usda_foods(TEXT, INTEGER) TO service_role;

NOTIFY pgrst, 'reload schema';
