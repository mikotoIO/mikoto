import {
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  Input,
  Select,
} from '@chakra-ui/react';
import { HexColorPicker } from 'react-colorful';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { DEFAULT_THEME_SETTINGS, themeDB } from '@/store';
import { useLocalDB } from '@/store/LocalDB';
import { Form } from '@/ui';
import { SettingsView } from '@/views';

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
        <FormControl>
          <FormLabel>Theme</FormLabel>
          <Select {...form.register('theme')}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Color</FormLabel>
          <Input {...form.register('accent')} />
        </FormControl>
        <HexColorPicker
          color={form.getValues('accent')}
          onChange={(color) => {
            form.setValue('accent', color);
          }}
        />
        <ButtonGroup>
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
        </ButtonGroup>
      </Form>
    </SettingsView>
  );
}
