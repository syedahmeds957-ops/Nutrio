import { describe, it, expect } from 'vitest';
import { HapticFeedback } from '../haptics.js';

describe('Apple HIG Haptic Feedback Service (Task 2.1)', () => {
  it('exposes all Apple HIG tactile feedback methods without throwing', async () => {
    await expect(HapticFeedback.selection()).resolves.toBeUndefined();
    await expect(HapticFeedback.impactLight()).resolves.toBeUndefined();
    await expect(HapticFeedback.impactMedium()).resolves.toBeUndefined();
    await expect(HapticFeedback.impactHeavy()).resolves.toBeUndefined();
    await expect(HapticFeedback.notificationSuccess()).resolves.toBeUndefined();
    await expect(HapticFeedback.notificationWarning()).resolves.toBeUndefined();
  });
});
