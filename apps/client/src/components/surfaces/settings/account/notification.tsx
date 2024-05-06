import { useTranslation } from 'react-i18next';

import { SettingsView } from '@/views';

export function NotificationSurface() {
  const { t } = useTranslation();

  return (
    <SettingsView>
      <h1>{t('accountSettings.notifications.title')}</h1>
      <h2>Enable Notifications</h2>
    </SettingsView>
  );
}
