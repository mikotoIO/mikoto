import { useTranslation } from 'react-i18next';

import { SettingSurface } from '@/views';

export function NotificationSurface() {
  const { t } = useTranslation();

  return (
    <SettingSurface>
      <h1>{t('accountSettings.notifications.title')}</h1>
      <h2>Enable Notifications</h2>
    </SettingSurface>
  );
}
