import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NamedModal } from '../../ui/NamedModal.js';
import type { NormalizedFood, RegionCode } from '@nutrio/food-db';
import { useTheme } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { noOutlineStyle } from '../../ui/AppleInput.js';
import { describeMeal } from '../../ai/mealText.js';
import { MealSlot } from '../types.js';
import {
  canLogDraft,
  chooseFood,
  confirmRow,
  draftFromAnalysis,
  draftTotals,
  rowNutrition,
  servingChoices,
  setRowGrams,
  setRowQuantity,
  setRowServing,
  toLogEntries,
  type DraftLogEntry,
  type DraftRow,
} from '../describeMeal.js';
import { AddDishModal } from './AddDishModal.js';

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks_chai'];
const MAX_TEXT = 500;
const MAX_ALTERNATIVES = 3;

interface DescribeMealModalProps {
  visible: boolean;
  region: RegionCode;
  /** The hub's current slot; a slot named in the sentence replaces it. */
  initialSlot: MealSlot;
  /** Text typed in the hub's search bar; analysed as soon as the modal opens. */
  initialText?: string;
  onClose: () => void;
  onLog: (slot: MealSlot, entries: DraftLogEntry[]) => void;
}

/**
 * Log a meal by describing it: "in breakfast i had 4 egg whites and 2 whole
 * eggs and salad". The sentence is split into foods, each matched against the
 * catalogue, and shown for review. Rows the pipeline guessed must be confirmed
 * or changed, and foods it does not know can be added as the user's own dish,
 * before "Log meal" unlocks.
 */
export const DescribeMealModal: React.FC<DescribeMealModalProps> = ({
  visible,
  region,
  initialSlot,
  initialText,
  onClose,
  onLog,
}) => {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const accent = theme.colors.primaryLime;
  const accentInk = isDark ? accent : '#4B6200';

  const [text, setText] = useState('');
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [rows, setRows] = useState<DraftRow[] | null>(null);

  // Each opening starts from the meal the hub is logging into, and from the
  // hub's search text when there is one.
  useEffect(() => {
    if (!visible) return;
    setSlot(initialSlot);
    const seed = initialText?.trim() ?? '';
    if (seed.length >= 2) {
      setText(seed);
      void analyse(seed);
    }
    // Only opening the modal seeds it; later edits to the hub's text must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  const [slot, setSlot] = useState<MealSlot>(initialSlot);
  // The row whose food is being added as a new dish, if any.
  const [addingFor, setAddingFor] = useState<DraftRow | null>(null);

  const reset = () => {
    setText('');
    setRows(null);
    setAddingFor(null);
    setSlot(initialSlot);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const analyse = async (value: string) => {
    if (value.trim().length < 2) return;
    setIsAnalysing(true);
    const { analysis } = await describeMeal(value, region);
    setRows(draftFromAnalysis(analysis));
    if (analysis.slot) setSlot(analysis.slot);
    setIsAnalysing(false);
  };

  const handleAnalyse = () => {
    if (!isAnalysing) void analyse(text);
  };

  const updateRow = (key: string, update: (row: DraftRow) => DraftRow) =>
    setRows((current) => current?.map((r) => (r.key === key ? update(r) : r)) ?? null);

  const removeRow = (key: string) =>
    setRows((current) => current?.filter((r) => r.key !== key) ?? null);

  const handleDishAdded = (dish: NormalizedFood) => {
    if (addingFor) updateRow(addingFor.key, (r) => chooseFood(r, dish));
    setAddingFor(null);
  };

  const handleLog = () => {
    if (!rows || !canLogDraft(rows)) return;
    onLog(slot, toLogEntries(rows));
    reset();
  };

  const totals = rows ? draftTotals(rows) : undefined;
  const pendingRows = rows ? rows.filter((r) => r.status !== 'ready') : [];
  const pending = pendingRows.length;
  // The footer says why, not just how many: the first row's own reason, with
  // its food name so it is clear which line to look at.
  const firstPending = pendingRows[0];
  const pendingReason = firstPending
    ? t(
        `tracker.describeMeal.reasons.${
          firstPending.status === 'unknown' ? 'unknown_food' : (firstPending.flags[0] ?? 'ambiguous_food')
        }`
      )
    : '';

  const renderRow = (row: DraftRow) => {
    const nutrition = rowNutrition(row);
    const needsUser = row.status !== 'ready';
    return (
      <View
        key={row.key}
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.surface,
            borderColor: needsUser ? '#F59E0B' : theme.colors.border,
          },
        ]}
      >
        <View style={styles.rowTop}>
          <View style={styles.rowInfo}>
            <Text style={[styles.typed, dir.text, { color: theme.colors.textMuted }]} numberOfLines={1}>
              “{row.parsed.text}”
            </Text>
            <Text style={[styles.foodName, dir.text, { color: theme.colors.textPrimary }]}>
              {row.food ? row.food.name : t('tracker.describeMeal.notFound')}
            </Text>
            {row.serving && nutrition && (
              <Text style={[styles.amount, dir.text, { color: theme.colors.textSecondary }]}>
                {t('tracker.describeMeal.amount', {
                  quantity: row.quantity,
                  serving: row.serving.label,
                  grams: nutrition.grams,
                })}
              </Text>
            )}
          </View>
          <View style={styles.rowRight}>
            {nutrition && (
              <Text style={[styles.kcal, { color: theme.colors.textPrimary }]}>
                {t('common.kcalValue', { value: nutrition.kcal })}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => removeRow(row.key)}
              accessibilityRole="button"
              accessibilityLabel={t('tracker.describeMeal.remove')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="trash" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {row.food && (
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepBtn, { borderColor: theme.colors.border }]}
              onPress={() => updateRow(row.key, (r) => setRowQuantity(r, r.quantity - (r.quantity > 1 ? 1 : 0.5)))}
              accessibilityRole="button"
              accessibilityLabel={t('tracker.describeMeal.less')}
            >
              <Icon name="minus" size={14} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.stepValue, { color: theme.colors.textPrimary }]}>{row.quantity}</Text>
            <TouchableOpacity
              style={[styles.stepBtn, { borderColor: theme.colors.border }]}
              onPress={() => updateRow(row.key, (r) => setRowQuantity(r, r.quantity + (r.quantity >= 1 ? 1 : 0.5)))}
              accessibilityRole="button"
              accessibilityLabel={t('tracker.describeMeal.more')}
            >
              <Icon name="plus" size={14} color={theme.colors.textPrimary} />
            </TouchableOpacity>

            {/* Exact weight: replaces the serving with what the user typed. */}
            <View style={[styles.gramsBox, { borderColor: theme.colors.border }]}>
              <TextInput
                // Remounts when the weight changes elsewhere (stepper, chip), so the box shows it.
                key={`${row.key}_${nutrition?.grams ?? 0}`}
                style={[styles.gramsInput, noOutlineStyle, { color: theme.colors.textPrimary }]}
                defaultValue={nutrition ? String(nutrition.grams) : ''}
                keyboardType="numeric"
                inputMode="numeric"
                maxLength={4}
                selectTextOnFocus
                accessibilityLabel={t('tracker.describeMeal.gramsLabel')}
                onEndEditing={(e) => updateRow(row.key, (r) => setRowGrams(r, Number(e.nativeEvent.text)))}
                onSubmitEditing={(e) => updateRow(row.key, (r) => setRowGrams(r, Number(e.nativeEvent.text)))}
              />
              <Text style={[styles.gramsUnit, { color: theme.colors.textSecondary }]}>
                {t('tracker.describeMeal.gramsUnit')}
              </Text>
            </View>
          </View>
        )}

        {row.food && servingChoices(row).length > 1 && (
          <View style={styles.chips}>
            {servingChoices(row).map((s) => {
              const active = row.quantity === 1 && row.serving?.label === s.label;
              return (
                <TouchableOpacity
                  key={s.label}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? theme.colors.surfaceSecondary : 'transparent',
                      borderColor: active ? accent : theme.colors.border,
                    },
                  ]}
                  onPress={() => updateRow(row.key, (r) => setRowServing(r, s))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.chipText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {row.status === 'needs_confirm' && (
          <View style={styles.decision}>
            <Text style={[styles.reason, dir.text, { color: '#B45309' }]}>
              {t(`tracker.describeMeal.reasons.${row.flags[0] ?? 'ambiguous_food'}`)}
            </Text>
            <View style={styles.chips}>
              <TouchableOpacity
                style={[styles.chip, { backgroundColor: accent, borderColor: accent }]}
                onPress={() => updateRow(row.key, confirmRow)}
                accessibilityRole="button"
              >
                <Icon name="check" size={12} color="#0A0B0D" />
                <Text style={[styles.chipText, { color: '#0A0B0D' }]}>{t('tracker.describeMeal.looksRight')}</Text>
              </TouchableOpacity>
              {row.alternatives.slice(0, MAX_ALTERNATIVES).map((alt) => (
                <TouchableOpacity
                  key={alt.id ?? alt.name}
                  style={[styles.chip, { borderColor: theme.colors.border }]}
                  onPress={() => updateRow(row.key, (r) => chooseFood(r, alt))}
                  accessibilityRole="button"
                >
                  <Text style={[styles.chipText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {alt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {row.status === 'unknown' && (
          <View style={styles.decision}>
            <Text style={[styles.reason, dir.text, { color: '#B45309' }]}>
              {t('tracker.describeMeal.reasons.unknown_food')}
            </Text>
            <View style={styles.chips}>
              <TouchableOpacity
                style={[styles.chip, { backgroundColor: accent, borderColor: accent }]}
                onPress={() => setAddingFor(row)}
                accessibilityRole="button"
              >
                <Icon name="sparkles" size={12} color="#0A0B0D" />
                <Text style={[styles.chipText, { color: '#0A0B0D' }]}>
                  {t('tracker.addDish.addButton', { name: row.parsed.name })}
                </Text>
              </TouchableOpacity>
              {row.alternatives.slice(0, MAX_ALTERNATIVES).map((alt) => (
                <TouchableOpacity
                  key={alt.id ?? alt.name}
                  style={[styles.chip, { borderColor: theme.colors.border }]}
                  onPress={() => updateRow(row.key, (r) => chooseFood(r, alt))}
                  accessibilityRole="button"
                >
                  <Text style={[styles.chipText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {alt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <NamedModal accessibilityName={t('a11y.dialog.describeMeal')} visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.canvas }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Icon name="sparkles" size={18} color={accentInk} />
          <Text style={[styles.title, dir.text, { color: theme.colors.textPrimary }]}>
            {t('tracker.describeMeal.title')}
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="x" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            style={[
              styles.input,
              noOutlineStyle,
              dir.text,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
              },
            ]}
            value={text}
            onChangeText={(v) => setText(v.slice(0, MAX_TEXT))}
            placeholder={t(`tracker.describeMeal.placeholder.${region === 'SA' ? 'SA' : 'PK'}`)}
            placeholderTextColor={theme.colors.textMuted}
            multiline
            autoFocus
          />
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: accent, opacity: text.trim().length < 2 || isAnalysing ? 0.5 : 1 },
            ]}
            onPress={handleAnalyse}
            disabled={text.trim().length < 2 || isAnalysing}
            accessibilityRole="button"
          >
            {isAnalysing ? (
              <ActivityIndicator color="#0A0B0D" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {rows ? t('tracker.describeMeal.analyseAgain') : t('tracker.describeMeal.analyse')}
              </Text>
            )}
          </TouchableOpacity>

          {rows && (
            <>
              <View style={styles.slotRow}>
                {MEAL_SLOTS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.slotChip,
                      {
                        backgroundColor: slot === s ? accent : theme.colors.surface,
                        borderColor: slot === s ? accent : theme.colors.border,
                      },
                    ]}
                    onPress={() => setSlot(s)}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.chipText, { color: slot === s ? '#0A0B0D' : theme.colors.textPrimary }]}>
                      {t(`tracker.mealSlots.${s}.${region === 'SA' ? 'SA' : 'PK'}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {rows.length === 0 ? (
                <Text style={[styles.empty, dir.textCenter, { color: theme.colors.textSecondary }]}>
                  {t('tracker.describeMeal.nothingFound')}
                </Text>
              ) : (
                rows.map(renderRow)
              )}
            </>
          )}
        </ScrollView>

        {rows && rows.length > 0 && totals && (
          <View style={[styles.footer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <View style={styles.footerInfo}>
              <Text style={[styles.totalKcal, { color: theme.colors.textPrimary }]}>
                {t('common.kcalValue', { value: totals.kcal })}
              </Text>
              <Text style={[styles.footerHint, dir.text, { color: pending ? '#B45309' : theme.colors.textSecondary }]}>
                {pending
                  ? `${t('tracker.describeMeal.pending', { count: pending })} · ${firstPending?.parsed.name ?? ''}: ${pendingReason}`
                  : t('common.macroLine', {
                      protein: Math.round(totals.proteinGrams),
                      carbs: Math.round(totals.carbGrams),
                      fat: Math.round(totals.fatGrams),
                    })}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.logBtn, { backgroundColor: accent, opacity: canLogDraft(rows) ? 1 : 0.4 }]}
              onPress={handleLog}
              disabled={!canLogDraft(rows)}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>{t('tracker.describeMeal.logMeal')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <AddDishModal
          visible={addingFor !== null}
          dishName={addingFor?.parsed.name ?? ''}
          region={region}
          onClose={() => setAddingFor(null)}
          onDishAdded={handleDishAdded}
        />
      </SafeAreaView>
    </NamedModal>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    lineHeight: 21,
    textAlignVertical: 'top',
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: '#0A0B0D' },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 9999, borderWidth: 1 },
  row: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  rowTop: { flexDirection: 'row', gap: 12 },
  rowInfo: { flex: 1, gap: 2 },
  rowRight: { alignItems: 'flex-end', gap: 10 },
  typed: { fontSize: 12, fontStyle: 'italic' },
  foodName: { fontSize: 15, fontWeight: '700' },
  amount: { fontSize: 13 },
  kcal: { fontSize: 15, fontWeight: '800' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontSize: 15, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  gramsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginStart: 'auto',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 32,
  },
  gramsInput: { width: 48, fontSize: 14, fontWeight: '700', textAlign: 'right', paddingVertical: 0 },
  gramsUnit: { fontSize: 13, fontWeight: '600' },
  decision: { gap: 8 },
  reason: { fontSize: 12, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  empty: { fontSize: 14, lineHeight: 20, paddingVertical: 16 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  footerInfo: { flex: 1 },
  totalKcal: { fontSize: 20, fontWeight: '800' },
  footerHint: { fontSize: 12, fontWeight: '600' },
  logBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 9999 },
});
