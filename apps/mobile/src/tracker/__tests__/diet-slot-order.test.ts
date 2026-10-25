import { describe, expect, it } from 'vitest';
import { orderSectionsForSlot } from '../dietSlotOrder.js';

const sections = ['meals', 'protein', 'fruits', 'dairy', 'grains', 'extras'].map((group) => ({ group }));
const order = (slot: Parameters<typeof orderSectionsForSlot>[1]) =>
  orderSectionsForSlot(sections, slot).map((s) => s.group);

describe('orderSectionsForSlot', () => {
  it('puts breakfast foods first at breakfast and meals first at lunch', () => {
    expect(order('breakfast').slice(0, 3)).toEqual(['dairy', 'grains', 'protein']);
    expect(order('lunch')[0]).toBe('meals');
  });

  it('puts fruit first for snacks', () => {
    expect(order('snacks_chai')[0]).toBe('fruits');
  });

  it('never drops or duplicates a section, and keeps unlisted ones last in order', () => {
    for (const slot of ['breakfast', 'lunch', 'dinner', 'snacks_chai'] as const) {
      expect([...order(slot)].sort()).toEqual(sections.map((s) => s.group).sort());
      expect(order(slot).at(-1)).toBe('extras');
    }
  });

  it('leaves the order alone when no meal is chosen', () => {
    expect(order(undefined)).toEqual(sections.map((s) => s.group));
  });
});
