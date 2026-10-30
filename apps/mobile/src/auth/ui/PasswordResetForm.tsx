import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, commonRadii } from '../../theme.js';
import { AppleTextInput } from '../../ui/AppleInput.js';
import { Notice } from '../../ui/Notice.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { requestPasswordReset, resetPasswordWithCode } from '../authStorage.js';
import { authErrorKey, authFieldForKey, type AuthFieldErrors } from '../authErrors.js';
import type { AuthSession } from '../types.js';

interface PasswordResetFormProps {
  /** The email typed on the sign-in form, so it is not typed twice. */
  initialEmail: string;
  onBackToSignIn: () => void;
  /** The reset signs the user in, so this takes the same session sign-in does. */
  onDone: (session: AuthSession) => void;
}

/**
 * Two steps in the auth card: ask for an email and send a code, then take the
 * code with a new password. Sets the password and signs in on success.
 */
export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ initialEmail, onBackToSignIn, onDone }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  /** Runs one attempt, showing its failure under the field it is about, or as a banner. */
  const attempt = async (work: () => Promise<void>) => {
    if (loading) return;
    setErrorMessage('');
    setInfoMessage('');
    setFieldErrors({});
    setLoading(true);
    try {
      await work();
    } catch (err) {
      const key = authErrorKey(err instanceof Error ? err.message : undefined);
      const field = authFieldForKey(key);
      if (field) setFieldErrors({ [field]: t(key) });
      else setErrorMessage(t(key));
    } finally {
      setLoading(false);
    }
  };

  const sendCode = () =>
    attempt(async () => {
      await requestPasswordReset(email);
      setStep('code');
      setInfoMessage(t('auth.reset.codeSent', { email: email.trim() }));
    });

  const resend = () =>
    attempt(async () => {
      await requestPasswordReset(email);
      setInfoMessage(t('auth.reset.resent'));
    });

  const submit = () =>
    attempt(async () => {
      const problems: AuthFieldErrors = {};
      if (!/^\d{6,10}$/.test(code.replace(/\s/g, ''))) problems.code = t('auth.errors.codeInvalid');
      if (password.length < 6) problems.password = t('auth.errors.passwordTooShort');
      if (Object.keys(problems).length > 0) {
        setFieldErrors(problems);
        return;
      }
      onDone(await resetPasswordWithCode({ email, token: code, newPassword: password }));
    });

  return (
    <View>
      <Text role="heading" aria-level={1} style={[styles.heading, dir.text, { color: theme.colors.textPrimary }]}>
        {t('auth.reset.title')}
      </Text>
      <Text style={[styles.subheading, dir.text, { color: theme.colors.textSecondary }]}>
        {step === 'email' ? t('auth.reset.emailSubheading') : t('auth.reset.codeSubheading')}
      </Text>

      {infoMessage ? (
        <Notice tone="info" icon="check" style={styles.banner}>
          {infoMessage}
        </Notice>
      ) : null}
      {errorMessage ? (
        <Notice tone="danger" style={styles.banner}>
          {errorMessage}
        </Notice>
      ) : null}

      {step === 'email' ? (
        <AppleTextInput
          label={t('auth.emailAddress')}
          icon="mail"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setFieldErrors({});
          }}
          onSubmitEditing={sendCode}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={fieldErrors.email}
        />
      ) : (
        <>
          <AppleTextInput
            label={t('auth.reset.code')}
            icon="lock"
            placeholder="123456"
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setFieldErrors((current) => ({ ...current, code: undefined }));
            }}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            maxLength={10}
            error={fieldErrors.code}
          />
          <AppleTextInput
            label={t('auth.reset.newPassword')}
            icon="lock"
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setFieldErrors((current) => ({ ...current, password: undefined }));
            }}
            onSubmitEditing={submit}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            error={fieldErrors.password}
            rightAction={
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((shown) => !shown)}
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
        </>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={step === 'email' ? t('auth.reset.sendCode') : t('auth.reset.submit')}
        accessibilityState={{ busy: loading, disabled: loading }}
        onPress={step === 'email' ? sendCode : submit}
        disabled={loading}
        style={[styles.submitBtn, { backgroundColor: theme.colors.primaryLime }, loading && styles.submitBtnDisabled]}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.limeText} size="small" />
        ) : (
          <Text style={[styles.submitBtnText, { color: theme.colors.limeText }]}>
            {step === 'email' ? t('auth.reset.sendCode') : t('auth.reset.submit')}
          </Text>
        )}
      </Pressable>

      {step === 'code' ? (
        <TouchableOpacity style={styles.linkBtn} onPress={resend} disabled={loading} activeOpacity={0.7} accessibilityRole="button">
          <Text style={[styles.linkText, { color: theme.colors.primaryAccessible }]}>{t('auth.reset.resend')}</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity style={styles.linkBtn} onPress={onBackToSignIn} activeOpacity={0.7} accessibilityRole="button">
        <Text style={[styles.linkText, { color: theme.colors.textSecondary }]}>{t('auth.reset.backToSignIn')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  subheading: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
  banner: { marginBottom: 16 },
  eyeBtn: { minHeight: 44, minWidth: 44, paddingHorizontal: 8, paddingVertical: 4, justifyContent: 'center' },
  eyeText: { fontSize: 12, fontWeight: '600' },
  submitBtn: { height: 50, borderRadius: commonRadii.pill, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  linkBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontSize: 13, fontWeight: '700' },
});
