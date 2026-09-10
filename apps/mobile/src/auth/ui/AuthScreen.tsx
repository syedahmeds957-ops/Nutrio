import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';
import {
  authenticateUser,
  registerUser,
  verifyEmailOtp,
  resendEmailOtp,
} from '../authStorage.js';
import { AuthSession, AuthScreenMode } from '../types.js';

interface AuthScreenProps {
  initialMode?: AuthScreenMode;
  onAuthSuccess: (session: AuthSession) => void;
  onBackToHome: () => void;
  onExploreGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
  onAuthSuccess,
  onBackToHome,
  onExploreGuest,
}) => {
  const { theme, isDark } = useTheme();
  const [mode, setMode] = useState<AuthScreenMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // OTP Verification state (6 digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const [resendCountdown, setResendCountdown] = useState<number>(60);
  const [resendLoading, setResendLoading] = useState<boolean>(false);

  // Native entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mode]);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer: any;
    if (mode === 'verify_otp' && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [mode, resendCountdown]);

  const handleOtpChange = (index: number, value: string) => {
    setErrorMessage('');
    const cleanVal = value.replace(/[^0-9]/g, '');

    // Handle full 6-digit paste
    if (cleanVal.length >= 6) {
      const newDigits = cleanVal.slice(0, 6).split('');
      setOtpDigits(newDigits);
      otpInputRefs.current[5]?.focus();
      return;
    }

    const updated = [...otpDigits];
    updated[index] = cleanVal ? cleanVal[cleanVal.length - 1] : '';
    setOtpDigits(updated);

    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || resendLoading) return;
    setErrorMessage('');
    setInfoMessage('');
    setResendLoading(true);

    try {
      const res = await resendEmailOtp(email);
      setInfoMessage(res.message);
      setResendCountdown(60);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not resend verification code.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setInfoMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const session = await authenticateUser({
          email,
          password,
          rememberMe,
        });
        onAuthSuccess(session);
      } else if (mode === 'register') {
        const regResult = await registerUser({
          name,
          email,
          password,
          rememberMe,
        });

        if (regResult.requiresOtp) {
          setMode('verify_otp');
          setInfoMessage(regResult.message);
          setResendCountdown(60);
          setOtpDigits(['', '', '', '', '', '']);
        } else if (regResult.session) {
          onAuthSuccess(regResult.session);
        }
      } else if (mode === 'verify_otp') {
        const token = otpDigits.join('');
        if (token.length < 6) {
          throw new Error('Please enter all 6 digits of your verification code.');
        }

        const otpResult = await verifyEmailOtp({
          email,
          token,
        });

        if (otpResult.session) {
          onAuthSuccess(otpResult.session);
        } else {
          setMode('login');
          setInfoMessage('Verification succeeded! Please sign in.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[
                styles.backBtn,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                if (mode === 'verify_otp') {
                  setMode('register');
                  setErrorMessage('');
                  setInfoMessage('');
                } else {
                  onBackToHome();
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.btnRow}>
                <Icon name="arrow-left" size={14} color={theme.colors.textPrimary} />
                <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>
                  {mode === 'verify_otp' ? 'Back' : 'Home'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.brandRow}>
              <View
                style={[
                  styles.logoCircle,
                  { backgroundColor: theme.colors.primaryLime },
                ]}
              >
                <Icon name="sparkles" size={14} color="#0A0B0D" />
              </View>
              <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
                Nutrio
              </Text>
            </View>
          </View>

          {/* Animated Card */}
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Tab Switcher (Visible in Login and Register modes) */}
            {mode !== 'verify_otp' && (
              <View
                style={[
                  styles.tabContainer,
                  { backgroundColor: theme.colors.surfaceSecondary },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    mode === 'login' && {
                      backgroundColor: theme.colors.primaryLime,
                    },
                  ]}
                  onPress={() => {
                    setMode('login');
                    setErrorMessage('');
                    setInfoMessage('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          mode === 'login'
                            ? '#0A0B0D'
                            : theme.colors.textSecondary,
                        fontWeight: mode === 'login' ? '800' : '600',
                      },
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabBtn,
                    mode === 'register' && {
                      backgroundColor: theme.colors.primaryLime,
                    },
                  ]}
                  onPress={() => {
                    setMode('register');
                    setErrorMessage('');
                    setInfoMessage('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          mode === 'register'
                            ? '#0A0B0D'
                            : theme.colors.textSecondary,
                        fontWeight: mode === 'register' ? '800' : '600',
                      },
                    ]}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Header Titles */}
            <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>
              {mode === 'login'
                ? 'Welcome Back!'
                : mode === 'register'
                ? 'Start Your Journey'
                : 'Verify Email OTP'}
            </Text>
            <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
              {mode === 'login'
                ? 'Sign in to access your calibrated daily diary and AI coach.'
                : mode === 'register'
                ? 'Join Nutrio for precision Pakistani nutrition tracking with Supabase sync.'
                : `We dispatched a 6-digit confirmation code to ${email || 'your email'}. Enter it below to activate your account.`}
            </Text>

            {/* Info Message Banner */}
            {infoMessage ? (
              <View
                style={[
                  styles.infoBanner,
                  {
                    backgroundColor: isDark
                      ? 'rgba(16, 185, 129, 0.15)'
                      : '#D1FAE5',
                  },
                ]}
              >
                <Text style={[styles.infoText, { color: theme.colors.success }]}>
                  ✓ {infoMessage}
                </Text>
              </View>
            ) : null}

            {/* Error Banner */}
            {errorMessage ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: isDark
                      ? 'rgba(239, 68, 68, 0.15)'
                      : '#FEE2E2',
                  },
                ]}
              >
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            ) : null}

            {/* OTP Verification UI */}
            {mode === 'verify_otp' ? (
              <View style={styles.otpSection}>
                <Text style={[styles.inputLabel, { color: theme.colors.textPrimary, marginBottom: 12 }]}>
                  6-Digit Verification Code
                </Text>
                <View style={styles.otpRow}>
                  {otpDigits.map((digit, idx) => (
                    <TextInput
                      key={`otp_cell_${idx}`}
                      ref={(ref) => {
                        otpInputRefs.current[idx] = ref;
                      }}
                      style={[
                        styles.otpBox,
                        {
                          backgroundColor: theme.colors.surfaceSecondary,
                          borderColor: digit ? theme.colors.primaryLime : theme.colors.border,
                          color: theme.colors.textPrimary,
                        },
                      ]}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(idx, val)}
                      onKeyPress={({ nativeEvent }) => handleOtpKeyPress(idx, nativeEvent.key)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      textAlign="center"
                    />
                  ))}
                </View>

                {/* Resend Action */}
                <View style={styles.resendRow}>
                  <Text style={[styles.resendInfo, { color: theme.colors.textMuted }]}>
                    Didn't receive the code?
                  </Text>
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={resendCountdown > 0 || resendLoading}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.resendBtnText,
                        {
                          color:
                            resendCountdown > 0
                              ? theme.colors.textMuted
                              : theme.colors.success,
                        },
                      ]}
                    >
                      {resendCountdown > 0
                        ? `Resend in ${resendCountdown}s`
                        : resendLoading
                        ? 'Sending...'
                        : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.changeEmailBtn}
                  onPress={() => {
                    setMode('register');
                    setErrorMessage('');
                    setInfoMessage('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.changeEmailText, { color: theme.colors.textSecondary }]}>
                    Incorrect email? Change address &rarr;
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Standard Credentials Inputs */
              <>
                {/* Name Input (Register mode only) */}
                {mode === 'register' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
                      Full Name
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.surfaceSecondary,
                          borderColor: theme.colors.border,
                          color: theme.colors.textPrimary,
                        },
                      ]}
                      placeholder="e.g. Talha"
                      placeholderTextColor={theme.colors.textMuted}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
                    Email Address
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.surfaceSecondary,
                        borderColor: theme.colors.border,
                        color: theme.colors.textPrimary,
                      },
                    ]}
                    placeholder="talha@nutrio.app"
                    placeholderTextColor={theme.colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
                    Password
                  </Text>
                  <View
                    style={[
                      styles.passwordRow,
                      {
                        backgroundColor: theme.colors.surfaceSecondary,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <TextInput
                      style={[
                        styles.passwordInput,
                        { color: theme.colors.textPrimary },
                      ]}
                      placeholder="Min 6 characters"
                      placeholderTextColor={theme.colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword((p) => !p)}
                    >
                      <Text style={[styles.eyeText, { color: theme.colors.textSecondary }]}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Remember Me */}
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRememberMe((r) => !r)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: rememberMe
                          ? theme.colors.primaryLime
                          : theme.colors.surfaceSecondary,
                        borderColor: rememberMe
                          ? theme.colors.primaryLime
                          : theme.colors.border,
                      },
                    ]}
                  >
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.rememberText, { color: theme.colors.textSecondary }]}>
                    Remember me on this device
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: theme.colors.primaryLime },
                loading && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0A0B0D" size="small" />
              ) : (
                <Text style={[styles.submitBtnText, { color: theme.colors.limeText }]}>
                  {mode === 'login'
                    ? 'Sign In'
                    : mode === 'register'
                    ? 'Send Verification OTP'
                    : 'Verify & Access Nutrio'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Guest Mode */}
            {mode !== 'verify_otp' && onExploreGuest && (
              <TouchableOpacity
                style={styles.guestBtn}
                onPress={onExploreGuest}
                activeOpacity={0.7}
              >
                <Text style={[styles.guestText, { color: theme.colors.textSecondary }]}>
                  Continue as Guest →
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 9999,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9999,
  },
  tabText: {
    fontSize: 13,
  },
  heading: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  infoBanner: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorBanner: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eyeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#0A0B0D',
    fontSize: 12,
    fontWeight: '900',
  },
  rememberText: {
    fontSize: 12,
  },
  submitBtn: {
    height: 50,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  guestText: {
    fontSize: 12,
    fontWeight: '600',
  },
  otpSection: {
    marginBottom: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    width: '100%',
  },
  otpBox: {
    flex: 1,
    minWidth: 0,
    maxWidth: 48,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  resendInfo: {
    fontSize: 12,
  },
  resendBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  changeEmailBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  changeEmailText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
