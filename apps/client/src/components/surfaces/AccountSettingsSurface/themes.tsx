import { SelectInput } from '@mikoto-io/lucid';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { LocalDB } from '../../../store/LocalDB';
import { SettingsView } from '../../../views/SettingsViewTemplate';

const themeDB = new LocalDB(
  'theme',
  z.object({
    theme: z.enum(['dark', 'light']),
  }),
  () => ({
    theme: 'dark',
  }),
);

export function ThemesSubsurface() {
  const { t } = useTranslation();

  return (
    <SettingsView>
      <h1>{t('accountSettings.themes.title')}</h1>
      <SelectInput
        labelName="Theme"
        data={['dark', 'light']}
        onChange={(ev) => {
          themeDB.set((prev) => ({ ...prev, theme: ev.target.value }));
        }}
      />
    </SettingsView>
  );
}
