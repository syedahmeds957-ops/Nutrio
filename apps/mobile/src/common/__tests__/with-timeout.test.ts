import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimeoutError, withTimeout } from '../withTimeout.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('withTimeout', () => {
  it('passes a fast result through', async () => {
    await expect(withTimeout(Promise.resolve(7), 1000, 'fast')).resolves.toBe(7);
  });

  it('passes a fast failure through', async () => {
    await expect(withTimeout(Promise.reject(new Error('offline')), 1000, 'fails')).rejects.toThrow('offline');
  });

  it('rejects with a TimeoutError when the step never settles', async () => {
    vi.useFakeTimers();
    const pending = withTimeout(new Promise<number>(() => {}), 5000, 'Restoring the session');
    const result = expect(pending).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(5000);
    await result;
    await expect(pending).rejects.toThrow('Restoring the session took longer than 5000 ms');
  });

  it('does not fire the timer after the promise settles', async () => {
    vi.useFakeTimers();
    await withTimeout(Promise.resolve('done'), 5000, 'quick');
    expect(vi.getTimerCount()).toBe(0);
  });
});
