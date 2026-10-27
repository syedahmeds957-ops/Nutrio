import React, { useMemo, useState } from 'react';
import { Icon } from '../ui/Icon.js';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NamedModal } from '../ui/NamedModal.js';
import { useTranslation } from '../i18n/index.js';
import { ThemeColors, useTheme } from '../theme.js';
import {
  BillingPeriod,
  Currency,
  PaymentProvider,
  PlanPricing,
  PRICING_TIERS,
} from './types.js';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: (pricing: PlanPricing, provider: PaymentProvider) => void;
}

/** "6,999" or "49.99": the amount only; currency and period come from the translated line. */
const formatPrice = (pricing: PlanPricing) =>
  `${pricing.currency === 'PKR' ? 'PKR ' : '$'}${pricing.priceAmount.toLocaleString('en-US')}`;

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onSubscribe,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme]);
  const [currency, setCurrency] = useState<Currency>('PKR');
  const [period, setPeriod] = useState<BillingPeriod>('annual');
  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProvider>('jazzcash');

  const pricing = PRICING_TIERS[currency][period];

  const handleConfirm = () => {
    onSubscribe(pricing, selectedProvider);
    onClose();
  };

  return (
    <NamedModal accessibilityName={t('paywall.headline')}
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>{t('paywall.badge')}</Text>
              </View>
              <Text style={styles.headline}>
                {t('paywall.headline')}
              </Text>
              <Text style={styles.subheadline}>
                {t('paywall.subheadline')}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Icon name="x" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollPad}>
            {/* Currency Switcher */}
            <View style={styles.currencyRow}>
              <Text style={styles.currencyLabel}>{t('paywall.currencyLabel')}</Text>
              <View style={styles.currencyPills}>
                {(['PKR', 'USD'] as const).map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    style={[
                      styles.currPill,
                      currency === curr && styles.currPillActive,
                    ]}
                    onPress={() => {
                      setCurrency(curr);
                      if (curr === 'USD') setSelectedProvider('card');
                      else setSelectedProvider('jazzcash');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.currPillText,
                        currency === curr && styles.currPillTextActive,
                      ]}
                    >
                      {t(`paywall.currency.${curr}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Plan Toggle (Annual vs Monthly) */}
            <View style={styles.periodRow}>
              <TouchableOpacity
                style={[
                  styles.periodCard,
                  period === 'annual' && styles.periodCardActive,
                ]}
                onPress={() => setPeriod('annual')}
                activeOpacity={0.7}
              >
                <View style={styles.saveTag}>
                  <Text style={styles.saveTagText}>{t('paywall.bestValue')}</Text>
                </View>
                <Text style={styles.periodTitle}>{t('paywall.annualPlan')}</Text>
                <Text style={styles.periodPrice}>
                  {t('paywall.priceYear', { amount: formatPrice(PRICING_TIERS[currency].annual) })}
                </Text>
                <Text style={styles.periodSavings}>
                  {t(`paywall.annualSavings.${currency}`)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodCard,
                  period === 'monthly' && styles.periodCardActive,
                ]}
                onPress={() => setPeriod('monthly')}
                activeOpacity={0.7}
              >
                <Text style={styles.periodTitle}>{t('paywall.monthlyPlan')}</Text>
                <Text style={styles.periodPrice}>
                  {t('paywall.priceMonth', { amount: formatPrice(PRICING_TIERS[currency].monthly) })}
                </Text>
                <Text style={styles.periodSavings}>{t('paywall.cancelAnytime')}</Text>
              </TouchableOpacity>
            </View>

            {/* Premium Features List */}
            <Text style={styles.sectionHeading}>{t('paywall.whatYouUnlock')}</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Icon name="coach" size={20} color={theme.colors.textPrimary} style={styles.featureIcon} />
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>{t('paywall.feature.coach.title')}</Text>
                  <Text style={styles.featureDesc}>{t('paywall.feature.coach.desc')}</Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <Icon name="scale" size={20} color={theme.colors.textPrimary} style={styles.featureIcon} />
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>{t('paywall.feature.adaptive.title')}</Text>
                  <Text style={styles.featureDesc}>{t('paywall.feature.adaptive.desc')}</Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <Icon name="utensils" size={20} color={theme.colors.textPrimary} style={styles.featureIcon} />
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>{t('paywall.feature.plans.title')}</Text>
                  <Text style={styles.featureDesc}>{t('paywall.feature.plans.desc')}</Text>
                </View>
              </View>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.sectionHeading}>{t('paywall.paymentMethod')}</Text>
            <View style={styles.providerRow}>
              {currency === 'PKR' ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.providerChip,
                      selectedProvider === 'jazzcash' && styles.providerChipActive,
                    ]}
                    onPress={() => setSelectedProvider('jazzcash')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.providerText}>{t('paywall.provider.jazzcash')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.providerChip,
                      selectedProvider === 'easypaisa' && styles.providerChipActive,
                    ]}
                    onPress={() => setSelectedProvider('easypaisa')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.providerText}>{t('paywall.provider.easypaisa')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.providerChip,
                      selectedProvider === 'card' && styles.providerChipActive,
                    ]}
                    onPress={() => setSelectedProvider('card')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.providerText}>{t('paywall.provider.debitCredit')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.providerChip,
                      selectedProvider === 'card' && styles.providerChipActive,
                    ]}
                    onPress={() => setSelectedProvider('card')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.providerText}>{t('paywall.provider.creditCard')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.providerChip,
                      selectedProvider === 'in_app_purchase' &&
                        styles.providerChipActive,
                    ]}
                    onPress={() => setSelectedProvider('in_app_purchase')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.providerText}>{t('paywall.provider.inApp')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Subscribe CTA */}
            <TouchableOpacity
              style={styles.subscribeBtn}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.subscribeBtnText}>
                {t('paywall.subscribe', { price: t(period === 'annual' ? 'paywall.priceYear' : 'paywall.priceMonth', { amount: formatPrice(pricing) }) })}
              </Text>
            </TouchableOpacity>

            <Text style={styles.guaranteeText}>
              {t('paywall.guarantee')}
            </Text>
          </ScrollView>
        </View>
      </View>
    </NamedModal>
  );
};

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      maxHeight: '90%',
      paddingTop: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerLeft: {
      flex: 1,
      marginEnd: 10,
    },
    premiumBadge: {
      backgroundColor: c.warningLight,
      alignSelf: 'flex-start',
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: c.warning,
      marginBottom: 6,
    },
    premiumBadgeText: {
      color: c.fatText,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    headline: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: '800',
    },
    subheadline: {
      color: c.textSecondary,
      fontSize: 12,
      marginTop: 4,
      lineHeight: 16,
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtnText: {
      color: c.textSecondary,
      fontSize: 16,
      fontWeight: '700',
    },
    scrollList: {
      paddingHorizontal: 16,
    },
    scrollPad: {
      paddingVertical: 14,
      gap: 14,
    },
    currencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    currencyLabel: {
      color: c.textPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
    currencyPills: {
      flexDirection: 'row',
      gap: 6,
    },
    currPill: {
      backgroundColor: c.surfaceSecondary,
      borderRadius: 9999,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    currPillActive: {
      backgroundColor: c.successLight,
      borderColor: c.success,
    },
    currPillText: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: '600',
    },
    currPillTextActive: {
      color: c.successText,
      fontWeight: '700',
    },
    periodRow: {
      flexDirection: 'row',
      gap: 10,
    },
    periodCard: {
      flex: 1,
      backgroundColor: c.surfaceSecondary,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    periodCardActive: {
      backgroundColor: c.successLight,
      borderColor: c.success,
    },
    saveTag: {
      backgroundColor: c.success,
      borderRadius: 6,
      paddingVertical: 2,
      paddingHorizontal: 6,
      alignSelf: 'flex-start',
      marginBottom: 6,
    },
    saveTagText: {
      color: c.textInverse,
      fontSize: 9,
      fontWeight: '800',
    },
    periodTitle: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '700',
    },
    periodPrice: {
      color: c.successText,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 4,
    },
    periodSavings: {
      color: c.textSecondary,
      fontSize: 11,
      marginTop: 2,
    },
    sectionHeading: {
      color: c.textPrimary,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    featuresList: {
      backgroundColor: c.surfaceSecondary,
      borderRadius: 20,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    featureIcon: {
      marginTop: 1,
    },
    featureTextCol: {
      flex: 1,
    },
    featureTitle: {
      color: c.textPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
    featureDesc: {
      color: c.textSecondary,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 2,
    },
    providerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    providerChip: {
      backgroundColor: c.surfaceSecondary,
      borderRadius: 9999,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    providerChipActive: {
      backgroundColor: c.successLight,
      borderColor: c.success,
    },
    providerText: {
      color: c.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    subscribeBtn: {
      backgroundColor: c.success,
      borderRadius: 9999,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
      boxShadow: '0px 6px 14px rgba(16, 185, 129, 0.15)',
    },
    subscribeBtnText: {
      color: c.textInverse,
      fontSize: 14,
      fontWeight: '800',
    },
    guaranteeText: {
      color: c.textSecondary,
      fontSize: 10,
      textAlign: 'center',
      marginTop: 2,
    },
  });
