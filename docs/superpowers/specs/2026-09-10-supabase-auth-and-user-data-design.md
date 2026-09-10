# Supabase Authentication & User Data Persistence Specification

**Date:** 2026-09-10  
**Status:** Approved (Approach A)  
**Author:** Antigravity Engineering  

---

## 1. Overview & Objectives

Nutrio requires a secure, production-ready authentication system and cloud data persistence layer powered by Supabase.
- **Email + Password Authentication**: Standard credentials login for existing verified users.
- **Mandatory First-Time OTP Verification**: When a user registers with email & password, an OTP verification code is dispatched to their email. The user must verify this code in-app before being granted an active authenticated session.
- **Automated Profile Provisioning**: A PostgreSQL trigger on `auth.users` automatically provisions a linked profile record in `core.profiles`.
- **Cloud Persistence of User Onboarding Data**: When a verified user completes the onboarding survey and calculates their target plan, their inputs and derived targets are written to `core.lifestyle_surveys`, `core.body_metrics`, and `core.targets` in Supabase with full Row Level Security (RLS) enforcement.
- **Cross-Platform Storage**: Robust session management across both native mobile (iOS/Android) and Expo Web environments.

---

## 2. Database Layer & Migrations

### 2.1 Profile Auto-Creation Trigger
In Supabase, when a new record enters `auth.users`, a database function `core.handle_new_user()` executes:
```sql
CREATE OR REPLACE FUNCTION core.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO core.profiles (
    auth_uid,
    display_name,
    locale,
    country,
    timezone
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'en-PK',
    'PK',
    'Asia/Karachi'
  )
  ON CONFLICT (auth_uid) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION core.handle_new_user();
```

### 2.2 RLS Policies
Ensure existing RLS policies in `core` schema allow authenticated users to read/update their own profile and insert survey, metric, and target records:
- `core.profiles`: `auth.uid() = auth_uid`
- `core.body_metrics`: `user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid())`
- `core.lifestyle_surveys`: `user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid())`
- `core.targets`: `user_id IN (SELECT id FROM core.profiles WHERE auth_uid = auth.uid())`

---

## 3. Client Architecture (`apps/mobile`)

### 3.1 Dependencies
Install `@supabase/supabase-js` and `@react-native-async-storage/async-storage` in `apps/mobile`.

### 3.2 Supabase Client Configuration
Create `apps/mobile/src/supabase/client.ts`:
- Reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (or fallback config).
- Configures custom storage wrapper that uses `AsyncStorage` on native and `localStorage` on web with `autoRefreshToken: true`, `persistSession: true`, and `detectSessionInUrl: false`.

### 3.3 Auth Storage & Service Layer
Refactor `apps/mobile/src/auth/authStorage.ts` to connect to Supabase:
- `signInWithPassword(email, password)`: Logs in returning session.
- `signUpWithPassword(email, password, displayName)`: Initiates signup; returns status indicating OTP verification is required.
- `verifyEmailOtp(email, token)`: Verifies 6-digit OTP code using `supabase.auth.verifyOtp({ email, token, type: 'signup' })`.
- `resendOtp(email)`: Triggers `supabase.auth.resend({ type: 'signup', email })` with a 60s client throttle.
- `signOut()`: Clears Supabase session and local cache.
- `restoreSession()`: Hydrates the active session on app startup.

### 3.4 User Data Synchronization Service
Create `apps/mobile/src/sync/userDataSync.ts`:
- `syncOnboardingData(userContext, surveyPayload, computedPlan)`:
  1. Resolves `core.profiles.id` matching current `auth.uid()`.
  2. Inserts payload into `core.lifestyle_surveys`.
  3. Inserts initial weight record into `core.body_metrics`.
  4. Inserts calculated targets into `core.targets`.

---

## 4. Frontend Design & UI State Machine (`frontend-design`)

### 4.1 Visual Components & States
In `apps/mobile/src/auth/ui/AuthScreen.tsx`:
- **Modes**: `'login' | 'register' | 'verify_otp'`
- **OTP Screen Elements**:
  - Distinct 6-digit individual box inputs with auto-focus, paste handling, and auto-advance.
  - Informative text indicating the recipient email.
  - "Resend Code" button with interactive 60s countdown timer.
  - "Change Email / Back" option to return to registration without breaking layout.
- **Theme and Accessibility**:
  - Fully responsive for mobile and desktop screens.
  - Minimum touch target size 44x44px.
  - WCAG AA high-contrast labels and error messaging.

---

## 5. Testing & Verification

1. **Unit & Service Tests**:
   - Test Supabase auth adapter with mock responses (signup, verify OTP, login, session restore).
   - Test user data sync service payload transformation.
2. **Integration Verification**:
   - Run Vitest suite across workspaces.
   - Verify web bundle build and TypeScript compile (`npm run build`).
