import { useTranslation } from 'react-i18next';

/** Thin wrapper around react-i18next that exposes the current language and a setter. */
export default function useLanguage() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return { t, lang: i18n.language, changeLanguage };
}
