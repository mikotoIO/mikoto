import { Box } from '@mikoto-io/lucid';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { SettingsView } from '../../../views/SettingsViewTemplate';

const languages = [
  { name: 'English', code: 'en' },
  { name: '日本語', code: 'ja' },
  { name: '한국어', code: 'ko' },
];

const LanguageSelect = styled(Box)`
  cursor: pointer;
`;

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
          <LanguageSelect
            w="100%"
            key={lang.code}
            bg={lang.code === language ? 'N600' : 'N1000'}
            p={12}
            m={8}
            rounded={4}
            onClick={() => {
              setLanguage(lang.code);
              localStorage.setItem('language', lang.code);
              i18n.changeLanguage(lang.code);
            }}
          >
            {lang.name}
          </LanguageSelect>
        ))}
      </div>
    </SettingsView>
  );
}
