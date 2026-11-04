import { describe, expect, it } from 'vitest';
import { hiddenFromAssistiveTech } from '../common/a11yHidden.js';

describe('hiddenFromAssistiveTech', () => {
  it('hides the screen from iOS, Android and web assistive tech while an overlay is open', () => {
    expect(hiddenFromAssistiveTech(true)).toEqual({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
      'aria-hidden': true,
    });
  });
  it('leaves it readable otherwise', () => {
    expect(hiddenFromAssistiveTech(false)).toEqual({
      accessibilityElementsHidden: false,
      importantForAccessibility: 'auto',
      'aria-hidden': undefined,
    });
  });
});
