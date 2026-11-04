import type { Region } from './regionContext.js';

const TIMEZONE_REGION: Record<string, Region> = {
  'Asia/Karachi': 'PK',
  'Asia/Riyadh': 'SA',
};

/**
 * Best guess at the region from what the device already tells us, with no
 * network call: the timezone first (a phone set to Riyadh time is in Saudi
 * Arabia whatever language it shows), then the region part of the locale
 * ("ar-SA", "en-PK"). Returns null when neither names a supported region.
 */
export function detectRegionFromDevice(
  timeZone: string | undefined,
  locales: readonly string[],
): Region | null {
  if (timeZone && TIMEZONE_REGION[timeZone]) {
    return TIMEZONE_REGION[timeZone];
  }
  for (const locale of locales) {
    const country = locale.split(/[-_]/)[1]?.toUpperCase();
    if (country === 'SA') return 'SA';
    if (country === 'PK') return 'PK';
  }
  return null;
}

export function readDeviceRegion(): Region | null {
  let timeZone: string | undefined;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = undefined;
  }
  const nav = (globalThis as { navigator?: { languages?: readonly string[]; language?: string } }).navigator;
  const locales = nav?.languages?.length ? nav.languages : nav?.language ? [nav.language] : [];
  return detectRegionFromDevice(timeZone, locales);
}
