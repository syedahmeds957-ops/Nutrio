/** A readable message from anything a `catch` can receive. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return String(err);
}

/**
 * Whether a failure means the backend was unreachable, as opposed to the
 * server answering with a rejection. Auth falls back to the device when offline.
 */
export function isNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const message = errorMessage(err);
  return (
    message.includes('Failed to fetch') ||
    message.includes('Network request failed') ||
    (err as { name?: unknown }).name === 'AuthRetryableFetchError'
  );
}
