/** Thrown (or reported) when a step took longer than it was allowed. */
export class TimeoutError extends Error {
  constructor(step: string, ms: number) {
    super(`${step} took longer than ${ms} ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Settles with the promise's result, or rejects with a TimeoutError once `ms`
 * pass first. Boot uses it on every network step, so a stalled request falls
 * back to local data instead of holding the splash screen forever. The slow
 * promise keeps running; its late result is simply not waited for.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, step: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(step, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
