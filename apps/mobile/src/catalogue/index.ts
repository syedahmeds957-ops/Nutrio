import { useEffect, useState } from 'react';
import type * as FoodDbModule from '@nutrio/food-db';

type FoodDb = typeof FoodDbModule;

/**
 * The food catalogue (about 3 MB of dishes, menus and search data) is a
 * separate chunk on the web build: the sign-in screen does not need it, so it
 * downloads alongside rather than ahead of first paint. Everything that needs a
 * dish reads it through `foodDb()`, which is only called once a screen that
 * needs it is showing (see `useCatalogueReady`).
 *
 * Types still come straight from '@nutrio/food-db'; type imports are erased, so
 * they cost nothing at runtime.
 */
let loaded: FoodDb | null = null;
let pending: Promise<FoodDb> | null = null;
const listeners = new Set<() => void>();

export function loadCatalogue(): Promise<FoodDb> {
  pending ??= import('@nutrio/food-db').then((mod) => {
    loaded = mod;
    listeners.forEach((notify) => notify());
    return mod;
  });
  return pending;
}

export function isCatalogueLoaded(): boolean {
  return loaded !== null;
}

/** The loaded catalogue. Throws when read before `loadCatalogue()` resolved. */
export function foodDb(): FoodDb {
  if (!loaded) {
    throw new Error('The food catalogue is not loaded yet. Await loadCatalogue() first.');
  }
  return loaded;
}

/** True once the catalogue is in memory; starts loading it if nothing has yet. */
export function useCatalogueReady(): boolean {
  const [ready, setReady] = useState(isCatalogueLoaded());
  useEffect(() => {
    if (isCatalogueLoaded()) {
      setReady(true);
      return;
    }
    const onLoaded = () => setReady(true);
    listeners.add(onLoaded);
    void loadCatalogue();
    return () => {
      listeners.delete(onLoaded);
    };
  }, []);
  return ready;
}
