import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NamedModal } from '../../ui/NamedModal.js';
import { useTheme, commonRadii } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { HapticFeedback } from '../../ui/haptics.js';
import { MealSlot } from '../types.js';
import { StapleItem, getStapleDefinitions, resolveStaple, usualChaiServing } from '../staples.js';
import { useFormat } from '../../i18n/useFormat.js';
import { chipsThatFit } from '../mealsCard.js';

export type { StapleItem } from '../staples.js';

interface QuickStaplesBarProps {
  onQuickLog: (staple: StapleItem, slot: MealSlot) => void;
  /** Set for guests: a tap asks them to create an account instead of opening the meal picker. */
  onRequireAccount?: () => void;
  /** Told when the meal picker opens or closes, so the screen behind it can be hidden from screen readers. */
  onSheetOpenChange?: (open: boolean) => void;
  /**
   * Cups of chai a day from the survey. When 1 or more, a chip pinned first logs
   * that many cups into snacks and chai in one tap; 0 or left out shows the usual chips only.
   */
  chaiCups?: number;
  /** Logs `cups` of the usual chai. The screen owns the diary write and the undo toast. */
  onQuickLogChai?: (cups: number) => void;
}

const SLOT_IDS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks_chai'];

const CHIP_GAP = 8;
const CHAI_CHIP_ID = 'usual_chai';
/** Chip width = padding, plus icon, gaps (about 48 px) + text at about 7 px a character, with 8% to spare. */
const CHIP_FIXED_PX = 48;
const CHIP_CHAR_PX = 7;
const estimateChipWidth = (label: string, kcal: string) =>
  Math.ceil((CHIP_FIXED_PX + (label.length + kcal.length) * CHIP_CHAR_PX) * 1.08);

export const QuickStaplesBar: React.FC<QuickStaplesBarProps> = ({
  onQuickLog,
  onRequireAccount,
  onSheetOpenChange,
  chaiCups = 0,
  onQuickLogChai,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const { formatNumber } = useFormat();
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const activeTextColor = theme.colors.limeText;
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);
  // A staple is logged only once the user has picked a meal, so a tap parks
  // the chip here while the slot sheet is open instead of logging blind.
  const [pendingStaple, setPendingStaple] = useState<StapleItem | null>(null);
  const [rowWidth, setRowWidth] = useState(0);
  const sheetOpen = pendingStaple !== null;
  React.useEffect(() => {
    onSheetOpenChange?.(sheetOpen);
    return () => onSheetOpenChange?.(false);
  }, [sheetOpen]);

  // Which staples appear is regional (roti in Pakistan, tamees in Saudi) and
  // only the chip label is translated: `name` is the key the resolver matches
  // against the food database, so translating it would log the wrong dish.
  // Calories come from the resolved catalogue serving, not the chip row, so
  // the number on the chip is the number that lands in the diary.
  const showChai = chaiCups >= 1 && !!onQuickLogChai;
  const staples = getStapleDefinitions(activeRegion)
    // The pinned chai chip replaces the single-cup one.
    .filter((staple) => !(showChai && staple.id === 'chai'))
    .map((staple) => ({
    item: { ...staple, label: t(`tracker.staples.${staple.id}`) } as StapleItem,
    resolved: resolveStaple(staple, activeRegion),
  }));

  const handleChaiPress = () => {
    HapticFeedback.impactLight();
    if (onRequireAccount) {
      onRequireAccount();
      return;
    }
    onQuickLogChai?.(chaiCups);
    setJustLoggedId(CHAI_CHIP_ID);
    setTimeout(() => setJustLoggedId(null), 1800);
  };

  const handlePress = (staple: StapleItem) => {
    HapticFeedback.impactLight();
    if (onRequireAccount) {
      onRequireAccount();
      return;
    }
    setPendingStaple(staple);
  };

  const handlePickSlot = (slot: MealSlot) => {
    if (!pendingStaple) return;
    HapticFeedback.impactLight();
    onQuickLog(pendingStaple, slot);
    setJustLoggedId(pendingStaple.id);
    setPendingStaple(null);
    setTimeout(() => setJustLoggedId(null), 1800);
  };

  // One line, never scrolled or clipped: show the staples that fit the width,
  // in order. Until the row is measured, show the first few.
  const chaiChip = showChai
    ? {
        label: t('tracker.staples.chaiToday', { cups: formatNumber(chaiCups) }),
        kcal: t('common.kcalValue', { value: usualChaiServing(activeRegion).calories * chaiCups }),
      }
    : null;
  const chips = staples.map(({ item, resolved }) => ({
    item,
    label: item.label.replace(/^\+\s*/, ''),
    kcal: t('common.kcalValue', { value: resolved.calories }),
  }));
  // The pinned chip always shows first; the others fill what room is left.
  const pinnedCount = chaiChip ? 1 : 0;
  const widths = [
    ...(chaiChip ? [estimateChipWidth(chaiChip.label, chaiChip.kcal)] : []),
    ...chips.map((chip) => estimateChipWidth(chip.label, chip.kcal)),
  ];
  const fitting =
    rowWidth > 0
      ? chipsThatFit(widths, rowWidth, CHIP_GAP)
      : Math.min(3, chips.length + pinnedCount);
  const visibleCount = Math.max(0, fitting - pinnedCount);

  return (
    <View style={styles.container}>
      <View
        style={styles.row}
        onLayout={(e: LayoutChangeEvent) => setRowWidth(e.nativeEvent.layout.width)}
        accessibilityLabel={t('tracker.staples.heading')}
      >
        {chaiChip && (
          <TouchableOpacity
            key={CHAI_CHIP_ID}
            testID="chai-chip"
            style={styles.pillHit}
            onPress={handleChaiPress}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <View
              style={[
                styles.pillBtn,
                { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.pillContent}>
                <Icon
                  name={justLoggedId === CHAI_CHIP_ID ? 'check' : 'coffee'}
                  size={12}
                  color={theme.colors.textPrimary}
                  strokeWidth={2.6}
                />
                <Text numberOfLines={1} style={[styles.pillLabel, { color: theme.colors.textPrimary }]}>
                  {justLoggedId === CHAI_CHIP_ID ? t('tracker.staples.added') : chaiChip.label}
                </Text>
                <Text numberOfLines={1} style={[styles.pillKcal, { color: theme.colors.textSecondary }]}>
                  {chaiChip.kcal}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        {chips.slice(0, visibleCount).map(({ item: staple, label, kcal }) => {
          const isJustLogged = justLoggedId === staple.id;

          return (
            <TouchableOpacity
              key={staple.id}
              style={styles.pillHit}
              onPress={() => handlePress(staple)}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.pillBtn,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                  isJustLogged && {
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                  },
                ]}
              >
                <View style={styles.pillContent}>
                  <Icon
                    name={isJustLogged ? 'check' : 'plus'}
                    size={12}
                    color={isJustLogged ? activeTextColor : theme.colors.textPrimary}
                    strokeWidth={2.6}
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.pillLabel, { color: isJustLogged ? activeTextColor : theme.colors.textPrimary }]}
                  >
                    {isJustLogged ? t('tracker.staples.added') : label}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.pillKcal, { color: isJustLogged ? activeTextColor : theme.colors.textSecondary }]}
                  >
                    {kcal}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <NamedModal accessibilityName={t('a11y.dialog.quickStaples')}
        visible={pendingStaple !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingStaple(null)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setPendingStaple(null)}
        >
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => {}}
          >
            <Text style={[styles.sheetTitle, dir.text, { color: theme.colors.textPrimary }]}>
              {t('tracker.staples.chooseSlotTitle', {
                // The chip label reads "+ 1 Chai"; the question names just the food.
                item: (pendingStaple?.label ?? '').replace(/^\+\s*/, ''),
              })}
            </Text>
            <Text style={[styles.sheetSubtitle, dir.text, { color: theme.colors.textMuted }]}>
              {t('tracker.staples.chooseSlotSubtitle')}
            </Text>

            {SLOT_IDS.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.sheetOption,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => handlePickSlot(slot)}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.sheetOptionText,
                    dir.text,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {t(`tracker.mealSlots.${slot}.${activeRegion}`)}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.sheetCancel}
              onPress={() => setPendingStaple(null)}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={[styles.sheetCancelText, { color: theme.colors.textMuted }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </NamedModal>
    </View>
  );
};

const styles = StyleSheet.create({
  // The row is 44 px tall for tapping; the margin gives the 10 px back so the gaps to its neighbours stay as they were.
  container: { marginVertical: -5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CHIP_GAP,
    overflow: 'hidden',
  },
  // The chip stays 34 px tall inside a 44 px touchable.
  pillHit: { minHeight: 44, justifyContent: 'center', flexShrink: 1 },
  pillBtn: {
    height: 34,
    justifyContent: 'center',
    borderRadius: commonRadii.pill,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexShrink: 1,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pillLabel: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: '700',
  },
  pillKcal: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  sheetOption: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sheetOptionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sheetCancel: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  sheetCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
