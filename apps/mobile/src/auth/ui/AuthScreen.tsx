import { authErrorKey, authFieldForKey, validateAuthFields, type AuthField, type AuthFieldErrors } from '../authErrors.js';
import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../ui/BackButton.js';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';
import { AppleTextInput } from '../../ui/AppleInput.js';
import { Notice } from '../../ui/Notice.js';
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
  // Translated messages, shown under the field they are about.
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [ctaHovered, setCtaHovered] = useState(false);
  const { width } = useWindowDimensions();
  // Wide web: a brand side beside the form instead of a small card in an empty page. Phones are untouched.
  const wide = Platform.OS === 'web' && width >= WIDE_BREAKPOINT;
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

  const clearFieldError = (field: AuthField) => setFieldErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  const switchMode = (next: AuthScreenMode) => {
    setMode(next);
    setErrorMessage('');
    setInfoMessage('');
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    if (loading) return;
    setErrorMessage('');
    setInfoMessage('');
    const problems = validateAuthFields(mode === 'register' ? 'register' : 'login', { name, email, password });
    if (Object.keys(problems).length > 0) {
      setFieldErrors(Object.fromEntries(Object.entries(problems).map(([field, key]) => [field, t(key as string)])));
      return;
    }
    setFieldErrors({});
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
    } catch (err) {
      const key = authErrorKey(err instanceof Error ? err.message : undefined);
      const field = authFieldForKey(key);
      // A problem with one field goes under it; the rest (wrong password, account exists, network) is a banner.
      if (field) setFieldErrors({ [field]: t(key) });
      else setErrorMessage(t(key));
    } finally {
      setLoading(false);
    }
  };

  const tab = (target: AuthScreenMode, label: string) => {
    const selected = mode === target;
    return (
      <TouchableOpacity
        style={[styles.tabBtn, selected && { backgroundColor: theme.colors.primaryLime }]}
        accessibilityRole="tab"
        aria-selected={selected}
        accessibilityState={{ selected }}
        onPress={() => switchMode(target)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tabText,
            // One weight for both tabs: picking one must not change its width.
            { color: selected ? theme.colors.limeText : theme.colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const formBody = (
    <>
      {/* Segmented Tab Switcher */}
      <View accessibilityRole="tablist" style={[styles.tabContainer, { backgroundColor: theme.colors.surfaceSecondary }]}>
        {tab('login', t('auth.signIn'))}
        {tab('register', t('auth.createAccount'))}
      </View>

      {/* Header Titles */}
      <Text
        role="heading"
        aria-level={1}
        style={[styles.heading, wide && styles.headingWide, dir.text, { color: theme.colors.textPrimary }]}
      >
        {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAccount')}
      </Text>
      <Text style={[styles.subheading, wide && styles.subheadingWide, dir.text, { color: theme.colors.textSecondary }]}>
        {mode === 'login' ? t('auth.loginSubheading') : t('auth.registerSubheading')}
      </Text>

      {/* Info Message Banner */}
      {infoMessage ? (
        <Notice tone="info" icon="check" style={styles.banner}>
          {infoMessage}
        </Notice>
      ) : null}

      {/* Error Banner: only for what is not about one field (wrong password, account exists, no network) */}
      {errorMessage ? (
        <Notice tone="danger" style={styles.banner}>
          {errorMessage}
        </Notice>
      ) : null}

      {/* Form Inputs */}
      {mode === 'register' && (
        <AppleTextInput
          label={t('auth.fullName')}
          icon="user"
          placeholder={t('auth.fullNamePlaceholder')}
          value={name}
          onChangeText={(value) => {
            setName(value);
            clearFieldError('name');
          }}
          autoCapitalize="words"
          error={fieldErrors.name}
        />
      )}

      <AppleTextInput
        label={t('auth.emailAddress')}
        icon="mail"
        placeholder="you@gmail.com"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          clearFieldError('email');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        error={fieldErrors.email}
      />

      <AppleTextInput
        label={t('auth.password')}
        icon="lock"
        placeholder={t('auth.passwordPlaceholder')}
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          clearFieldError('password');
        }}
        onSubmitEditing={handleSubmit}
        secureTextEntry={!showPassword}
        error={fieldErrors.password}
        rightAction={
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((p) => !p)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            aria-pressed={showPassword}
            accessibilityLabel={showPassword ? t('auth.hide') : t('auth.show')}
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
        accessibilityRole="checkbox"
        aria-checked={rememberMe}
        accessibilityLabel={t('auth.rememberMe')}
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: rememberMe ? theme.colors.primaryLime : theme.colors.surfaceSecondary,
              borderColor: rememberMe ? theme.colors.primaryLime : theme.colors.border,
            },
          ]}
        >
          {rememberMe && <Icon name="check" size={14} color="#0A0B0D" strokeWidth={3} />}
        </View>
        <Text style={[styles.rememberText, { color: theme.colors.textSecondary }]}>{t('auth.rememberMe')}</Text>
      </TouchableOpacity>

      {/* Submit Button: a real button with a lift on hover and a press-in, not only a colour change */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
        accessibilityState={{ busy: loading, disabled: loading }}
        onPress={handleSubmit}
        disabled={loading}
        onHoverIn={() => setCtaHovered(true)}
        onHoverOut={() => setCtaHovered(false)}
        style={({ pressed }) => [
          styles.submitBtn,
          { backgroundColor: theme.colors.primaryLime },
          ctaHovered && !loading && styles.submitBtnHover,
          pressed && !loading && styles.submitBtnPressed,
          loading && styles.submitBtnDisabled,
        ]}
      >
        {({ pressed }) => (
          <>
            {/* Darkens a touch on hover and press, with the token colour underneath. */}
            <View
              style={[StyleSheet.absoluteFill, styles.submitShade, { opacity: pressed ? 0.14 : ctaHovered ? 0.08 : 0 }]}
            />
            {loading ? (
              <ActivityIndicator color="#0A0B0D" size="small" />
            ) : (
              <Text style={[styles.submitBtnText, { color: theme.colors.limeText }]}>
                {mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
              </Text>
            )}
          </>
        )}
      </Pressable>

      {/* Guest Mode */}
      {onExploreGuest && (
        <TouchableOpacity
          style={styles.guestBtn}
          onPress={onExploreGuest}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Text style={[styles.guestText, { color: theme.colors.textSecondary }]}>{t('auth.continueAsGuest')}</Text>
            <Icon name={dir.isRTL ? 'arrow-left' : 'arrow-right'} size={16} color={theme.colors.textSecondary} />
          </View>
        </TouchableOpacity>
      )}
    </>
  );

  const brandRow = (
    <View style={styles.brandRow}>
      <Image
        source={require('../../../assets/logo.webp')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>Nutrio</Text>
    </View>
  );

  const card = (
    <Animated.View
      style={[
        styles.card,
        wide && styles.cardWide,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {formBody}
    </Animated.View>
  );

  if (wide) {
    const limeText = theme.colors.limeText;
    return (
      <SafeAreaView style={[styles.safeArea, styles.wideRoot, { backgroundColor: theme.colors.canvas }]}>
        {/* Brand side */}
        <View style={[styles.brandPane, { backgroundColor: theme.colors.primaryLime }]}>
          <View style={styles.brandPaneInner}>
            <View style={styles.brandPaneLogo}>
              <Image
                source={require('../../../assets/logo.webp')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
              <Text style={[styles.brandPaneName, { color: limeText }]}>Nutrio</Text>
            </View>
            <Text style={[styles.brandHeadline, dir.text, { color: limeText }]}>{t('auth.brandHeadline')}</Text>
            <Text style={[styles.brandSub, dir.text, { color: limeText }]}>{t('auth.brandSub')}</Text>
            <View style={styles.brandPoints}>
              {(['brandPoint1', 'brandPoint2', 'brandPoint3'] as const).map((key) => (
                <View key={key} style={styles.brandPoint}>
                  <View style={[styles.brandPointDot, { backgroundColor: limeText }]}>
                    <Icon name="check" size={12} color={theme.colors.primaryLime} strokeWidth={3} />
                  </View>
                  <Text style={[styles.brandPointText, dir.text, { color: limeText }]}>{t(`auth.${key}`)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Form side */}
        <KeyboardAvoidingView style={styles.formPane}>
          <ScrollView contentContainerStyle={styles.formPaneContent} showsVerticalScrollIndicator={false}>
            {onBackToHome ? (
              <View style={styles.wideBack}>
                <BackButton variant="icon" onPress={onBackToHome} />
              </View>
            ) : null}
            {card}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
              <BackButton variant="icon" onPress={onBackToHome} />
            )}

            {brandRow}

            {onBackToHome && <View style={styles.backBtnPlaceholder} />}
          </View>

          {card}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/** Width (px) from which web shows the split layout. */
export const WIDE_BREAKPOINT = 900;

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
    width: 44,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandRow: {
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 60,
    height: 68,
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
    minHeight: 44,
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9999,
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
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
  // Space below a banner, so it never touches the first field.
  banner: {
    marginBottom: 16,
  },
  headingWide: {
    fontSize: 32,
  },
  subheadingWide: {
    fontSize: 15,
    lineHeight: 22,
  },
  cardWide: {
    width: '100%',
    maxWidth: 480,
    padding: 36,
  },
  wideRoot: {
    flexDirection: 'row',
    // App.tsx lets this layout use the whole window (see wrapScreen's `full`).
    width: '100%',
  },
  brandPane: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 64,
    paddingVertical: 48,
  },
  brandPaneInner: {
    maxWidth: 520,
    gap: 20,
  },
  brandPaneLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  brandPaneName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandHeadline: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  brandSub: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '600',
  },
  brandPoints: {
    gap: 14,
    marginTop: 12,
  },
  brandPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandPointDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandPointText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  formPane: {
    flex: 1,
  },
  formPaneContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  wideBack: {
    width: '100%',
    maxWidth: 480,
    marginBottom: 16,
  },
  eyeBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rememberRow: {
    minHeight: 44,
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
    overflow: 'hidden',
    ...Platform.select({
      web: { transition: 'transform 0.15s ease, box-shadow 0.15s ease', cursor: 'pointer' },
      default: {},
    }),
  },
  submitShade: {
    backgroundColor: '#000000',
    pointerEvents: 'none',
  },
  // Lifts a little on hover (web and desktop pointers), presses in on tap.
  submitBtnHover: {
    transform: [{ translateY: -1 }, { scale: 1.01 }],
    ...Platform.select({
      web: { boxShadow: '0 6px 16px rgba(0,0,0,0.18)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8 },
    }),
  },
  submitBtnPressed: {
    transform: [{ scale: 0.98 }],
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
    minHeight: 44,
    alignItems: 'center',
    paddingVertical: 8,
    justifyContent: 'center',
  },
  guestText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
