import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../theme.js';

interface WeighInLogModalProps {
  visible: boolean;
  initialWeightKg: number;
  onClose: () => void;
  onSaveWeight: (weightKg: number, date?: string, notes?: string) => void;
}

export const WeighInLogModal: React.FC<WeighInLogModalProps> = ({
  visible,
  initialWeightKg,
  onClose,
  onSaveWeight,
}) => {
  const { theme, isDark } = useTheme();
  const [weight, setWeight] = useState<string>(
    initialWeightKg > 0 ? String(initialWeightKg) : '75.0'
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const parsed = parseFloat(weight);

  const handleAdjust = (delta: number) => {
    const current = isNaN(parsed) ? 75.0 : parsed;
    const updated = Math.max(25, Number((current + delta).toFixed(1)));
    setWeight(String(updated));
    setError(null);
  };

  const handleSave = () => {
    if (isNaN(parsed) || parsed < 25 || parsed > 300) {
      setError('Please enter a realistic weight between 25 kg and 300 kg.');
      return;
    }
    onSaveWeight(parsed, undefined, notes.trim() || undefined);
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Log Body Weight
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={[styles.closeBtn, { color: theme.colors.textMuted }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Weigh yourself under consistent conditions (ideally in the morning, fasted, after using the restroom).
          </Text>

          {/* Stepper & Input */}
          <View style={styles.inputContainer}>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={[
                  styles.stepBtn,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => handleAdjust(-0.5)}
                activeOpacity={0.7}
              >
                <Text style={[styles.stepBtnText, { color: theme.colors.textPrimary }]}>
                  −0.5
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.stepBtn,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => handleAdjust(-0.1)}
                activeOpacity={0.7}
              >
                <Text style={[styles.stepBtnText, { color: theme.colors.textPrimary }]}>
                  −0.1
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.valueBox,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.primaryLime,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: isDark ? theme.colors.primaryLime : theme.colors.textPrimary,
                    },
                  ]}
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={(val) => {
                    setWeight(val);
                    setError(null);
                  }}
                  selectTextOnFocus
                />
                <Text style={[styles.unitText, { color: theme.colors.textMuted }]}>
                  kg
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.stepBtn,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => handleAdjust(0.1)}
                activeOpacity={0.7}
              >
                <Text style={[styles.stepBtnText, { color: theme.colors.textPrimary }]}>
                  +0.1
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.stepBtn,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => handleAdjust(0.5)}
                activeOpacity={0.7}
              >
                <Text style={[styles.stepBtnText, { color: theme.colors.textPrimary }]}>
                  +0.5
                </Text>
              </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          {/* Optional Notes */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.colors.textPrimary }]}>
              Notes (Optional)
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: theme.colors.surfaceSecondary,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                },
              ]}
              placeholder="e.g. After dawat, salt retention, morning fasted"
              placeholderTextColor={theme.colors.textMuted}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Save Action */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: theme.colors.primaryLime },
            ]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveBtnText, { color: theme.colors.limeText }]}>
              Save Weigh-in
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  stepBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  valueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    minWidth: 120,
    justifyContent: 'center',
  },
  input: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    minWidth: 70,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  saveBtn: {
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
