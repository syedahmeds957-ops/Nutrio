/**
 * Props that take a screen out of the accessibility tree while something is
 * open on top of it (a full-screen sheet, a dialog). Native screen readers
 * would otherwise still step through the dashboard behind the overlay, and on
 * web its text stays in the page's reading order. Spread onto the wrapper
 * around the screen, never around the overlay itself.
 *
 * - iOS: `accessibilityElementsHidden`
 * - Android: `importantForAccessibility="no-hide-descendants"`
 * - web: `aria-hidden` (react-native-web turns it into the attribute)
 */
export function hiddenFromAssistiveTech(hidden: boolean) {
  return {
    accessibilityElementsHidden: hidden,
    importantForAccessibility: hidden ? ('no-hide-descendants' as const) : ('auto' as const),
    'aria-hidden': hidden ? true : undefined,
  };
}
