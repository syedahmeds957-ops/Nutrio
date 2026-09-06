import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';

interface HomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onExploreGuest?: () => void;
}

const FEATURES = [
  {
    icon: 'camera' as const,
    title: 'AI Meal Photo Scanner',
    desc: 'Snap a picture of your plate to instantly detect portions, roti count, and calories with zero hallucination.',
    badge: '100% Free',
  },
  {
    icon: 'utensils' as const,
    title: '60+ Verified Restaurant Brands',
    desc: 'Calibrated for OPTP, Aylanto, Subway, KFC, Hardee’s, Kababjees, and authentic desi staples.',
    badge: 'All Unlocked',
  },
  {
    icon: 'coach' as const,
    title: 'Context-Aware AI Coach',
    desc: 'Get personalized clinical guidance to handle shaadi dinners, dawats, and late-night cravings.',
    badge: 'Unlimited',
  },
  {
    icon: 'scale' as const,
    title: 'Adaptive Metabolic TDEE',
    desc: 'Closed-loop metabolic recalibration dynamically tunes daily calories based on your 7-day weight trend.',
    badge: 'Smart Pace',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onGetStarted,
  onLogin,
  onExploreGuest,
}) => {
  const { theme, mode, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Brand & Theme Switcher Bar */}
        <View style={styles.navBar}>
          <View style={styles.brandRow}>
            <View style={[styles.logoBadge, { backgroundColor: theme.colors.primaryLime }]}>
              <Text style={styles.logoBadgeText}>N</Text>
            </View>
            <View>
              <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>Nutrio</Text>
              <Text style={[styles.brandTagline, { color: theme.colors.textMuted }]}>
                Nutrition Intelligence
              </Text>
            </View>
          </View>

          <View style={styles.navActionRow}>
            {/* Theme Switcher Toggle */}
            <TouchableOpacity
              style={[
                styles.themeToggleBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <Text style={[styles.themeToggleText, { color: theme.colors.textPrimary }]}>
                {mode === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navLoginBtn,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={onLogin}
              activeOpacity={0.7}
            >
              <Text style={[styles.navLoginText, { color: theme.colors.textPrimary }]}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Solid Lime Hero Card (Revolut / Ronasit Style) */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.colors.heroCardBg, // Solid Lime #A4EB3F
              borderColor: theme.colors.primaryLime,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.freeBadgePill}>
              <Text style={styles.freeBadgeText}>100% Free • All Features</Text>
            </View>
            <View style={styles.proActiveDot} />
          </View>

          <Text style={[styles.heroHeading, { color: theme.colors.limeText }]}>
            Eat Desi, Stay Lean.
          </Text>

          <Text style={[styles.heroSubtitle, { color: theme.colors.limeText }]}>
            Calibrated for Biryani, Karahi, and Roti. Take control of your daily macros with precision
            portion vision and authentic nutrition science.
          </Text>

          {/* Quick Metrics Preview Row */}
          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricValue}>60+</Text>
              <Text style={styles.heroMetricLabel}>Brands Unlocked</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricValue}>2,700+</Text>
              <Text style={styles.heroMetricLabel}>Verified Foods</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricValue}>0</Text>
              <Text style={styles.heroMetricLabel}>Paywalls</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Section */}
        <View
          style={[
            styles.actionCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primaryLime }]}
            onPress={onGetStarted}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryBtnText, { color: theme.colors.limeText }]}>
              Start Biometric Assessment →
            </Text>
          </TouchableOpacity>

          {onExploreGuest && (
            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={onExploreGuest}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.colors.textPrimary }]}>
                Explore Active Dashboard
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Features List Section */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Engineered for Real Pakistani Lives
          </Text>

          <View style={styles.featureList}>
            {FEATURES.map((feat, idx) => (
              <View
                key={idx}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.featureIconContainer,
                    { backgroundColor: theme.colors.surfaceSecondary },
                  ]}
                >
                  <Icon name={feat.icon} size={22} color={theme.colors.primaryLime} />
                </View>

                <View style={styles.featureTextCol}>
                  <View style={styles.featureHeaderRow}>
                    <Text style={[styles.featureTitle, { color: theme.colors.textPrimary }]}>
                      {feat.title}
                    </Text>
                    <View
                      style={[
                        styles.featureBadge,
                        {
                          backgroundColor: theme.isDark ? '#262A12' : '#F4FED0',
                          borderColor: theme.colors.primaryLime,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.featureBadgeText,
                          { color: theme.isDark ? theme.colors.primaryLime : '#465A00' },
                        ]}
                      >
                        {feat.badge}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>
                    {feat.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0A0B0D',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  navActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  navLoginBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
  },
  navLoginText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 26,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  freeBadgePill: {
    backgroundColor: '#0A0B0D',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  freeBadgeText: {
    color: '#A4EB3F',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  proActiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0A0B0D',
  },
  heroHeading: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 20,
    opacity: 0.88,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 11, 13, 0.08)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  heroMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A0B0D',
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0A0B0D',
    opacity: 0.75,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  heroMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(10, 11, 13, 0.15)',
  },
  actionCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 24,
  },
  primaryBtn: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  featuresSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  featureList: {
    gap: 10,
  },
  featureCard: {
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderWidth: 1,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextCol: {
    flex: 1,
  },
  featureHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  featureBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
