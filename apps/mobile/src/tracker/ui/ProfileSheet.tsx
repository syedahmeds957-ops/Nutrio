import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NamedModal } from '../../ui/NamedModal.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection, useI18nState } from '../../i18n/index.js';
import type { LanguagePreference } from '../../i18n/languages.js';
import { Icon, IconName } from '../../ui/Icon.js';
import { styles } from './TrackerDashboardScreen.styles.js';

const ACCENT_TEXT = '#0A0B0D';
// Red text for Log out, lightened on dark (#EF4444 is 4.05:1 on the tinted button) and darkened on light.
const LOGOUT_RED_LIGHT = '#B91C1C';
const LOGOUT_RED_DARK = '#F87171';

export interface ProfileSheetProps {
  visible: boolean;
  /** Owned by the dashboard, which opens the sheet from its header. */
  fade: Animated.Value;
  slide: Animated.Value;
  /** Animates the sheet away, then runs `then` (an action the user picked). */
  onClose: (then?: () => void) => void;
  userName: string;
  targets: { targetCalories: number; targetProteinGrams: number; targetWaterMl?: number };
  isGuest: boolean;
  onOpenSurvey?: () => void;
  onOpenMealPlan?: () => void;
  onOpenWeeklyCheckIn?: () => void;
  onRequireAuth?: () => void;
  onLogout?: () => void;
}

/** One navigation row in the sheet; the sheet closes before the action runs. */
const ProfileAction: React.FC<{
  icon: IconName;
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => {
  const { theme } = useTheme();
  const dir = useTextDirection();
  return (
    <TouchableOpacity
      style={[
        styles.profileActionBtn,
        { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.actionBtnRow}>
        <Icon name={icon} size={16} color={theme.colors.primaryLime} />
        <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>{label}</Text>
      </View>
      <Icon name={dir.isRTL ? 'arrow-left' : 'arrow-right'} size={14} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
};

/** The dashboard's profile and settings drawer. */
export const ProfileSheet: React.FC<ProfileSheetProps> = ({
  visible,
  fade,
  slide,
  onClose,
  userName,
  targets,
  isGuest,
  onOpenSurvey,
  onOpenMealPlan,
  onOpenWeeklyCheckIn,
  onRequireAuth,
  onLogout,
}) => {
  const { theme, mode, setMode, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const { languagePreference, setLanguagePreference } = useI18nState();
  const accentColor = theme.colors.primaryLime;

  const themeChoice = (choice: 'dark' | 'light', label: string) => (
    <TouchableOpacity
      style={[styles.themeChoiceBtn, mode === choice && { backgroundColor: accentColor }]}
      onPress={() => setMode(choice)}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.themeChoiceText,
          { color: mode === choice ? ACCENT_TEXT : theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const languageChoice = (choice: LanguagePreference, label: string) => (
    <TouchableOpacity
      style={[styles.themeChoiceBtn, languagePreference === choice && { backgroundColor: accentColor }]}
      onPress={() => setLanguagePreference(choice)}
      activeOpacity={0.8}
      accessibilityRole="radio"
      aria-checked={languagePreference === choice}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.themeChoiceText,
          { color: languagePreference === choice ? ACCENT_TEXT : theme.colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const stat = (label: string, value: string) => (
    <View style={styles.profileStatItem}>
      <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{value}</Text>
    </View>
  );
  const divider = <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />;

  return (
    <NamedModal accessibilityName={t('a11y.dialog.profile')} visible={visible} transparent={true} animationType="none" onRequestClose={() => onClose()}>
      <Animated.View style={[styles.profileOverlay, { opacity: fade }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => onClose()} activeOpacity={1} />
        <Animated.View
          style={[
            styles.profileSheet,
            { backgroundColor: theme.colors.surface, transform: [{ translateY: slide }] },
          ]}
        >
          {/* Sheet Handle */}
          <View style={[styles.sheetHandle, { backgroundColor: theme.colors.border }]} />

          <View style={styles.profileHeaderRow}>
            <View style={[styles.profileAvatarLarge, { backgroundColor: accentColor }]}>
              <Text style={[styles.profileAvatarLargeText, { color: ACCENT_TEXT }]}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileNameLarge, { color: theme.colors.textPrimary }]}>
                {userName}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.colors.textMuted }]}>
                {t(`tracker.dashboard.planBlurb.${activeRegion}`)}
              </Text>
            </View>
            <TouchableOpacity style={styles.profileCloseBtn} onPress={() => onClose()} activeOpacity={0.7}>
              <Icon name="x" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Theme Switcher */}
          <View
            style={[
              styles.themeSettingCard,
              { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.themeSettingTitle, dir.text, { color: theme.colors.textPrimary }]}>
              {t('tracker.dashboard.appearance')}
            </Text>
            <View style={styles.themeToggleRow}>
              {themeChoice('dark', t('tracker.dashboard.darkMode'))}
              {themeChoice('light', t('tracker.dashboard.lightMode'))}
            </View>
          </View>

          <View
            style={[
              styles.themeSettingCard,
              { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.themeSettingTitle, dir.text, { color: theme.colors.textPrimary }]}>
              {t('tracker.dashboard.language')}
            </Text>
            <View style={styles.themeToggleRow}>
              {languageChoice('auto', t('tracker.dashboard.languageAuto'))}
              {languageChoice('en', 'English')}
              {languageChoice('ar', 'العربية')}
            </View>
          </View>

          {/* Target Summary Stats */}
          <View
            style={[
              styles.profileStatsCard,
              { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
            ]}
          >
            {stat(t('tracker.dashboard.dailyTarget'), t('common.kcalValue', { value: targets.targetCalories }))}
            {divider}
            {stat(t('common.protein'), `${targets.targetProteinGrams}g`)}
            {divider}
            {stat(t('tracker.dashboard.waterGoal'), t('common.mlValue', { value: targets.targetWaterMl || 3000 }))}
          </View>

          {/* Action Buttons */}
          <View style={styles.profileActions}>
            {onOpenSurvey && (
              <ProfileAction
                icon="survey"
                label={t('tracker.dashboard.retakeSurvey')}
                onPress={() => onClose(onOpenSurvey)}
              />
            )}
            {onOpenMealPlan && (
              <ProfileAction
                icon="utensils"
                label={t('tracker.dashboard.viewMealPlan')}
                onPress={() => onClose(onOpenMealPlan)}
              />
            )}
            {onOpenWeeklyCheckIn && !isGuest && (
              <ProfileAction
                icon="calendar"
                label={t('tracker.dashboard.weeklyCheckIn')}
                onPress={() => onClose(onOpenWeeklyCheckIn)}
              />
            )}

            {isGuest && onRequireAuth && (
              <TouchableOpacity
                style={[styles.profileActionBtn, { backgroundColor: accentColor, borderColor: accentColor }]}
                onPress={() => onClose(onRequireAuth)}
                activeOpacity={0.8}
              >
                <View style={styles.actionBtnRow}>
                  <Icon name="shield" size={16} color={ACCENT_TEXT} />
                  <Text style={[styles.actionBtnText, { color: ACCENT_TEXT, fontWeight: '800' }]}>
                    {t('tracker.dashboard.signInCreate')}
                  </Text>
                </View>
                <Icon name={dir.isRTL ? 'arrow-left' : 'arrow-right'} size={14} color={ACCENT_TEXT} />
              </TouchableOpacity>
            )}

            {onLogout && (
              <TouchableOpacity
                style={[
                  styles.profileActionBtn,
                  styles.logoutBtn,
                  isDark && { backgroundColor: 'rgba(239, 68, 68, 0.14)', borderColor: 'rgba(239, 68, 68, 0.35)' },
                ]}
                onPress={() => onClose(onLogout)}
                activeOpacity={0.7}
              >
                <View style={styles.actionBtnRow}>
                  <Icon name={dir.isRTL ? 'arrow-right' : 'arrow-left'} size={16} color={isDark ? LOGOUT_RED_DARK : LOGOUT_RED_LIGHT} />
                  <Text style={[styles.actionBtnText, { color: isDark ? LOGOUT_RED_DARK : LOGOUT_RED_LIGHT }]}>
                    {t('tracker.dashboard.logout')}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </NamedModal>
  );
};
