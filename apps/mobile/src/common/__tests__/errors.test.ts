import { describe, expect, it } from 'vitest';
import { errorMessage, isNetworkError } from '../errors.js';

describe('errorMessage', () => {
  it('reads the message of an Error', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('reads a message from error-like objects such as Supabase errors', () => {
    expect(errorMessage({ message: 'JWT expired', code: 'PGRST301' })).toBe('JWT expired');
  });

  it('turns anything else into text', () => {
    expect(errorMessage('plain string')).toBe('plain string');
    expect(errorMessage(undefined)).toBe('undefined');
  });
});

describe('isNetworkError', () => {
  it('recognises the browser and React Native offline messages', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isNetworkError(new TypeError('Network request failed'))).toBe(true);
  });

  it('recognises Supabase retryable fetch errors by name', () => {
    expect(isNetworkError({ name: 'AuthRetryableFetchError', message: '' })).toBe(true);
  });

  it('does not treat server rejections as offline', () => {
    expect(isNetworkError(new Error('Invalid login credentials'))).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});
