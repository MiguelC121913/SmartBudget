import { useTranslation } from 'react-i18next';

/** Small flag + code toggle that switches between ES and EN. Persists via localStorage. */
export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const isEs = i18n.language.startsWith('es');

  const toggle = () => i18n.changeLanguage(isEs ? 'en' : 'es');

  return (
    <button
      onClick={toggle}
      title={isEs ? 'Switch to English' : 'Cambiar a Español'}
      aria-label={isEs ? 'Switch to English' : 'Cambiar a Español'}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-all duration-150 active:scale-95"
    >
      {isEs ? '🇲🇽 ES' : '🇺🇸 EN'}
    </button>
  );
}
