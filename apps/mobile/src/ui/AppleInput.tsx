import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  TextInputProps,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../theme.js';
import { useTextDirection } from '../i18n/index.js';
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
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={[styles.rowContainer, containerStyle]}>
      <View style={styles.rowMain}>
        <View style={styles.labelCol}>
          <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
            {label}
          </Text>
        </View>

        {/* Apple Inset Measurement Capsule */}
        <Pressable
          // The whole capsule is the touch target; the input stays the one tab stop.
          focusable={false}
          onPress={() => inputRef.current?.focus()}
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
            ref={inputRef}
            accessibilityLabel={rest.accessibilityLabel ?? label}
            style={[
              styles.capsuleInput,
              noOutlineStyle,
              // A hint ("e.g. 28") must not look like an entered value: regular weight until typed.
              !rest.value && styles.hintWeight,
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
                      ? theme.colors.primaryAccessible
                      : theme.colors.textSecondary,
                  },
                ]}
              >
                {unit}
              </Text>
            </View>
          ) : null}
        </Pressable>
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
  const dir = useTextDirection();
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
          accessibilityLabel={rest.accessibilityLabel ?? label ?? rest.placeholder}
          style={[
            styles.fieldInput,
            noOutlineStyle,
            !rest.value && styles.hintWeight,
            // Follow the content direction so an Arabic hint reads from the right.
            dir.text,
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
    paddingEnd: 12,
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
    minHeight: 44,
    paddingVertical: 0,
    paddingHorizontal: 10,
    // Fixed width: on web a TextInput's intrinsic width (~20 chars) grew the
    // capsule and squeezed the label until "Height" broke mid-word.
    width: 140,
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
        boxShadow: '0 0 0 3px rgba(164, 235, 63, 0.4)',
      },
      default: {},
    }),
  },
  capsuleInput: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    minWidth: 0,
    // The input fills the capsule, so the focus ring and tap target are >= 44px.
    minHeight: 44,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontVariant: ['tabular-nums'],
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  hintWeight: {
    fontWeight: '400',
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
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginStart: 2,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    // gap, not margins: logical margins resolve against the wrong direction on web in Arabic.
    gap: 10,
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
        boxShadow: '0 0 0 3px rgba(164, 235, 63, 0.4)',
      },
      default: {},
    }),
  },
  fieldIconSlot: {
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
  rightActionSlot: {},
  fieldFeedback: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginStart: 4,
  },
});
