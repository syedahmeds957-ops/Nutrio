export interface FoodDisplayName {
  primary: string;
  secondary?: string;
}

/**
 * Arabic readers get the Arabic name first and the English one as a quieter
 * second line; everyone else sees the English name only. Foods without an
 * Arabic name fall back to English.
 */
export function foodDisplayName(
  name: string,
  nameAr: string | undefined,
  arabic: boolean,
): FoodDisplayName {
  if (arabic && nameAr && nameAr !== name) {
    return { primary: nameAr, secondary: name };
  }
  return { primary: name };
}
