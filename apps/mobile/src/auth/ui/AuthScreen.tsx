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
import { authenticateUser, registerUser } from '../authStorage.js';
import { AuthSession } from '../types.js';

interface AuthScreenProps {
  initialMode?: 'login' | 'register';
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
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('Talha');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Simple native animations
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
  }, []);

  const handleSubmit = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      let session: AuthSession;
      if (mode === 'login') {
        session = await authenticateUser({
          email,
          password,
          rememberMe,
        });
      } else {
        session = await registerUser({
          name,
          email,
          password,
          rememberMe,
        });
      }
      onAuthSuccess(session);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please check inputs.');
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
              onPress={onBackToHome}
              activeOpacity={0.7}
            >
              <View style={styles.btnRow}>
                <Icon name="arrow-left" size={14} color={theme.colors.textPrimary} />
                <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>
                  Home
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
            {/* Tab Switcher */}
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

            <Text style={[styles.heading, { color: theme.colors.textPrimary }]}>
              {mode === 'login' ? 'Welcome Back!' : 'Start Your Journey'}
            </Text>
            <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
              {mode === 'login'
                ? 'Sign in to access your calibrated daily diary and AI coach.'
                : 'Join Nutrio for 100% free precision Pakistani nutrition tracking.'}
            </Text>

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
                  {mode === 'login' ? 'Sign In' : 'Create Free Account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Guest Mode */}
            {onExploreGuest && (
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
    borderRadius: 9999,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
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
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  eyeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 22,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#0A0B0D',
    fontSize: 13,
    fontWeight: '900',
  },
  rememberText: {
    fontSize: 13,
  },
  submitBtn: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  guestBtn: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  guestText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
