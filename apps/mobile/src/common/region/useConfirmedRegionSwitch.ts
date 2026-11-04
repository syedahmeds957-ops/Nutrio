import { useCallback } from 'react';
import { useTranslation } from '../../i18n/index.js';
import { confirmAction } from '../confirm.js';
import { useRegion } from './regionContext.js';

/**
 * Region also decides the language, currency and food menus, so a stray tap on
 * the PK/SA pill must not flip all of them. Asks first, naming what changes.
 */
export function useConfirmedRegionSwitch(onConfirmed?: () => void): () => void {
  const { activeRegion, setRegion } = useRegion();
  const { t } = useTranslation();
  const target = activeRegion === 'SA' ? 'PK' : 'SA';

  return useCallback(() => {
    confirmAction({
      title: t(`common.regionSwitch.title.${target}`),
      message: t(`common.regionSwitch.message.${target}`),
      confirmLabel: t('common.regionSwitch.confirm'),
      cancelLabel: t('common.cancel'),
      onConfirm: () => {
        onConfirmed?.();
        setRegion(target);
      },
    });
  }, [t, target, setRegion, onConfirmed]);
}
