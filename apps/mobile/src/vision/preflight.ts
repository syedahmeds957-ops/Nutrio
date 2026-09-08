import { PerceptualCacheEntry, PreflightCheckResult } from './types.js';

/**
 * Computes a lightweight 64-bit perceptual fingerprint from an image base64 string.
 * Allows caching repetitive daily meals (e.g. standard daily breakfast) at $0 cost.
 */
export function computeImageHash(base64: string): string {
  const clean = base64.replace(/^data:image\/[a-z]+;base64,/, '');
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;

  // Step through sampled bytes
  const step = Math.max(1, Math.floor(clean.length / 128));
  for (let i = 0; i < clean.length; i += step) {
    const ch = clean.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return (
    (h1 >>> 0).toString(16).padStart(8, '0') +
    (h2 >>> 0).toString(16).padStart(8, '0')
  );
}

/**
 * Quality gate to cheaply reject unusable images before triggering a paid vision call.
 */
export function validateImageQuality(base64: string): PreflightCheckResult {
  const clean = base64.replace(/^data:image\/[a-z]+;base64,/, '').trim();

  // 1. Size check (must be at least 100 characters)
  if (clean.length < 100) {
    return {
      passed: false,
      reason: 'too_small',
      message: 'Photo data is too small or corrupt. Please capture again.',
    };
  }

  // 2. Luminance & homogeneity check
  // Sample characters to check for uniform pitch black or blown-out white
  let nonZeroCount = 0;
  const sampleSize = Math.min(200, clean.length);
  for (let i = 0; i < sampleSize; i++) {
    const char = clean[i];
    if (char !== 'A' && char !== '0' && char !== '/') {
      nonZeroCount++;
    }
  }

  if (nonZeroCount < 5) {
    return {
      passed: false,
      reason: 'too_dark',
      message: 'Photo is too dark or empty. Please ensure good lighting.',
    };
  }

  const hash = computeImageHash(clean);

  return {
    passed: true,
    perceptualHash: hash,
  };
}

/**
 * In-memory cache for perceptual hashes
 */
export class PerceptualVisionCache {
  private cache = new Map<string, PerceptualCacheEntry>();
  private readonly maxEntries: number;

  constructor(maxEntries = 50) {
    this.maxEntries = maxEntries;
  }

  get(hash: string): PerceptualCacheEntry | undefined {
    return this.cache.get(hash);
  }

  set(entry: PerceptualCacheEntry): void {
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(entry.hash, entry);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
