import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';
import { Icon } from '../../ui/Icon.js';

interface GuestAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
}

export const GuestAuthModal: React.FC<GuestAuthModalProps> = ({
  visible,
  onClose,
  onSignIn,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const isSaudi = activeRegion === 'SA';
  const accentColor = theme.colors.primaryLime;
  const accentTextColor = '#0A0B0D';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {/* Header Icon */}
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isDark ? '#16191E' : '#EDF8D3',
                    borderColor: accentColor,
                  },
                ]}
              >
                <Icon name="shield" size={28} color={isDark ? accentColor : '#4B6200'} />
              </View>

              {/* Title & Description */}
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                {isSaudi ? 'تسجيل الدخول لحفظ تقدمك' : 'Sign In to Save Progress'}
              </Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {isSaudi
                  ? 'أنت تستكشف تطبيق Nutrio كضيف. يرجى إنشاء حساب أو تسجيل الدخول لتسجيل الوجبات وتتبع السعرات والماكروز وحفظ خطتك.'
                  : 'You are exploring Nutrio as a guest. Create an account or sign in to log your daily meals, track your macros, and save your progress.'}
              </Text>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: accentColor }]}
                  onPress={onSignIn}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Sign In or Register"
                >
                  <Text style={[styles.primaryBtnText, { color: accentTextColor }]}>
                    {isSaudi ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Continue Exploring"
                >
                  <Text style={[styles.secondaryBtnText, { color: theme.colors.textSecondary }]}>
                    {isSaudi ? 'متابعة الاستكشاف كضيف' : 'Continue Exploring as Guest'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.35)',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
