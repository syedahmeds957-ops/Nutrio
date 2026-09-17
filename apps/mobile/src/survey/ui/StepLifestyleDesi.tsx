import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { HomeCookingStyle, SurveyLifestyleDesi } from '../types.js';
import { KCAL_PER_CUP_CHAI_SUGAR } from '../nutrition-bridge.js';
import { useTheme } from '../../theme.js';
import { useRegion } from '../../common/region/index.js';

interface StepLifestyleDesiProps {
  data: Partial<SurveyLifestyleDesi>;
  onChange: (updated: Partial<SurveyLifestyleDesi>) => void;
  errors: Record<string, string>;
}

const PK_COOKING_STYLES: Array<{ id: HomeCookingStyle; label: string }> = [
  { id: 'family_traditional', label: 'Family cooks traditional desi meals' },
  { id: 'cook_maid', label: 'Cook / Maid prepares meals' },
  { id: 'self', label: 'I cook my own meals' },
  { id: 'hostel_mess', label: 'Hostel / Mess' },
  { id: 'daily_takeaway', label: 'Frequently order takeaway / Dine out' },
];

const SA_COOKING_STYLES: Array<{ id: HomeCookingStyle; label: string }> = [
  { id: 'family_traditional', label: 'Family prepares home banquets (كبسة / ولائم منزلية)' },
  { id: 'cook_maid', label: 'House cook prepares meals' },
  { id: 'self', label: 'I cook my own meals' },
  { id: 'hostel_mess', label: 'Company camp / Mess' },
  { id: 'daily_takeaway', label: 'Takeaway & Restaurants (البيك، كودو، مطاعم شاورما)' },
];

export const StepLifestyleDesi: React.FC<StepLifestyleDesiProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const isSaudi = activeRegion === 'SA';
  const accentColor = isSaudi ? '#10B981' : theme.colors.primaryLime;
  const activeTextColor = isSaudi ? '#FFFFFF' : '#0A0B0D';
  const cookingStyles = isSaudi ? SA_COOKING_STYLES : PK_COOKING_STYLES;
  const chaiCount = data.chaiWithSugarCupsPerDay ?? 2;
  const estimatedChaiKcal = chaiCount * KCAL_PER_CUP_CHAI_SUGAR;
  const estimatedWeeklyChaiKcal = estimatedChaiKcal * 7;
  const dawatCount = data.eatingOutTimesPerWeek ?? 1;

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {isSaudi
          ? 'Saudi cultural habits shape your nutritional rhythm. Saudi Gahwa, companion Sukari/Ajwa dates, fresh Laban, and family Kabsa banquets are central to daily life.'
          : 'Regional habits shape your caloric profile. Sweetened chai and desi cooking oil are often the largest hidden energy sources.'}
      </Text>

      {/* Chai with Sugar Stepper Card */}
      <View
        style={[
          styles.chaiCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.chaiHeader}>
          <Text style={[styles.chaiTitle, { color: theme.colors.textPrimary }]}>
            {isSaudi
              ? 'Daily Saudi Gahwa & Dates Ritual (فنجان قهوة وتمر)'
              : 'Cups of Chai with Sugar Per Day'}
          </Text>
          <View style={[styles.chaiBadge, { backgroundColor: accentColor }]}>
            <Text style={[styles.chaiBadgeText, isSaudi && { color: '#FFFFFF' }]}>
              {isSaudi ? 'Saudi Tradition' : 'Key Desi Factor'}
            </Text>
          </View>
        </View>
        <Text style={[styles.chaiSubtitle, { color: theme.colors.textSecondary }]}>
          {isSaudi
            ? 'Finjans of Saudi Gahwa paired with companion dates (Sukari / Ajwa)'
            : 'Doodh patti / tea brewed with 1-2 tsp of sugar'}
        </Text>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={[
              styles.stepperBtn,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => onChange({ chaiWithSugarCupsPerDay: Math.max(0, chaiCount - 1) })}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepperBtnText, { color: theme.colors.textPrimary }]}>−</Text>
          </TouchableOpacity>

          <View style={styles.stepperValueBox}>
            <Text style={[styles.stepperValue, { color: theme.colors.textPrimary }]}>
              {chaiCount}
            </Text>
            <Text style={[styles.stepperUnit, { color: theme.colors.textSecondary }]}>
              {isSaudi ? 'finjans / day (فناجيل)' : 'cups / day'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.stepperBtn,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => onChange({ chaiWithSugarCupsPerDay: chaiCount + 1 })}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepperBtnText, { color: theme.colors.textPrimary }]}>+</Text>
          </TouchableOpacity>
        </View>

        {chaiCount > 0 && (
          <View
            style={[
              styles.impactBox,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.impactText, { color: theme.colors.textPrimary }]}>
              ☕ Adds ~
              <Text
                style={[
                  styles.impactHighlight,
                  { color: isSaudi ? (isDark ? '#34D399' : '#10B981') : theme.colors.primaryLime },
                ]}
              >
                {estimatedChaiKcal} kcal/day
              </Text>{' '}
              {isSaudi
                ? `(~${estimatedWeeklyChaiKcal.toLocaleString()} kcal/week) in dates & Gahwa ritual!`
                : `(~${estimatedWeeklyChaiKcal.toLocaleString()} kcal/week) in liquid sugars & milk!`}
            </Text>
          </View>
        )}
        {errors.chaiWithSugarCupsPerDay && (
          <Text style={styles.errorText}>{errors.chaiWithSugarCupsPerDay}</Text>
        )}
      </View>

      {/* Sleep Duration */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Typical Sleep Duration (Hours)</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
            },
            errors.sleepHoursPerNight && styles.inputError,
          ]}
          placeholder="e.g. 7"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          value={
            data.sleepHoursPerNight !== undefined
              ? String(data.sleepHoursPerNight)
              : ''
          }
          onChangeText={(val) => {
            const num = parseFloat(val);
            onChange({ sleepHoursPerNight: isNaN(num) ? undefined : num });
          }}
        />
        {errors.sleepHoursPerNight && (
          <Text style={styles.errorText}>{errors.sleepHoursPerNight}</Text>
        )}
      </View>

      {/* Dawat / Dining Out Frequency */}
      <View
        style={[
          styles.chaiCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.chaiHeader}>
          <Text style={[styles.chaiTitle, { color: theme.colors.textPrimary }]}>
            {isSaudi
              ? 'Family Banquets & Dine-Out Nights (ولائم وعزائم)'
              : 'Dawat / Dine-Out Nights Per Week'}
          </Text>
        </View>
        <Text style={[styles.chaiSubtitle, { color: theme.colors.textSecondary }]}>
          {isSaudi
            ? 'Family Kabsa & Mandi banquets, or restaurant meals (AlBaik, Kudu, Shawarmer)'
            : 'Shaadi dinners, family dawats, or restaurant takeaways'}
        </Text>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={[
              styles.stepperBtn,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => onChange({ eatingOutTimesPerWeek: Math.max(0, dawatCount - 1) })}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepperBtnText, { color: theme.colors.textPrimary }]}>−</Text>
          </TouchableOpacity>

          <View style={styles.stepperValueBox}>
            <Text style={[styles.stepperValue, { color: theme.colors.textPrimary }]}>
              {dawatCount}
            </Text>
            <Text style={[styles.stepperUnit, { color: theme.colors.textSecondary }]}>
              nights / week
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.stepperBtn,
              {
                backgroundColor: theme.colors.surfaceSecondary,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => onChange({ eatingOutTimesPerWeek: dawatCount + 1 })}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepperBtnText, { color: theme.colors.textPrimary }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Primary Cooking Style */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.colors.textPrimary }]}>Primary Meal Preparation Style</Text>
        <View style={styles.styleGrid}>
          {cookingStyles.map((style) => {
            const isSelected = data.whoCooksAtHome === style.id;
            return (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleChip,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                  isSelected && {
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                  },
                ]}
                onPress={() => onChange({ whoCooksAtHome: style.id })}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.styleChipText,
                    { color: theme.colors.textSecondary },
                    isSelected && { color: activeTextColor, fontWeight: '800' },
                  ]}
                >
                  {style.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.cookingStyle && (
          <Text style={styles.errorText}>{errors.cookingStyle}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  chaiCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  chaiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chaiTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  chaiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  chaiBadgeText: {
    color: '#0A0B0D',
    fontSize: 10,
    fontWeight: '800',
  },
  chaiSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  stepperValueBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  stepperValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stepperUnit: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  impactBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  impactText: {
    fontSize: 12,
    lineHeight: 18,
  },
  impactHighlight: {
    fontWeight: '800',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  styleGrid: {
    gap: 8,
  },
  styleChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  styleChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
