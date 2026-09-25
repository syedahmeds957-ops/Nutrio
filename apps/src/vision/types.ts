import { VisionResolutionResult } from '@nutrio/nutrition-core';

export type PreflightRejectionReason =
  | 'too_small'
  | 'too_dark'
  | 'too_bright'
  | 'quota_exceeded';

export interface PreflightCheckResult {
  passed: boolean;
  reason?: PreflightRejectionReason;
  message?: string;
  perceptualHash?: string;
}

export interface ScanQuotaState {
  date: string;
  usedCount: number;
  maxFreeLimit: number;
  isPaid: boolean;
}

export interface PerceptualCacheEntry {
  hash: string;
  dishDetected: string;
  cookingMethod: string;
  resolution: VisionResolutionResult;
  cachedAt: string;
}
