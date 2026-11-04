import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
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
import { StapleItem, getStapleDefinitions, resolveStaple, sugarDrink, sugarVariant, usualChaiServing } from '../staples.js';

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
  /** Logs `cups` of the usual chai, without sugar when asked. The screen owns the diary write and the undo toast. */
  onQuickLogChai?: (cups: number, sugarFree?: boolean) => void;
}

const SLOT_IDS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks_chai'];

const CHIP_GAP = 8;
const CHAI_CHIP_ID = 'usual_chai';
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
  const dir = useTextDirection();
  const accentColor = theme.colors.primaryLime;
  const activeTextColor = theme.colors.limeText;
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);
  // A staple is logged only once the user has picked a meal, so a tap parks
  // the chip here while the slot sheet is open instead of logging blind.
  const [pendingStaple, setPendingStaple] = useState<StapleItem | null>(null);
  // Chai is never logged blind: a tap on either chai chip first asks whether it has sugar.
  const [askSugar, setAskSugar] = useState<'pinned' | StapleItem | null>(null);
  const sheetOpen = pendingStaple !== null || askSugar !== null;
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
    setAskSugar('pinned');
  };

  const handlePress = (staple: StapleItem) => {
    HapticFeedback.impactLight();
    if (onRequireAccount) {
      onRequireAccount();
      return;
    }
    if (sugarDrink(staple)) {
      setAskSugar(staple);
      return;
    }
    setPendingStaple(staple);
  };

  const handlePickSugar = (sugarFree: boolean) => {
    const asked = askSugar;
    if (!asked) return;
    HapticFeedback.impactLight();
    setAskSugar(null);
    if (asked === 'pinned') {
      onQuickLogChai?.(chaiCups, sugarFree);
      setJustLoggedId(CHAI_CHIP_ID);
      setTimeout(() => setJustLoggedId(null), 1800);
      return;
    }
    // The meal question follows, naming the cup the user picked.
    setPendingStaple({
      ...sugarVariant(asked, sugarFree),
      label: t(sugarFree ? 'tracker.staples.noSugarLabel' : 'tracker.staples.withSugarLabel', {
        drink: asked.label.replace(/^\+\s*/, ''),
      }),
    });
  };

  const closeSheet = () => {
    setPendingStaple(null);
    setAskSugar(null);
  };

  const handlePickSlot = (slot: MealSlot) => {
    if (!pendingStaple) return;
    HapticFeedback.impactLight();
    onQuickLog(pendingStaple, slot);
    setJustLoggedId(pendingStaple.id);
    setPendingStaple(null);
    setTimeout(() => setJustLoggedId(null), 1800);
  };

  // One line that scrolls sideways, so every staple (chai, black coffee, green tea, egg, ...) is reachable.
  const chaiChip = showChai
    ? {
        label: t('tracker.staples.chaiToday'),
        kcal: t('common.kcalValue', { value: usualChaiServing(activeRegion).calories * chaiCups }),
      }
    : null;
  const chips = staples.map(({ item, resolved }) => ({
    item,
    label: item.label.replace(/^\+\s*/, ''),
    // A drink that asks about sugar shows no calories: they depend on the answer.
    kcal: sugarDrink(item) ? '' : t('common.kcalValue', { value: resolved.calories }),
  }));
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
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
        {chips.map(({ item: staple, label, kcal }) => {
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
                  {kcal ? (
                    <Text
                      numberOfLines={1}
                      style={[styles.pillKcal, { color: isJustLogged ? activeTextColor : theme.colors.textSecondary }]}
                    >
                      {kcal}
                    </Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <NamedModal accessibilityName={t('a11y.dialog.quickStaples')}
        visible={sheetOpen}
        transparent
        animationType="fade"
        onRequestClose={closeSheet}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={closeSheet}
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
            {askSugar !== null ? (
              (() => {
                // The drink being asked about: the pinned chip is chai, a staple chip names its own drink.
                const chaiStaple = getStapleDefinitions(activeRegion).find((staple) => staple.id === 'chai');
                const asked = askSugar === 'pinned' ? chaiStaple : askSugar;
                const drinkKey = asked ? sugarDrink(asked) : null;
                if (!asked || !drinkKey) return null;
                const drink = askSugar === 'pinned' ? t('tracker.staples.chaiToday') : (asked as StapleItem).label.replace(/^\+\s*/, '');
                return (
                  <>
                    <Text style={[styles.sheetTitle, dir.text, { color: theme.colors.textPrimary }]}>
                      {t('tracker.staples.sugarTitle', { drink: drink.toLowerCase() })}
                    </Text>
                    <Text style={[styles.sheetSubtitle, dir.text, { color: theme.colors.textMuted }]}>
                      {t('tracker.staples.sugarSubtitle')}
                    </Text>
                    {[false, true].map((sugarFree) => {
                      const cups = askSugar === 'pinned' ? chaiCups : 1;
                      const kcal = sugarVariant(asked, sugarFree).calories * cups;
                      return (
                        <TouchableOpacity
                          key={sugarFree ? 'plain' : 'sweet'}
                          testID={sugarFree ? 'sugar-without' : 'sugar-with'}
                          style={[
                            styles.sheetOption,
                            styles.sheetOptionRow,
                            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                          ]}
                          onPress={() => handlePickSugar(sugarFree)}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                        >
                          <Text style={[styles.sheetOptionText, styles.sheetOptionLabel, dir.text, { color: theme.colors.textPrimary }]}>
                            {t(`tracker.staples.sugar.${drinkKey}.${sugarFree ? 'without' : 'with'}`)}
                          </Text>
                          <Text style={[styles.sheetOptionKcal, { color: theme.colors.textSecondary }]}>
                            {t('common.kcalValue', { value: kcal })}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </>
                );
              })()
            ) : (
              <>
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
              </>
            )}

            <TouchableOpacity
              style={styles.sheetCancel}
              onPress={closeSheet}
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
  scroll: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CHIP_GAP,
  },
  // The chip stays 34 px tall inside a 44 px touchable.
  pillHit: { minHeight: 44, justifyContent: 'center' },
  pillBtn: {
    height: 34,
    justifyContent: 'center',
    borderRadius: commonRadii.pill,
    paddingHorizontal: 12,
    borderWidth: 1,
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
  sheetOptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sheetOptionLabel: { flexShrink: 1 },
  sheetOptionKcal: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
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
