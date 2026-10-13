import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TextInputProps,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../theme.js';
import { Icon, IconName } from './Icon.js';

// Global web outline suppressor for React Native Web
// react-native-web accepts the CSS value 'none' for outlineStyle; React Native's
// own types only list the native border styles, hence the one narrow cast.
export const noOutlineStyle: ViewStyle = Platform.select<ViewStyle>({
  web: {
    outlineStyle: 'none' as ViewStyle['outlineStyle'],
    outlineWidth: 0,
    outlineColor: 'transparent',
    boxShadow: 'none',
  },
  default: {},
});

/* -------------------------------------------------------------------------- */
/* 1. AppleGroupedRowInput (Measurement Capsule inside Grouped Tables)       */
/* -------------------------------------------------------------------------- */
export interface AppleGroupedRowInputProps extends TextInputProps {
  label: string;
  unit?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const AppleGroupedRowInput: React.FC<AppleGroupedRowInputProps> = ({
  label,
  unit,
  error,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.rowContainer, containerStyle]}>
      <View style={styles.rowMain}>
        <View style={styles.labelCol}>
          <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
            {label}
          </Text>
        </View>

        {/* Apple Inset Measurement Capsule */}
        <View
          style={[
            styles.capsuleBox,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderColor: error
                ? theme.colors.danger
                : isFocused
                ? theme.colors.primaryLime
                : theme.colors.border,
            },
            isFocused && styles.capsuleBoxFocused,
          ]}
        >
          <TextInput
            {...rest}
            style={[
              styles.capsuleInput,
              noOutlineStyle,
              { color: theme.colors.textPrimary },
              style,
            ]}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            placeholderTextColor={theme.colors.textMuted}
          />
          {unit ? (
            <View
              style={[
                styles.capsuleUnitBadge,
                {
                  backgroundColor: isFocused
                    ? 'rgba(164, 235, 63, 0.15)'
                    : 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.capsuleUnitText,
                  {
                    color: isFocused
                      ? theme.colors.primaryLime
                      : theme.colors.textSecondary,
                  },
                ]}
              >
                {unit}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {error ? (
        <Text style={[styles.rowErrorText, { color: theme.colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. AppleTextInput (Ergonomic Full-Width Inset Field for Auth & Forms)     */
/* -------------------------------------------------------------------------- */
export interface AppleTextInputProps extends TextInputProps {
  label?: string;
  icon?: IconName;
  error?: string;
  helperText?: string;
  rightAction?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const AppleTextInput: React.FC<AppleTextInputProps> = ({
  label,
  icon,
  error,
  helperText,
  rightAction,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      {label ? (
        <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.fieldBox,
          {
            backgroundColor: theme.colors.surfaceSecondary,
            borderColor: error
              ? theme.colors.danger
              : isFocused
              ? theme.colors.primaryLime
              : theme.colors.border,
          },
          isFocused && styles.fieldBoxFocused,
        ]}
      >
        {icon ? (
          <View style={styles.fieldIconSlot}>
            <Icon
              name={icon}
              size={18}
              color={
                error
                  ? theme.colors.danger
                  : isFocused
                  ? theme.colors.primaryLime
                  : theme.colors.textSecondary
              }
            />
          </View>
        ) : null}

        <TextInput
          {...rest}
          style={[
            styles.fieldInput,
            noOutlineStyle,
            { color: theme.colors.textPrimary },
            style,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={theme.colors.textMuted}
        />

        {rightAction ? (
          <View style={styles.rightActionSlot}>{rightAction}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.fieldFeedback, { color: theme.colors.danger }]}>
          {error}
        </Text>
      ) : helperText ? (
        <Text style={[styles.fieldFeedback, { color: theme.colors.textMuted }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // Grouped Row Styles
  rowContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 56,
    justifyContent: 'center',
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelCol: {
    flex: 1,
    paddingRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  capsuleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 100,
    justifyContent: 'flex-end',
    gap: 6,
    ...Platform.select({
      web: {
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      },
      default: {},
    }),
  },
  capsuleBoxFocused: {
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(164, 235, 63, 0.15)',
      },
      default: {},
    }),
  },
  capsuleInput: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
    minWidth: 46,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontVariant: ['tabular-nums'],
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  capsuleUnitBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  capsuleUnitText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  rowErrorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },

  // Apple Full-Width Field Styles
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 2,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    ...Platform.select({
      web: {
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      },
      default: {},
    }),
  },
  fieldBoxFocused: {
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(164, 235, 63, 0.15)',
      },
      default: {},
    }),
  },
  fieldIconSlot: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  rightActionSlot: {
    marginLeft: 10,
  },
  fieldFeedback: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
});
