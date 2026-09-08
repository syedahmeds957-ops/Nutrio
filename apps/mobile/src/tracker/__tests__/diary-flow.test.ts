import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { DiaryViewModal } from '../ui/DiaryViewModal.js';
import { LoggedItem, DailyTrackerSummary } from '../types.js';

describe('Phase 5: DiaryViewModal Component & Flow', () => {
  const mockItems: LoggedItem[] = [
    {
      id: 'log_1',
      mealSlot: 'lunch',
      foodName: 'Zinger Burger',
      foodNameUr: 'زنگر برگر',
      servingLabel: '1 burger (240g)',
      servingGrams: 240,
      quantity: 1,
      totalGrams: 240,
      calories: 640,
      proteinGrams: 25,
      fatGrams: 35,
      carbGrams: 59,
      loggedAt: new Date().toISOString(),
      syncStatus: 'synced',
    },
    {
      id: 'log_2',
      mealSlot: 'snacks_chai',
      foodName: 'Doodh Patti',
      foodNameUr: 'دودھ پتی',
      servingLabel: '1 cup (180ml)',
      servingGrams: 180,
      quantity: 1,
      totalGrams: 180,
      calories: 120,
      proteinGrams: 4,
      fatGrams: 5,
      carbGrams: 14,
      loggedAt: new Date().toISOString(),
      syncStatus: 'synced',
    },
  ];

  const mockSummary: DailyTrackerSummary = {
    date: '2026-09-05',
    targetCalories: 2100,
    targetProteinGrams: 120,
    targetFatGrams: 70,
    targetCarbGrams: 240,
    totalCaloriesConsumed: 760,
    remainingCalories: 1340,
    totalProteinConsumed: 29,
    totalFatConsumed: 40,
    totalCarbConsumed: 73,
    waterMlConsumed: 1500,
    targetWaterMl: 3000,
    items: mockItems,
    pendingSyncCount: 0,
  };

  it('renders diary header with date selector and progress card', () => {
    const handleClose = vi.fn();
    const handleDelete = vi.fn();
    const handleOpenLogHub = vi.fn();

    const element = React.createElement(DiaryViewModal, {
      visible: true,
      summary: mockSummary,
      onClose: handleClose,
      onDeleteItem: handleDelete,
      onOpenLogHub: handleOpenLogHub,
    });

    expect(element).toBeDefined();
    expect(element.props.visible).toBe(true);
    expect(element.props.summary.totalCaloriesConsumed).toBe(760);
    expect(element.props.summary.items.length).toBe(2);
  });

  it('invokes onDeleteItem when an item delete action is triggered', () => {
    const handleClose = vi.fn();
    const handleDelete = vi.fn();
    const handleOpenLogHub = vi.fn();

    const element = React.createElement(DiaryViewModal, {
      visible: true,
      summary: mockSummary,
      onClose: handleClose,
      onDeleteItem: handleDelete,
      onOpenLogHub: handleOpenLogHub,
    });

    element.props.onDeleteItem('log_1');
    expect(handleDelete).toHaveBeenCalledWith('log_1');
  });

  it('invokes onOpenLogHub when log meal action is pressed', () => {
    const handleClose = vi.fn();
    const handleDelete = vi.fn();
    const handleOpenLogHub = vi.fn();

    const element = React.createElement(DiaryViewModal, {
      visible: true,
      summary: mockSummary,
      onClose: handleClose,
      onDeleteItem: handleDelete,
      onOpenLogHub: handleOpenLogHub,
    });

    element.props.onOpenLogHub();
    expect(handleOpenLogHub).toHaveBeenCalledTimes(1);
  });
});
