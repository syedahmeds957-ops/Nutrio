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
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { HapticFeedback } from '../../ui/haptics.js';
import { MealSlot } from '../types.js';
import { StapleItem, getStapleDefinitions, resolveStaple } from '../staples.js';
import { chipsThatFit } from '../mealsCard.js';

export type { StapleItem } from '../staples.js';

interface QuickStaplesBarProps {
  onQuickLog: (staple: StapleItem, slot: MealSlot) => void;
  /** Set for guests: a tap asks them to create an account instead of opening the meal picker. */
  onRequireAccount?: () => void;
}

const SLOT_IDS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks_chai'];

const CHIP_GAP = 8;
/** Chip width = padding, plus icon, gaps (about 48 px) + text at about 7 px a character, with 8% to spare. */
const CHIP_FIXED_PX = 48;
const CHIP_CHAR_PX = 7;
const estimateChipWidth = (label: string, kcal: string) =>
  Math.ceil((CHIP_FIXED_PX + (label.length + kcal.length) * CHIP_CHAR_PX) * 1.08);

export const QuickStaplesBar: React.FC<QuickStaplesBarProps> = ({
  onQuickLog,
  onRequireAccount,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const activeTextColor = '#0A0B0D';
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);
  // A staple is logged only once the user has picked a meal, so a tap parks
  // the chip here while the slot sheet is open instead of logging blind.
  const [pendingStaple, setPendingStaple] = useState<StapleItem | null>(null);
  const [rowWidth, setRowWidth] = useState(0);

  // Which staples appear is regional (roti in Pakistan, tamees in Saudi) and
  // only the chip label is translated: `name` is the key the resolver matches
  // against the food database, so translating it would log the wrong dish.
  // Calories come from the resolved catalogue serving, not the chip row, so
  // the number on the chip is the number that lands in the diary.
  const staples = getStapleDefinitions(activeRegion).map((staple) => ({
    item: { ...staple, label: t(`tracker.staples.${staple.id}`) } as StapleItem,
    resolved: resolveStaple(staple, activeRegion),
  }));

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
  const chips = staples.map(({ item, resolved }) => ({
    item,
    label: item.label.replace(/^\+\s*/, ''),
    kcal: String(resolved.calories),
  }));
  const visibleCount =
    rowWidth > 0
      ? chipsThatFit(
          chips.map((chip) => estimateChipWidth(chip.label, chip.kcal)),
          rowWidth,
          CHIP_GAP
        )
      : Math.min(3, chips.length);

  return (
    <View style={styles.container}>
      <View
        style={styles.row}
        onLayout={(e: LayoutChangeEvent) => setRowWidth(e.nativeEvent.layout.width)}
        accessibilityLabel={t('tracker.staples.heading')}
      >
        {chips.slice(0, visibleCount).map(({ item: staple, label, kcal }) => {
          const isJustLogged = justLoggedId === staple.id;

          return (
            <TouchableOpacity
              key={staple.id}
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
              onPress={() => handlePress(staple)}
              activeOpacity={0.7}
              hitSlop={{ top: 5, bottom: 5, left: 0, right: 0 }}
              accessibilityRole="button"
              accessibilityLabel={`${label}, ${t('common.kcalValue', { value: kcal })}`}
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
  container: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CHIP_GAP,
    overflow: 'hidden',
  },
  pillBtn: {
    height: 34,
    justifyContent: 'center',
    borderRadius: 9999,
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
    fontSize: 11,
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
