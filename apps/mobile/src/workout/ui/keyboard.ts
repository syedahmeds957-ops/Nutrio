import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, type KeyboardAvoidingViewProps, type ScrollView, type TextInput, type View } from 'react-native';

/**
 * How a KeyboardAvoidingView makes room: iOS pads the bottom by the keyboard.
 * Android draws edge to edge (Expo 57), so the window no longer resizes for the
 * keyboard and the view shrinks its height instead.
 */
export const KEYBOARD_BEHAVIOR: KeyboardAvoidingViewProps['behavior'] = Platform.OS === 'ios' ? 'padding' : 'height';

/** True while the on-screen keyboard is up, so a sheet can drop the home-indicator padding it doesn't need then. */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // iOS announces the change before it animates; Android only after.
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/** Space kept above a focused field when it is scrolled into view. */
const FOCUS_MARGIN = 140;

/**
 * A scroll view whose focused input is brought into view above the keyboard.
 * Give `scrollRef` to the ScrollView and call `onFieldFocus(inputRef)` from
 * the input's onFocus. The scroll waits for the keyboard and the view's resize
 * to settle; a failed measurement leaves the view as it was.
 */
export function useScrollFieldIntoView() {
  const scrollRef = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const onFieldFocus = useCallback((field: TextInput | View | null) => {
    if (!field) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const scroll = scrollRef.current;
      // getInnerViewRef is in ScrollView.js but missing from RN's type definitions.
      const inner = (scroll as unknown as { getInnerViewRef?: () => unknown } | null)?.getInnerViewRef?.();
      if (!scroll || !inner) return;
      try {
        field.measureLayout(
          inner as never,
          (_x, y) => scroll.scrollTo({ y: Math.max(0, y - FOCUS_MARGIN), animated: true }),
          () => undefined
        );
      } catch {
        // Measuring can fail on a view that just unmounted; the field stays where it is.
      }
    }, 250);
  }, []);
  return { scrollRef, onFieldFocus };
}
