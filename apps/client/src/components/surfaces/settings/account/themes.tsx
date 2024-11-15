import { Button, Group, Input } from '@chakra-ui/react';
import { HexColorPicker } from 'react-colorful';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Field, SelectRoot } from '@/components/ui';
import { DEFAULT_THEME_SETTINGS, themeDB } from '@/store';
import { useLocalDB } from '@/store/LocalDB';
import { Form } from '@/ui';
import { SettingSurface } from '@/views';

export function ThemesSubsurface() {
  const { t } = useTranslation();

  const [themeSettings, setThemeSettings] = useLocalDB(themeDB);
  const form = useForm({
    defaultValues: themeSettings,
  });

  return (
    <SettingSurface>
      <h1>{t('accountSettings.themes.title')}</h1>
      <Form
        onSubmit={form.handleSubmit((data) => {
          setThemeSettings(data);
        })}
      >
        {/* <Field label="Theme">
          <Select {...form.register('theme')}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </Select>
        </Field> */}

        <Field label="Color">
          <Input {...form.register('accent')} />
        </Field>
        <HexColorPicker
          color={form.getValues('accent')}
          onChange={(color) => {
            form.setValue('accent', color);
          }}
        />
        <Group>
          <Button colorPalette="primary" type="submit">
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
        </Group>
      </Form>
    </SettingSurface>
  );
}
