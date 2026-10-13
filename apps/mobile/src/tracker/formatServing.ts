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
  totalGrams: number
): string {
  const cleanLabel = (label || 'serving').replace(/\s*\(\s*\d+(\.\d+)?\s*g\s*\)/gi, '').trim();
  const qtyPrefix = quantity !== 1 ? `${quantity} × ` : '';
  return `${qtyPrefix}${cleanLabel || 'serving'} (${Math.round(totalGrams)}g)`;
}
