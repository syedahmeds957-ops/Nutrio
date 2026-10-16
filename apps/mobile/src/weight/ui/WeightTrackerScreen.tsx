import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { WeightTrendChartCard } from './WeightTrendChartCard.js';
import { AdaptiveTDEECard } from './AdaptiveTDEECard.js';
import { WeighInLogModal } from './WeighInLogModal.js';
import { WeightTrendEngine } from '../engine.js';
import { saveWeighIns } from '../weightStorage.js';
import { WeightTrackerState } from '../types.js';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';

interface WeightTrackerScreenProps {
  initialState: WeightTrackerState;
  onBackToTracker?: () => void;
}

export const WeightTrackerScreen: React.FC<WeightTrackerScreenProps> = ({
  initialState,
  onBackToTracker,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const accentTextColor = theme.colors.limeText;

  const [engine] = useState(() => new WeightTrendEngine(initialState));
  const [, setRerender] = useState(0);
  const forceUpdate = () => setRerender((prev) => prev + 1);

  const [modalVisible, setModalVisible] = useState(false);
  const [spikeWarning, setSpikeWarning] = useState<string | undefined>(undefined);

  const summary = engine.getSummary();

  const handleSaveWeight = (weightKg: number, date?: string, notes?: string) => {
    const spike = engine.checkSpikeWarning(weightKg);
    setSpikeWarning(spike.hasSpike ? spike.message : undefined);
    engine.logWeighIn(weightKg, date, notes);
    // Persisted immediately. Without this the engine lived only in component
    // state, so every weigh-in was lost the moment the screen unmounted.
    saveWeighIns(engine.getWeighIns());
    forceUpdate();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollPad}>
        {/* Top Header: Back first, where every other screen puts it */}
        <View style={styles.topNav}>
          {onBackToTracker && (
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
              onPress={onBackToTracker}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Icon name={dir.isRTL ? 'arrow-right' : 'arrow-left'} size={14} color={theme.colors.textPrimary} />
              <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>
                {t('common.back')}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.headerSubtitle, dir.text, { color: accentColor }]}>
            {t('weight.screen.eyebrow')}
          </Text>
          <Text style={[styles.headerTitle, dir.text, { color: theme.colors.textPrimary }]}>
            {t('weight.screen.title')}
          </Text>
        </View>

        {/* Action Button: Log Today's Weight */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.logWeightBtn, { backgroundColor: accentColor }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.logWeightBtnText, { color: accentTextColor }]}>
              + {t('weight.screen.logTodayWeight')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weight Trend Chart Card */}
        <WeightTrendChartCard
          summary={summary}
          spikeWarning={spikeWarning}
        />

        {/* Adaptive TDEE Closed-Loop Card */}
        <AdaptiveTDEECard
          adaptiveResult={summary.adaptiveTDEE}
          formulaTDEE={initialState.formulaTDEE}
        />
      </ScrollView>

      {/* Log Modal */}
      <WeighInLogModal
        visible={modalVisible}
        initialWeightKg={summary.currentWeightKg || 75.0}
        onClose={() => setModalVisible(false)}
        onSaveWeight={handleSaveWeight}
      />
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
  scrollPad: {
    paddingBottom: 48,
  },
  topNav: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  logWeightBtn: {
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
  },
  logWeightBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
