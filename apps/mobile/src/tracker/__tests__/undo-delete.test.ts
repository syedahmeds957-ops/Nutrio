import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { initI18n } from '../../i18n/config.js';
import { TrackerEngine } from '../engine.js';
import { DiaryViewModal } from '../ui/DiaryViewModal.js';
import { UndoToast } from '../../ui/UndoToast.js';
import type { LoggedItem } from '../types.js';

// A native modal renders nothing on the server; show its content inline.
vi.mock('../../ui/NamedModal.js', () => ({
  NamedModal: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

const item = (id: string, foodName: string, calories: number): LoggedItem => ({
  id,
  mealSlot: 'lunch',
  foodName,
  servingLabel: '1 plate',
  servingGrams: 300,
  quantity: 1,
  totalGrams: 300,
  calories,
  proteinGrams: 20,
  fatGrams: 15,
  carbGrams: 60,
  loggedAt: '2026-10-29T08:00:00.000Z',
  syncStatus: 'synced',
});

describe('undoing a removed meal item', () => {
  const targets = { targetCalories: 1800, targetProteinGrams: 110, targetFatGrams: 60, targetCarbGrams: 200 };

  it('puts the exact item back at its old position', () => {
    const engine = new TrackerEngine(targets);
    const original = [item('a', 'Paratha', 300), item('b', 'Biryani', 650), item('c', 'Chai', 120)];
    engine.loadItems(original);

    const removed = engine.getSummary().items[1];
    expect(engine.deleteItem('b')).toBe(true);
    expect(engine.getSummary().totalCaloriesConsumed).toBe(420);

    expect(engine.restoreItem(removed, 1)).toBe(true);
    expect(engine.getSummary().items).toEqual(original);
    expect(engine.getSummary().totalCaloriesConsumed).toBe(1070);
  });

  it('never duplicates an item that is already there, and clamps a stale position', () => {
    const engine = new TrackerEngine(targets);
    engine.loadItems([item('a', 'Paratha', 300)]);
    expect(engine.restoreItem(item('a', 'Paratha', 300), 0)).toBe(false);
    expect(engine.getSummary().items).toHaveLength(1);

    expect(engine.restoreItem(item('z', 'Lassi', 200), 9)).toBe(true);
    expect(engine.getSummary().items.map((i) => i.id)).toEqual(['a', 'z']);
  });

  it('renders the toast as a status with a named Undo button', () => {
    initI18n('en');
    const html = renderToStaticMarkup(
      React.createElement(UndoToast, {
        message: 'Biryani removed',
        undoAccessibilityLabel: 'Undo removing Biryani',
        onUndo: () => {},
      })
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Biryani removed');
    expect(html).toContain('aria-label="Undo removing Biryani"');
    expect(html).toContain('>Undo<');
  });

  it('shows the toast inside the diary, whose delete buttons name the dish', () => {
    initI18n('en');
    const items = [item('b', 'Biryani', 650)];
    const html = renderToStaticMarkup(
      React.createElement(DiaryViewModal, {
        visible: true,
        summary: {
          date: '2026-10-29',
          targetCalories: 1800,
          targetProteinGrams: 110,
          targetFatGrams: 60,
          targetCarbGrams: 200,
          totalCaloriesConsumed: 650,
          remainingCalories: 1150,
          totalProteinConsumed: 20,
          totalFatConsumed: 15,
          totalCarbConsumed: 60,
          waterMlConsumed: 0,
          targetWaterMl: 2500,
          items,
          pendingSyncCount: 0,
        },
        dayOffset: 0,
        minDayOffset: 0,
        onDayOffsetChange: () => {},
        onClose: () => {},
        onDeleteItem: () => {},
        onOpenLogHub: () => {},
        undoToast: React.createElement(UndoToast, {
          message: 'Paratha removed',
          undoAccessibilityLabel: 'Undo removing Paratha',
          onUndo: () => {},
        }),
      })
    );
    expect(html).toContain('aria-label="Remove Biryani"');
    expect(html).toContain('Paratha removed');
  });
});
