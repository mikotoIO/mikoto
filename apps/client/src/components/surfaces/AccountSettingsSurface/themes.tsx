import { Button, Buttons, Form, Input, SelectInput } from '@mikoto-io/lucid';
import { HexColorPicker } from 'react-colorful';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { DEFAULT_THEME_SETTINGS, themeDB } from '../../../store';
import { useLocalDB } from '../../../store/LocalDB';
import { SettingsView } from '../../../views/SettingsViewTemplate';

export function ThemesSubsurface() {
  const { t } = useTranslation();

  const [themeSettings, setThemeSettings] = useLocalDB(themeDB);
  const form = useForm({
    defaultValues: themeSettings,
  });

  return (
    <SettingsView>
      <h1>{t('accountSettings.themes.title')}</h1>
      <Form
        onSubmit={form.handleSubmit((data) => {
          setThemeSettings(data);
        })}
      >
        <SelectInput
          labelName="Theme"
          data={['dark', 'light']}
          {...form.register('theme')}
        />

        <Input labelName="color" {...form.register('accent')} />
        <HexColorPicker
          color={form.getValues('accent')}
          onChange={(color) => {
            form.setValue('accent', color);
          }}
        />
        <Buttons>
          <Button variant="primary" type="submit">
            Save
          </Button>
          <Button
            type="button"
            onClick={() => {
              setThemeSettings(DEFAULT_THEME_SETTINGS);
              form.reset(DEFAULT_THEME_SETTINGS);
            }}
          >
            Reset
          </Button>
        </Buttons>
      </Form>
    </SettingsView>
  );
}
