import { useTranslation } from 'react-i18next';

import { SettingSurface } from '@/views';

export function SafetySurface() {
  const { t } = useTranslation();

  return (
    <SettingSurface>
      <h1>{t('accountSettings.safety.title')}</h1>
    </SettingSurface>
  );
}
