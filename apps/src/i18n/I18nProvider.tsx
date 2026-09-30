import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { Alert, I18nManager } from 'react-native';
import { I18nextProvider, useTranslation } from 'react-i18next';

import { useRegion } from '../common/region/index.js';
import { initI18n, i18n } from './config.js';
import { AppLanguage, languageForRegion } from './languages.js';
import { Direction, applyNativeDirection, directionForLanguage, reloadApp } from './rtl.js';

export interface I18nState {
  language: AppLanguage;
  /** Direction the content should read in, from the active language. */
  direction: Direction;
  isRTL: boolean;
  /**
   * True when the native layout engine has not caught up with the language
   * yet, which only clears after the app restarts.
   */
  needsRestartForRTL: boolean;
}

const I18nStateContext = createContext<I18nState>({
  language: 'en',
  direction: 'ltr',
  isRTL: false,
  needsRestartForRTL: false,
});

interface I18nProviderProps {
  children: ReactNode;
  /** Test seam: skips the restart prompt. */
  promptForRestart?: boolean;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, promptForRestart = true }) => {
  const { activeRegion, isLoading: isRegionLoading } = useRegion();
  const language = languageForRegion(activeRegion);

  // Initialised before first paint so no frame renders raw translation keys.
  const [instance] = useState(() => initI18n(language));
  const [needsRestartForRTL, setNeedsRestartForRTL] = useState<boolean>(
    () => I18nManager.isRTL !== (directionForLanguage(language) === 'rtl')
  );
  const hasSettledOnce = useRef(false);

  useEffect(() => {
    if (instance.language !== language) {
      void instance.changeLanguage(language);
    }

    const directionChanged = applyNativeDirection(language);
    const stale = I18nManager.isRTL !== (directionForLanguage(language) === 'rtl');
    setNeedsRestartForRTL(stale || directionChanged);

    // The region starts at its default and may be replaced once detection
    // finishes, so the first settled value is the baseline: its direction is
    // recorded silently. Only a switch made afterwards, while someone is using
    // the app, is worth interrupting them for.
    if (isRegionLoading) {
      return;
    }
    if (!hasSettledOnce.current) {
      hasSettledOnce.current = true;
      return;
    }

    if (!directionChanged || !promptForRestart) {
      return;
    }

    const isArabic = language === 'ar';
    Alert.alert(
      isArabic ? 'إعادة تشغيل التطبيق' : 'Restart required',
      isArabic
        ? 'لتطبيق الاتجاه من اليمين إلى اليسار بالكامل، يجب إعادة تشغيل التطبيق.'
        : 'Nutrio needs to restart to switch the layout direction.',
      [
        { text: isArabic ? 'لاحقاً' : 'Later', style: 'cancel' },
        {
          text: isArabic ? 'إعادة التشغيل' : 'Restart',
          onPress: () => {
            void reloadApp().then((reloaded) => {
              if (reloaded) return;
              Alert.alert(
                isArabic ? 'أغلق التطبيق وافتحه' : 'Reopen Nutrio',
                isArabic
                  ? 'يرجى إغلاق التطبيق تماماً ثم فتحه مرة أخرى.'
                  : 'Please close Nutrio completely and open it again.'
              );
            });
          },
        },
      ]
    );
  }, [language, instance, promptForRestart, isRegionLoading]);

  const value = useMemo<I18nState>(
    () => ({
      language,
      direction: directionForLanguage(language),
      isRTL: directionForLanguage(language) === 'rtl',
      needsRestartForRTL,
    }),
    [language, needsRestartForRTL]
  );

  return (
    <I18nextProvider i18n={instance}>
      <I18nStateContext.Provider value={value}>{children}</I18nStateContext.Provider>
    </I18nextProvider>
  );
};

/** Language and direction of the running app. */
export function useI18nState(): I18nState {
  return useContext(I18nStateContext);
}

/**
 * Text styling that follows the content direction. Native mirroring handles
 * rows and spacing once the app restarts.
 */
export function useTextDirection() {
  const { direction, isRTL } = useI18nState();

  return useMemo(
    () => ({
      direction,
      isRTL,
      // No textAlign: an explicit 'left'/'right' is swapped by React Native
      // whenever the native layout is mirrored, and I18nManager.isRTL cannot be
      // trusted to say whether that swap is happening (it reports false under
      // bridgeless even with RCTI18nUtil_forceRTL set natively). Stating only
      // the writing direction leaves alignment Natural, which follows the
      // paragraph's base direction and is never swapped, so Arabic reads from
      // the right and mixed Arabic/Latin labels stop coming out ragged.
      text: { writingDirection: direction } as const,
      textCenter: { writingDirection: direction, textAlign: 'center' } as const,
    }),
    [direction, isRTL]
  );
}

export { useTranslation };
