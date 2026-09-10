export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isRegistered: boolean;
  surveyCompleted: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface VerifyOtpPayload {
  email: string;
  token: string;
}

export interface RegistrationResult {
  requiresOtp: boolean;
  email: string;
  message: string;
  session?: AuthSession | null;
}

export interface OtpResult {
  success: boolean;
  session?: AuthSession | null;
  message?: string;
}

export type AuthScreenMode = 'login' | 'register' | 'verify_otp';
