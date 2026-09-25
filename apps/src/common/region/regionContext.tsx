import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
        // 1. Check local storage if available
        let saved: string | null = null;
        if (typeof window !== 'undefined' && window.localStorage) {
          saved = window.localStorage.getItem(STORAGE_KEY);
        }

        if (saved === 'SA' || saved === 'PK') {
          if (isMounted) {
            setActiveRegionState(saved);
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
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(STORAGE_KEY, detected);
          }
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
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, region);
    }
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
