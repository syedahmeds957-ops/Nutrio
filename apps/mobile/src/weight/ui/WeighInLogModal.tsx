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
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Log Body Weight</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={[styles.closeBtn, { color: theme.colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.description, { color: theme.colors.textMuted }]}>
            Weigh yourself under consistent conditions (ideally in the morning, fasted, after using the restroom).
          </Text>

          {/* Stepper & Input */}
          <View style={styles.inputContainer}>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleAdjust(-0.5)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepBtnText}>−0.5</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleAdjust(-0.1)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepBtnText}>−0.1</Text>
              </TouchableOpacity>

              <View style={styles.valueBox}>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={(val) => {
                    setWeight(val);
                    setError(null);
                  }}
                  selectTextOnFocus
                />
                <Text style={styles.unitText}>kg</Text>
              </View>

              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleAdjust(0.1)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepBtnText}>+0.1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => handleAdjust(0.5)}
                activeOpacity={0.7}
              >
                <Text style={styles.stepBtnText}>+0.5</Text>
              </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          {/* Optional Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. After dawat, salt retention, morning fasted"
              placeholderTextColor="#64748B"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Save Action */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Text style={styles.saveBtnText}>Save Weigh-in</Text>
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    color: '#1E293B',
  },
  closeBtn: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: '#64748B',
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
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepBtnText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  valueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#D4FF00',
    minWidth: 120,
    justifyContent: 'center',
  },
  input: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0A0B0D',
    textAlign: 'center',
    minWidth: 70,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#1E293B',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#D4FF00',
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#0A0B0D',
    fontSize: 16,
    fontWeight: '800',
  },
});
