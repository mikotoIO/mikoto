import { useTranslation } from 'react-i18next';

import { SettingsView } from '../../../views/SettingsViewTemplate';

export function ThemesSubsurface() {
  const { t } = useTranslation();

  return (
    <SettingsView>
      <h1>{t('accountSettings.themes.title')}</h1>
    </SettingsView>
  );
}
