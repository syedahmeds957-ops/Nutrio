import { useCallback } from 'react';
import { useI18nState, useTranslation } from '../../i18n/index.js';
import { confirmAction } from '../confirm.js';
import { useRegion } from './regionContext.js';

/**
 * Region also decides the language, currency and food menus, so a stray tap on
 * the PK/SA pill must not flip all of them. Asks first, naming what changes.
 */
export function useConfirmedRegionSwitch(onConfirmed?: () => void): () => void {
  const { activeRegion, setRegion } = useRegion();
  const { t } = useTranslation();
  const { languagePreference } = useI18nState();
  const target = activeRegion === 'SA' ? 'PK' : 'SA';

  return useCallback(() => {
    confirmAction({
      title: t(`common.regionSwitch.title.${target}`),
      // A language the user picked stays put, so the message must not promise a change.
      message: t(
        languagePreference === 'auto'
          ? `common.regionSwitch.message.${target}`
          : `common.regionSwitch.messageKeepLanguage.${target}`
      ),
      confirmLabel: t('common.regionSwitch.confirm'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => {
        onConfirmed?.();
        setRegion(target);
      },
    });
  }, [t, target, setRegion, onConfirmed, languagePreference]);
}
