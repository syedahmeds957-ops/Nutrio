import { useMemo } from 'react';

import { formatDate, formatNumber, formatPercent, formatRate, formatTime } from './format.js';
import { useI18nState } from './I18nProvider.js';

/** Number, date and time formatters bound to the running app language. */
export function useFormat() {
  const { language } = useI18nState();
  return useMemo(
    () => ({
      language,
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) => formatNumber(value, language, options),
      formatPercent: (value: number, options?: Intl.NumberFormatOptions) => formatPercent(value, language, options),
      formatRate: (value: number, rounding?: 'nearest' | 'down') => formatRate(value, language, rounding),
      formatDate: (date: Date | number, options?: Intl.DateTimeFormatOptions) => formatDate(date, language, options),
      formatTime: (date: Date | number, options?: Intl.DateTimeFormatOptions) => formatTime(date, language, options),
    }),
    [language]
  );
}
