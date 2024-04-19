import { useTranslation } from 'react-i18next';

import { SettingsView } from '@/views/SettingsViewTemplate';

export function SafetySurface() {
  const { t } = useTranslation();

  return (
    <SettingsView>
      <h1>{t('accountSettings.safety.title')}</h1>
    </SettingsView>
  );
}
