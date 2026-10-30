import { localizeServingLabel, withoutAmountBracket } from './servingLabel.js';

/**
 * One-line portion text for a logged or planned item.
 *
 * Catalogue serving labels already carry their reference weight in the name
 * ("1 bazinga burger (200g)", "1 standard serving (200g)"), so printing the
 * label next to the item's own gram figure showed the weight twice — and the
 * two numbers disagreed as soon as quantity wasn't 1, since the baked-in one
 * never scales. Strip the label's parenthesised weight and print the item's
 * real total instead, which is the only figure the macros were computed from.
 */
export function formatServingLine(
  quantity: number,
  label: string | undefined,
  totalGrams: number,
  language: 'en' | 'ar' = 'en'
): string {
  const stripped = withoutAmountBracket(label || 'serving');
  const cleanLabel = localizeServingLabel(stripped || 'serving', language);
  const qtyPrefix = quantity !== 1 ? `${quantity} × ` : '';
  const weight = language === 'ar' ? `${Math.round(totalGrams)} غ` : `${Math.round(totalGrams)} g`;
  return `${qtyPrefix}${cleanLabel} (${weight})`;
}
