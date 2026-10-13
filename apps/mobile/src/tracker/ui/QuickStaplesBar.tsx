import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../theme.js';
import { Icon } from '../../ui/Icon.js';
import { useRegion } from '../../common/region/index.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { HapticFeedback } from '../../ui/haptics.js';
import { MealSlot } from '../types.js';
import { StapleItem, getStapleDefinitions, resolveStaple } from '../staples.js';

export type { StapleItem } from '../staples.js';

interface QuickStaplesBarProps {
  onQuickLog: (staple: StapleItem, slot: MealSlot) => void;
}

const SLOT_IDS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks_chai'];

export const QuickStaplesBar: React.FC<QuickStaplesBarProps> = ({
  onQuickLog,
}) => {
  const { theme, isDark } = useTheme();
  const { activeRegion } = useRegion();
  const { t } = useTranslation();
  const dir = useTextDirection();
  const isSaudi = activeRegion === 'SA';
  const accentColor = theme.colors.primaryLime;
  const activeTextColor = '#0A0B0D';
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);
  // A staple is logged only once the user has picked a meal, so a tap parks
  // the chip here while the slot sheet is open instead of logging blind.
  const [pendingStaple, setPendingStaple] = useState<StapleItem | null>(null);

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

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Icon name="zap" size={13} color={accentColor} />
          <Text style={[styles.heading, dir.text, { color: theme.colors.textMuted }]}>
            {t('tracker.staples.heading')}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {staples.map(({ item: staple, resolved }) => {
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
            >
              <View style={styles.pillContent}>
                <Icon
                  name={isJustLogged ? 'check' : staple.icon}
                  size={12}
                  color={isJustLogged ? activeTextColor : accentColor}
                />
                <Text
                  style={[
                    styles.pillLabel,
                    { color: isJustLogged ? activeTextColor : theme.colors.textPrimary },
                  ]}
                >
                  {isJustLogged ? t('tracker.staples.added') : staple.label}
                </Text>
                <Text
                  style={[
                    styles.pillKcal,
                    {
                      color: isJustLogged
                        ? (isSaudi ? 'rgba(255,255,255,0.85)' : '#0A0B0D')
                        : theme.colors.textSecondary,
                    },
                  ]}
                >
                  {t('common.kcalValue', { value: resolved.calories })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal
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
                item: pendingStaple?.label ?? '',
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
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  scrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  pillBtn: {
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  pillKcal: {
    fontSize: 11,
    fontWeight: '600',
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
