-- ============================================================================
-- Nutrio Migration: Auto-provision core.profiles on auth.users creation
-- Date: September 2026
-- ============================================================================

-- 1. Create function to handle new user registration
CREATE OR REPLACE FUNCTION core.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_name TEXT;
BEGIN
  -- Extract display name from metadata, fallback to email prefix or default
  extracted_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    NULLIF(split_part(NEW.email, '@', 1), ''),
    'User'
  );

  INSERT INTO core.profiles (
    auth_uid,
    display_name,
    locale,
    country,
    timezone,
    units_pref
  ) VALUES (
    NEW.id,
    extracted_name,
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en-PK'),
    COALESCE(NEW.raw_user_meta_data->>'country', 'PK'),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Karachi'),
    'metric'
  )
  ON CONFLICT (auth_uid) DO UPDATE
  SET
    display_name = COALESCE(EXCLUDED.display_name, core.profiles.display_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, core;

-- 2. Attach trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION core.handle_new_user();

-- 3. Ensure permissions
GRANT USAGE ON SCHEMA core TO postgres, service_role, authenticated;
GRANT ALL ON TABLE core.profiles TO postgres, service_role;
