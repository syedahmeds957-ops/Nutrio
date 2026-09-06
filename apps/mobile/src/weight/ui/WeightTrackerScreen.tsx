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
import { WeightTrackerState } from '../types.js';
import { useTheme } from '../../theme.js';

interface WeightTrackerScreenProps {
  initialState: WeightTrackerState;
  onBackToTracker?: () => void;
}

export const WeightTrackerScreen: React.FC<WeightTrackerScreenProps> = ({
  initialState,
  onBackToTracker,
}) => {
  const { theme, isDark } = useTheme();
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
    forceUpdate();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollPad}>
        {/* Top Header */}
        <View style={styles.topNav}>
          <View>
            <Text style={[styles.headerSubtitle, { color: isDark ? '#D4FF00' : '#16A34A' }]}>Metabolic Feedback</Text>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Weight & Adaptive TDEE</Text>
          </View>
          {onBackToTracker && (
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: isDark ? '#272A33' : '#FFFFFF', borderColor: theme.colors.border }]}
              onPress={onBackToTracker}
              activeOpacity={0.7}
            >
              <Text style={[styles.backBtnText, { color: theme.colors.text }]}>Daily Tracker</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Log Action */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.logWeightBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.logWeightBtnText}>⚖️ Log Today's Weight</Text>
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
    backgroundColor: '#F6F8F6',
  },
  container: {
    flex: 1,
  },
  scrollPad: {
    paddingBottom: 48,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerSubtitle: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: '#1E293B',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  backBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtnText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  logWeightBtn: {
    backgroundColor: '#D4FF00',
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logWeightBtnText: {
    color: '#0A0B0D',
    fontSize: 15,
    fontWeight: '800',
  },
});
