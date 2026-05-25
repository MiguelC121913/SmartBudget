import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, ArrowLeft, Key, Zap, ExternalLink,
  Trash2, Loader2, Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import useSettings from '../hooks/useSettings';
import { useToast } from '../context/ToastContext';
import useConfirm from '../hooks/useConfirm';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, loading, updateApiKey, deleteApiKey } = useSettings();
  const { showSuccess, showError } = useToast();
  const [confirm, ConfirmDialog] = useConfirm();
  const { t } = useTranslation();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [busy, setBusy] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    const key = apiKeyInput.trim();
    if (!key) return;

    setBusy('saving');
    const result = await updateApiKey(key);

    if (result.success) {
      showSuccess(t('settings.apiKey.validated', 'API key guardada y validada. ¡BYOK activado!'));
      setApiKeyInput('');
    } else {
      showError(result.error);
    }
    setBusy('');
  };

  const handleDelete = async () => {
    const ok = await confirm(
      t('settings.apiKey.removeConfirm.message'),
      t('settings.apiKey.removeConfirm.title'),
    );
    if (!ok) return;

    setBusy('deleting');
    const result = await deleteApiKey();

    if (result.success) {
      showSuccess(t('settings.apiKey.removed', 'API key eliminada. Ahora estás en modo demo.'));
    } else {
      showError(result.error);
    }
    setBusy('');
  };

  const inputClass =
    'w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition font-mono';

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('settings.backToDashboard')}
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span className="font-bold tracking-tight">SmartBudget</span>
          </div>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="max-w-2xl mx-auto px-4 py-8 space-y-6"
      >

        <h1 className="text-xl font-bold text-white">{t('settings.title')}</h1>

        {/* ── API Key card ────────────────────────────────────────────── */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-5 shadow-xl shadow-slate-950/50">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">{t('settings.apiKey.title')}</h2>
          </div>

          <div className="space-y-3 text-sm text-slate-400 bg-slate-900/40 rounded-lg p-4 border border-slate-700/50">
            <p>{t('settings.apiKey.description')}</p>
            <div className="space-y-2 pl-2">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span>{t('settings.apiKey.demoOption')}</span>
              </div>
              <div className="flex items-start gap-2">
                <Key className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>{t('settings.apiKey.byokOption')}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('settings.apiKey.loading')}
            </div>
          ) : settings?.hasCustomKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-900/20 border border-emerald-800/50 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-400">{t('settings.apiKey.byokEnabled')}</p>
                  <p className="text-sm text-slate-400 mt-0.5 font-mono">
                    {t('settings.apiKey.maskedKey', { lastFour: settings.apiKeyLastFour ?? '????' })}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDelete}
                disabled={busy === 'deleting'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-700 text-red-400 hover:bg-red-900/20 text-sm font-medium transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                {busy === 'deleting' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {busy === 'deleting' ? t('settings.apiKey.removing') : t('settings.apiKey.removeKey')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {t('settings.apiKey.label')}
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={t('settings.apiKey.placeholder')}
                  autoComplete="off"
                  className={inputClass}
                />
                <p className="text-xs text-slate-500 mt-1.5">{t('settings.apiKey.hint')}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!apiKeyInput.trim() || busy === 'saving'}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-semibold text-sm transition-all duration-150 active:scale-95 hover:shadow-lg hover:shadow-emerald-900/30"
                >
                  {busy === 'saving' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('settings.apiKey.validating')}
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      {t('settings.apiKey.saveAndValidate')}
                    </>
                  )}
                </button>

                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('settings.apiKey.howToGet')}
                </a>
              </div>
            </form>
          )}
        </div>
      </motion.main>
      {ConfirmDialog}
    </div>
  );
}
