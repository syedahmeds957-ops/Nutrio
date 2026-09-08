import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme.js';

interface PortionStepperProps {
  quantity: number;
  unitLabel: string;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
}

export const PortionStepper: React.FC<PortionStepperProps> = ({
  quantity,
  unitLabel,
  onIncrement,
  onDecrement,
  disabled = false,
}) => {
  return (
    <View style={styles.stepperPill}>
      <TouchableOpacity
        style={[styles.stepBtn, disabled && styles.disabledBtn]}
        onPress={onDecrement}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>

      <Text style={styles.quantityText} numberOfLines={1}>
        {quantity} {unitLabel}
      </Text>

      <TouchableOpacity
        style={[styles.stepBtn, disabled && styles.disabledBtn]}
        onPress={onIncrement}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    borderRadius: theme.radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#C2E7CB',
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    backgroundColor: theme.colors.textMuted,
    opacity: 0.5,
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginHorizontal: 10,
    maxWidth: 140,
  },
});
