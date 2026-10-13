import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Region = 'PK' | 'SA';

export interface CurrencyInfo {
  code: 'PKR' | 'SAR';
  symbol: string;
}

export interface RegionState {
  activeRegion: Region;
  currency: CurrencyInfo;
  isAutoDetected: boolean;
  isLoading: boolean;
  setRegion: (region: Region) => void;
}

export function detectRegionFromCountry(country: string): Region {
  if (!country) return 'PK';
  const c = country.trim().toUpperCase();

  // Saudi Arabia & GCC Gulf markers
  if (c === 'SA' || c === 'SAU' || c === 'SAUDI ARABIA' || c === 'KSA') {
    return 'SA';
  }

  // Pakistan markers
  if (c === 'PK' || c === 'PAK' || c === 'PAKISTAN') {
    return 'PK';
  }

  // Default to PK
  return 'PK';
}

export function getCurrencyForRegion(region: Region): CurrencyInfo {
  if (region === 'SA') {
    return { code: 'SAR', symbol: 'ر.س' };
  }
  return { code: 'PKR', symbol: 'Rs.' };
}

const STORAGE_KEY = 'nutrio_active_region';

/**
 * AsyncStorage is the only store that exists on device; window.localStorage is
 * undefined under Hermes, so reading it silently dropped every manual region
 * (and therefore language) choice on the next launch. Kept async and
 * fire-and-forget on write so the toggle stays instant.
 */
type SavedRegionRead = { ok: true; region: Region | null } | { ok: false };

async function readSavedRegion(): Promise<SavedRegionRead> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return { ok: true, region: saved === 'SA' || saved === 'PK' ? saved : null };
  } catch {
    return { ok: false };
  }
}

function persistRegion(region: Region): void {
  void AsyncStorage.setItem(STORAGE_KEY, region).catch(() => {
    // A failed write only costs re-detection on the next launch.
  });
}

const RegionContext = createContext<RegionState>({
  activeRegion: 'PK',
  currency: { code: 'PKR', symbol: 'Rs.' },
  isAutoDetected: false,
  isLoading: false,
  setRegion: () => {},
});

export async function fetchIPCountry(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    return data.country_code || data.country || null;
  } catch {
    return null;
  }
}

export const RegionProvider: React.FC<{ children: ReactNode; initialRegion?: Region }> = ({
  children,
  initialRegion,
}) => {
  const [activeRegion, setActiveRegionState] = useState<Region>(initialRegion || 'PK');
  const [isAutoDetected, setIsAutoDetected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(!initialRegion);

  useEffect(() => {
    if (initialRegion) return;

    let isMounted = true;

    async function initRegion() {
      try {
        // 1. A manual choice always wins over detection.
        const saved = await readSavedRegion();

        // A read that failed is not the same as a region never chosen. Falling
        // through to detection there would quietly replace a choice the user
        // made, so this launch keeps the default and leaves the stored value
        // untouched for the next one.
        if (!saved.ok) {
          return;
        }

        if (saved.region) {
          if (isMounted) {
            setActiveRegionState(saved.region);
            setIsAutoDetected(false);
            setIsLoading(false);
          }
          return;
        }

        // 2. Fetch IP Country
        const country = await fetchIPCountry();
        if (country && isMounted) {
          const detected = detectRegionFromCountry(country);
          setActiveRegionState(detected);
          setIsAutoDetected(true);
          persistRegion(detected);
        }
      } catch {
        // Keep default PK on error
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initRegion();

    return () => {
      isMounted = false;
    };
  }, [initialRegion]);

  const setRegion = (region: Region) => {
    setActiveRegionState(region);
    setIsAutoDetected(false);
    persistRegion(region);
  };

  const currency = getCurrencyForRegion(activeRegion);

  return (
    <RegionContext.Provider
      value={{
        activeRegion,
        currency,
        isAutoDetected,
        isLoading,
        setRegion,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
};

export function useRegion(): RegionState {
  return useContext(RegionContext);
}
