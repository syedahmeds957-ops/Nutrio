import { describe, it, expect } from 'vitest';
import { searchPakistaniFoods } from '../src/index.js';
import { canonicalWord, isWithinEditDistance } from '../src/search-normalize.js';

const topNames = (query: string, n = 3) =>
  searchPakistaniFoods(query, { limit: n }).map((f) => f.name.toLowerCase());

describe('canonicalWord — Roman Urdu spelling folding', () => {
  it.each([
    ['gosht', 'ghosht'],
    ['aloo', 'aalu'],
    ['aloo', 'alu'],
    ['keema', 'qeema'],
    ['korma', 'qorma'],
    ['kofta', 'kofte'],
    ['kofta', 'koftay'],
    ['chana', 'chanay'],
    ['gobi', 'gobhi'],
    ['salan', 'saalan'],
    ['tikka', 'tika'],
  ])('folds "%s" and "%s" to the same form', (a, b) => {
    expect(canonicalWord(a)).toBe(canonicalWord(b));
  });

  it('keeps unrelated words apart', () => {
    expect(canonicalWord('palak')).not.toBe(canonicalWord('pulao'));
    expect(canonicalWord('egg')).not.toBe(canonicalWord('eggplant'));
  });

  it('leaves Urdu script untouched', () => {
    expect(canonicalWord('بریانی')).toBe('بریانی');
  });
});

describe('isWithinEditDistance', () => {
  it('counts an insertion, a deletion or a swapped pair as one edit', () => {
    expect(isWithinEditDistance('biriyani', 'biryani', 1)).toBe(true);
    expect(isWithinEditDistance('bryani', 'biryani', 1)).toBe(true);
    expect(isWithinEditDistance('karhai', 'karahi', 1)).toBe(true);
  });

  it('rejects words further apart than the limit', () => {
    expect(isWithinEditDistance('kofta', 'kebab', 1)).toBe(false);
    expect(isWithinEditDistance('karhai', 'kabab', 1)).toBe(false);
  });
});

describe('searchPakistaniFoods — spelling variants', () => {
  it.each(['aloo ghosht', 'aalu gosht', 'alu ghosht', 'aloo gosht'])(
    'puts Aloo Gosht first for "%s"',
    (query) => {
      expect(topNames(query)[0]).toContain('aloo gosht');
    }
  );

  it('finds korma dishes when spelled "qorma"', () => {
    expect(topNames('qorma').some((n) => n.includes('korma'))).toBe(true);
  });

  it('finds kofta dishes when spelled "kofte"', () => {
    expect(topNames('kofte').every((n) => n.includes('kofta'))).toBe(true);
  });

  it('finds Keema Matar when spelled "qeema matar"', () => {
    const names = topNames('qeema matar', 2);
    expect(names.every((n) => n.includes('keema') && n.includes('matar'))).toBe(true);
  });

  it('finds Gobhi Gosht when spelled "gobi gosht"', () => {
    expect(topNames('gobi gosht')[0]).toContain('gobhi gosht');
  });

  it('tolerates a typo: "biriyani" still returns biryanis', () => {
    const names = topNames('biriyani', 5);
    expect(names.length).toBe(5);
    expect(names.every((n) => n.includes('biryani'))).toBe(true);
  });

  it('corrects a typo toward the word it shares the longest start with', () => {
    expect(topNames('bhajia')[0]).not.toContain('bajra');
  });

  it('still prefers egg dishes over eggplant for "egg"', () => {
    expect(topNames('egg', 10).some((n) => n.includes('eggplant'))).toBe(false);
  });

  it('keeps search fast with fuzzy fallback', () => {
    const start = performance.now();
    searchPakistaniFoods('biriyani karhai');
    expect(performance.now() - start).toBeLessThan(50);
  });
});
