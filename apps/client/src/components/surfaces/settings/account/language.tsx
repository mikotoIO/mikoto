import { Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageTitle } from '@/design';
import { SettingSurface } from '@/views';

import { settingsStyles } from '../common';

const languages = [
  { name: 'English', english: 'English', code: 'en' },
  { name: '日本語', english: 'Japanese', code: 'ja' },
  { name: '한국어', english: 'Korean', code: 'ko' },
];

function readStoredLanguage() {
  try {
    return localStorage.getItem('language') ?? 'en';
  } catch {
    return 'en';
  }
}

export function LanguageSurface() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(readStoredLanguage);

  return (
    <SettingSurface>
      <PageTitle
        title={t('accountSettings.language.title')}
        description="Choose the language for menus and labels. Messages aren't translated."
      />
      <div
        className={settingsStyles.list}
        role="radiogroup"
        aria-label={t('accountSettings.language.title')}
      >
        {languages.map((lang) => {
          const selected = lang.code === language;
          return (
            <button
              key={lang.code}
              type="button"
              role="radio"
              aria-checked={selected}
              lang={lang.code}
              className={settingsStyles.row}
              onClick={() => {
                setLanguage(lang.code);
                try {
                  localStorage.setItem('language', lang.code);
                } catch {
                  // Not persisted (private mode); still applies this session.
                }
                void i18n.changeLanguage(lang.code);
              }}
            >
              <div className={settingsStyles.rowMain}>
                <span className={settingsStyles.rowTitle}>{lang.name}</span>
                {lang.name !== lang.english && (
                  <span className={settingsStyles.rowMeta} lang="en">
                    {lang.english}
                  </span>
                )}
              </div>
              {selected && <Check size={16} aria-hidden />}
            </button>
          );
        })}
      </div>
    </SettingSurface>
  );
}
