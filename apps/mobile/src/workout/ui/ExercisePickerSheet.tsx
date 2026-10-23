import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { searchExercises, type WorkoutSettings } from '@nutrio/workout-core';
import { useTheme } from '../../theme.js';
import { useI18nState, useTranslation, useTextDirection } from '../../i18n/index.js';
import { Icon } from '../../ui/Icon.js';
import { equipmentText } from '../format.js';
import { ExerciseImageLoop } from './ExerciseImageLoop.js';

interface ExercisePickerProps {
  title: string;
  /** Limits results to what the user can do; omit to search every exercise (e.g. dislikes). */
  settings?: WorkoutSettings;
  /** Already chosen: shown as added. */
  chosen: readonly string[];
  onPick: (exerciseId: string) => void;
  onClose: () => void;
}

/** Search our exercise list by English or Arabic name (and common nicknames) and pick one. */
export const ExercisePickerSheet: React.FC<ExercisePickerProps & { visible: boolean }> = ({ visible, ...props }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <Pressable
        accessibilityLabel={t('workout.detail.close')}
        onPress={props.onClose}
        style={[styles.backdrop, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.62)' : 'rgba(15,23,42,0.45)' }]}
      />
      {visible ? <ExercisePickerBody {...props} /> : null}
    </Modal>
  );
};

/** The sheet itself, apart from its Modal so it can be rendered on its own. */
export const ExercisePickerBody: React.FC<ExercisePickerProps & { initialQuery?: string }> = ({ title, settings, chosen, onPick, onClose, initialQuery = '' }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const { language } = useI18nState();
  const dir = useTextDirection();
  const [query, setQuery] = useState(initialQuery);
  const results = searchExercises(query, { settings, limit: 20 });

  return (
    <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: c.surface }]}>
      <View style={[styles.handle, { backgroundColor: c.border }]} />
      <View style={styles.titleRow}>
        <Text accessibilityRole="header" style={[styles.title, dir.text, { color: c.textPrimary }]}>
          {title}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('workout.detail.close')}
          onPress={onClose}
          style={[styles.close, { backgroundColor: c.surfaceSecondary }]}
        >
          <Icon name="x" size={16} color={c.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={[styles.search, { borderColor: c.primaryLime }]}>
        <Icon name="search" size={18} color={c.textSecondary} />
        <TextInput
          accessibilityLabel={t('workout.more.searchLabel')}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCorrect={false}
          placeholder={t('workout.more.searchPlaceholder')}
          placeholderTextColor={c.textSecondary}
          style={[styles.input, dir.text, { color: c.textPrimary }]}
        />
      </View>
      <Text style={[styles.hint, dir.text, { color: c.textSecondary }]}>
        {query.trim() && results.length === 0 ? t('workout.more.noResults') : t('workout.more.searchHint')}
      </Text>
      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {results.map((exercise) => {
          const added = chosen.includes(exercise.id);
          return (
            <TouchableOpacity
              key={exercise.id}
              accessibilityRole="button"
              accessibilityState={{ disabled: added }}
              disabled={added}
              onPress={() => onPick(exercise.id)}
              style={[styles.row, { borderColor: c.border }]}
            >
              <ExerciseImageLoop exerciseId={exercise.id} size={48} square paused />
              <View style={styles.flex}>
                <Text style={[styles.name, dir.text, { color: c.textPrimary }]}>{exercise.name[language]}</Text>
                <Text style={[styles.equipment, dir.text, { color: c.textSecondary }]}>{equipmentText(t, exercise)}</Text>
              </View>
              {added ? (
                <View style={[styles.added, { backgroundColor: c.successLight }]}>
                  <Text style={[styles.addedText, { color: theme.isDark ? c.success : '#166534' }]}>{t('workout.more.added')}</Text>
                </View>
              ) : (
                <Icon name="plus" size={18} color={c.primaryAccessible} strokeWidth={2.4} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: StyleSheet.absoluteFill,
  sheet: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 10,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 999 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 19, fontWeight: '800' },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 2 },
  input: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: '600', paddingVertical: 10 },
  hint: { fontSize: 12 },
  list: { gap: 8, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, borderWidth: 1 },
  flex: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '700' },
  equipment: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  added: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  addedText: { fontSize: 12, fontWeight: '700' },
});
