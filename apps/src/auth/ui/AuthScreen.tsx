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
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';
import { AppleTextInput } from '../../ui/AppleInput.js';
import { authenticateUser, registerUser } from '../authStorage.js';
import { AuthSession, AuthScreenMode } from '../types.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';

interface AuthScreenProps {
  initialMode?: AuthScreenMode;
  onAuthSuccess: (session: AuthSession) => void;
  onBackToHome?: () => void;
  onExploreGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
  onAuthSuccess,
  onBackToHome,
  onExploreGuest,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const [mode, setMode] = useState<AuthScreenMode>(
    initialMode === 'verify_otp' ? 'register' : initialMode
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

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
      } else {
        const regResult = await registerUser({
          name,
          email,
          password,
          rememberMe,
        });

        if (regResult.session) {
          onAuthSuccess(regResult.session);
        } else {
          const session = await authenticateUser({
            email,
            password,
            rememberMe,
          });
          onAuthSuccess(session);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('auth.genericError'));
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
          {/* Top Bar (Brand Header & optional Back Button) */}
          <View style={[styles.topBar, !onBackToHome && styles.topBarCentered]}>
            {onBackToHome && (
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
                    {t('common.back')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

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

            {onBackToHome && <View style={styles.backBtnPlaceholder} />}
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
            {/* Segmented Tab Switcher */}
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
                  {t('auth.signIn')}
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
                  {t('auth.createAccount')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Header Titles */}
            <Text style={[styles.heading, dir.text, { color: theme.colors.textPrimary }]}>
              {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
            </Text>
            <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
              {mode === 'login'
                ? t('auth.loginSubheading')
                : t('auth.registerSubheading')}
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

            {/* Form Inputs */}
            {mode === 'register' && (
              <AppleTextInput
                label={t('auth.fullName')}
                icon="user"
                placeholder={t('auth.fullNamePlaceholder')}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}

            <AppleTextInput
              label={t('auth.emailAddress')}
              icon="mail"
              placeholder="you@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppleTextInput
              label={t('auth.password')}
              icon="lock"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightAction={
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((p) => !p)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.eyeText, { color: theme.colors.textSecondary }]}>
                    {showPassword ? t('auth.hide') : t('auth.show')}
                  </Text>
                </TouchableOpacity>
              }
            />

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
                {t('auth.rememberMe')}
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
                  {mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
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
                  {t('auth.continueAsGuest')} {dir.isRTL ? '←' : '→'}
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
    width: '100%',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  topBarCentered: {
    justifyContent: 'center',
    marginBottom: 20,
  },
  backBtnPlaceholder: {
    width: 60,
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
});
