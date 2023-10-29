import i18n from 'i18next';
import HttpApi from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

i18n
  .use(HttpApi)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    lng: localStorage.getItem('language') ?? 'en',
    fallbackLng: 'en',
    load: 'languageOnly',

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
