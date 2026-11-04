import { describe, expect, it } from 'vitest';
import { filterSectionsForSlot, orderSectionsForSlot } from '../dietSlotOrder.js';

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

describe('filterSectionsForSlot', () => {
  const food = (name: string, cuisineTags: string[] = []) => ({ name, cuisineTags });
  const sections = [
    { group: 'meals', foods: [food('Chicken Karahi'), food('Halwa Puri', ['Breakfast'])] },
    { group: 'protein', foods: [food('Boiled Egg'), food('Grilled Chicken')] },
    { group: 'fruits', foods: [food('Banana')] },
    { group: 'vegetables', foods: [food('Bhindi')] },
    { group: 'beverages', foods: [food('Water')] },
  ];
  const names = (slot: Parameters<typeof filterSectionsForSlot>[1]) =>
    filterSectionsForSlot(sections, slot).flatMap((s) => s.foods.map((f) => f.name));

  it('shows eggs, fruit and breakfast-tagged dishes at breakfast, not a karahi or plain vegetables', () => {
    expect(names('breakfast')).toEqual(['Halwa Puri', 'Boiled Egg', 'Banana', 'Water']);
  });

  it('shows meals, protein and vegetables at lunch and dinner', () => {
    expect(names('lunch')).toContain('Chicken Karahi');
    expect(names('dinner')).toContain('Bhindi');
  });

  it('keeps drinks with every meal and everything when no meal is chosen', () => {
    for (const slot of ['breakfast', 'lunch', 'dinner', 'snacks_chai'] as const) {
      expect(names(slot)).toContain('Water');
    }
    expect(filterSectionsForSlot(sections, undefined)).toHaveLength(sections.length);
  });

  it('shows fruit for snacks and drops heavy mains', () => {
    expect(names('snacks_chai')).toContain('Banana');
    expect(names('snacks_chai')).not.toContain('Chicken Karahi');
  });
});
