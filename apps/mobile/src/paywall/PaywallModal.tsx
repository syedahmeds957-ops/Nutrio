import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
  reason?: 'quota_exceeded' | 'feature_gate';
  onSubscribe: (pricing: PlanPricing, provider: PaymentProvider) => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  reason = 'quota_exceeded',
  onSubscribe,
}) => {
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
    <Modal
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
                <Text style={styles.premiumBadgeText}>NUTRIO PREMIUM</Text>
              </View>
              <Text style={styles.headline}>
                {reason === 'quota_exceeded'
                  ? 'Daily Free Limit Reached'
                  : 'Upgrade to Unlimited'}
              </Text>
              <Text style={styles.subheadline}>
                {reason === 'quota_exceeded'
                  ? "You've used your 3 free photo scans for today. Upgrade for unlimited scans and 24/7 AI coaching."
                  : 'Unlock the full power of Pakistan-first adaptive nutrition and coaching.'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollPad}>
            {/* Currency Switcher */}
            <View style={styles.currencyRow}>
              <Text style={styles.currencyLabel}>Currency:</Text>
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
                      {curr === 'PKR' ? '🇵🇰 PKR (Pakistan)' : '🌐 USD (Global)'}
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
                  <Text style={styles.saveTagText}>BEST VALUE · 42% OFF</Text>
                </View>
                <Text style={styles.periodTitle}>Annual Plan</Text>
                <Text style={styles.periodPrice}>
                  {PRICING_TIERS[currency].annual.displayPrice}
                </Text>
                <Text style={styles.periodSavings}>
                  {PRICING_TIERS[currency].annual.savingsNote}
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
                <Text style={styles.periodTitle}>Monthly Plan</Text>
                <Text style={styles.periodPrice}>
                  {PRICING_TIERS[currency].monthly.displayPrice}
                </Text>
                <Text style={styles.periodSavings}>Cancel anytime</Text>
              </TouchableOpacity>
            </View>

            {/* Premium Features List */}
            <Text style={styles.sectionHeading}>What You Unlock</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>📷</Text>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>Unlimited Photo Calorie Scans</Text>
                  <Text style={styles.featureDesc}>
                    Scan entire multi-item plates with AI portion breakdown and confidence bands.
                  </Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>🧑‍⚕️</Text>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>24/7 AI Nutritionist Coach</Text>
                  <Text style={styles.featureDesc}>
                    Conversational advice in Roman Urdu & English for dawats, shaadi dinners, and chai.
                  </Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>⚖️</Text>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>Closed-Loop Adaptive TDEE</Text>
                  <Text style={styles.featureDesc}>
                    Weekly metabolic recalibration that adapts targets to your real weight change.
                  </Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>🍽️</Text>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureTitle}>Cultural Meal Plans & Swaps</Text>
                  <Text style={styles.featureDesc}>
                    Family handi mode, 1-tap macro swaps, and weekly bazaar grocery lists.
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.sectionHeading}>Payment Method</Text>
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
                    <Text style={styles.providerText}>🔴 JazzCash</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.providerChip,
                      selectedProvider === 'easypaisa' && styles.providerChipActive,
                    ]}
                    onPress={() => setSelectedProvider('easypaisa')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.providerText}>🟢 Easypaisa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.providerChip,
                      selectedProvider === 'card' && styles.providerChipActive,
                    ]}
                    onPress={() => setSelectedProvider('card')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.providerText}>💳 Debit/Credit</Text>
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
                    <Text style={styles.providerText}>💳 Credit Card</Text>
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
                    <Text style={styles.providerText}>🍎 In-App Purchase</Text>
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
                Unlock Nutrio Premium ({pricing.displayPrice})
              </Text>
            </TouchableOpacity>

            <Text style={styles.guaranteeText}>
              🛡️ No risk · Cancel anytime in 1 tap · ZDR health data privacy
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingTop: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  premiumBadge: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 6,
  },
  premiumBadgeText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headline: {
    color: '#1E293B',
    fontSize: 20,
    fontWeight: '800',
  },
  subheadline: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#64748B',
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
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  currencyPills: {
    flexDirection: 'row',
    gap: 6,
  },
  currPill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  currPillText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  currPillTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  periodCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodCardActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  saveTag: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  saveTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  periodTitle: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
  },
  periodPrice: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  periodSavings: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeading: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuresList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  featureDesc: {
    color: '#64748B',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  providerChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  providerText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
  },
  subscribeBtn: {
    backgroundColor: '#10B981',
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 3,
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  guaranteeText: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});
