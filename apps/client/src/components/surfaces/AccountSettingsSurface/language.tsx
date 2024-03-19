import { Box } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsView } from '../../../views/SettingsViewTemplate';

const languages = [
  { name: 'English', code: 'en' },
  { name: '日本語', code: 'ja' },
  { name: '한국어', code: 'ko' },
];

export function LanguageSurface() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(
    localStorage.getItem('language') ?? 'en',
  );

  return (
    <SettingsView>
      <h1>{t('accountSettings.language.title')}</h1>
      <div>
        {languages.map((lang) => (
          <Box
            cursor="pointer"
            w="100%"
            key={lang.code}
            bg={lang.code === language ? 'gray.600' : 'gray.800'}
            p="12px"
            m="8px"
            rounded="md"
            onClick={() => {
              setLanguage(lang.code);
              localStorage.setItem('language', lang.code);
              i18n.changeLanguage(lang.code);
            }}
          >
            {lang.name}
          </Box>
        ))}
      </div>
    </SettingsView>
  );
}
