import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme, commonRadii } from '../../theme.js';
import { useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { Notice } from '../../ui/Notice.js';
import { HapticFeedback } from '../../ui/haptics.js';

interface TodayHeaderProps {
  userName: string;
  region: 'PK' | 'SA';
  /** Entries logged offline that have not reached the account yet; the badge hides at 0. */
  pendingSyncCount: number;
  onOpenProfile: () => void;
  onSwitchRegion: () => void;
}

/** Avatar and name on one side; on the other the offline-sync badge (when there is anything to sync) and the region. */
export const TodayHeader: React.FC<TodayHeaderProps> = ({
  userName,
  region,
  pendingSyncCount,
  onOpenProfile,
  onSwitchRegion,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const dir = useTextDirection();
  const [syncHintOpen, setSyncHintOpen] = useState(false);
  const regionLabel = t(`tracker.dashboard.regionName.${region}`);
  const syncText = t('tracker.header.pendingSync', { count: pendingSyncCount });

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.user}
          onPress={onOpenProfile}
          activeOpacity={0.7}
          accessibilityRole="button"
          // The greeting and the name are two lines on screen; read out they are "Today, <name>", not one run-on phrase.
          accessibilityLabel={t('tracker.header.todayName', { name: userName })}
        >
          <View style={[styles.avatar, { backgroundColor: c.surface, borderColor: c.primaryLime }]}>
            <Text style={[styles.avatarInitial, { color: c.primaryAccessible }]}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.names}>
            <Text style={[styles.greeting, dir.text, { color: c.textMuted }]}>{t('common.today')}</Text>
            <Text role="heading" aria-level={1} style={[styles.name, { color: c.textPrimary }]} numberOfLines={1}>
              {userName}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actions}>
          {pendingSyncCount > 0 && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={syncText}
              activeOpacity={0.7}
              onPress={() => {
                HapticFeedback.selection();
                setSyncHintOpen((open) => !open);
              }}
              style={styles.hit}
            >
              <View style={[styles.sync, { backgroundColor: c.warningLight, borderColor: c.warning }]}>
                <Icon name="sync" size={15} color={c.warning} strokeWidth={2.4} />
                <View style={[styles.syncCount, { backgroundColor: c.warning }]}>
                  <Text style={[styles.syncCountText, { color: c.textInverse }]}>{pendingSyncCount > 9 ? '9+' : pendingSyncCount}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.hit}
            onPress={() => {
              HapticFeedback.selection();
              onSwitchRegion();
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('tracker.header.regionPill', { name: regionLabel })}
          >
            <View style={[styles.region, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.regionText, { color: c.textPrimary }]} numberOfLines={1}>
                {regionLabel}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      {pendingSyncCount > 0 && syncHintOpen && (
        <Notice compact tone="warning" icon="sync">
          {syncText}
        </Notice>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 8, alignItems: 'stretch' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  user: { flexShrink: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  avatarInitial: { fontSize: 17, fontWeight: '900' },
  names: { flexShrink: 1 },
  greeting: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  name: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  // A 44 x 44 target around each small round or pill control.
  hit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  sync: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  syncCount: {
    position: 'absolute',
    top: -5,
    end: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncCountText: { fontSize: 11, fontWeight: '800' },
  region: {
    height: 34,
    minWidth: 56,
    paddingHorizontal: 12,
    borderRadius: commonRadii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionText: { fontSize: 12, fontWeight: '700' },
});
