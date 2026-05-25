import { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, getCategoriesByType } from '../utils/categories';
import { useToast } from '../context/ToastContext';

const today = () => new Date().toISOString().split('T')[0];

const KNOWN_VALUES = new Set(CATEGORIES.map((c) => c.value));

export default function TransactionForm({ onSubmit, onCancel, initialData, isEditing = false }) {
  const { t, i18n } = useTranslation();
  const { showSuccess, showError, showWarning } = useToast();

  const [description, setDescription] = useState(initialData?.description ?? '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '');
  const [type, setType] = useState(initialData?.type ?? 'expense');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [date, setDate] = useState(
    initialData?.date ? initialData.date.split('T')[0] : today()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoLimitReached, setDemoLimitReached] = useState(false);

  const hasCustomCategory =
    !!initialData?.category && !KNOWN_VALUES.has(initialData.category);

  const isEn = i18n.language.startsWith('en');
  const getCatLabel = (cat) => cat.emoji + ' ' + (isEn ? cat.labelEn : cat.labelEs);

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setCategory('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) { setError(t('transactions.form.validation.descriptionRequired')); return; }
    if (!amount || Number(amount) <= 0) { setError(t('transactions.form.validation.amountRequired')); return; }
    if (!date) { setError(t('transactions.form.validation.dateRequired')); return; }

    const payload = {
      description: description.trim(),
      amount: parseFloat(amount),
      type,
      date,
      ...(category ? { category } : {}),
    };

    setLoading(true);
    try {
      await onSubmit(payload);
      showSuccess(isEditing ? t('transactions.messages.updated') : t('transactions.messages.created'));
    } catch (err) {
      const msg = err.response?.data?.message ?? '';
      if (err.response?.status === 429 && msg.includes('Demo limit')) {
        setDemoLimitReached(true);
        showWarning(t('transactions.messages.demoWarning'));
      } else {
        showError(msg || t('transactions.form.validation.genericError'));
      }
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition';

  const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-white">
            {isEditing ? t('transactions.form.editTitle') : t('transactions.form.createTitle')}
          </h2>
          <button
            onClick={onCancel}
            aria-label={t('common.cancel')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-150 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-900/50 border border-red-700 text-red-400 text-sm">
              {error}
            </div>
          )}

          {demoLimitReached && (
            <div className="px-4 py-3 rounded-lg bg-amber-900/40 border border-amber-700 text-amber-300 text-sm">
              {t('transactions.form.demoLimit')}{' '}
              <a href="/settings" className="underline text-emerald-400 hover:text-emerald-300">
                {t('transactions.form.demoLimitLink')}
              </a>{' '}
              {t('transactions.form.demoLimitSuffix')}
            </div>
          )}

          <div>
            <label htmlFor="tf-description" className={labelClass}>{t('transactions.form.description')}</label>
            <input
              id="tf-description"
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('transactions.form.descriptionPlaceholder')}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tf-amount" className={labelClass}>{t('transactions.form.amount')}</label>
              <input
                id="tf-amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="tf-type" className={labelClass}>{t('transactions.form.type')}</label>
              <select id="tf-type" value={type} onChange={handleTypeChange} className={inputClass}>
                <option value="expense">{t('transactions.form.typeExpense')}</option>
                <option value="income">{t('transactions.form.typeIncome')}</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="tf-category" className={labelClass}>
              {t('transactions.form.category')}{' '}
              <span className="text-slate-500 font-normal">{t('transactions.form.categoryOptional')}</span>
            </label>
            <select id="tf-category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="">{t('transactions.form.aiCategorize')}</option>
              {getCategoriesByType(type).map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {getCatLabel(cat)}
                </option>
              ))}
              {hasCustomCategory && (
                <option value={initialData.category}>
                  {t('transactions.form.customCategory', { value: initialData.category })}
                </option>
              )}
            </select>
          </div>

          <div>
            <label htmlFor="tf-date" className={labelClass}>{t('transactions.form.date')}</label>
            <input
              id="tf-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm font-medium transition-all duration-150 active:scale-95"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-semibold text-sm transition-all duration-150 active:scale-95 hover:shadow-lg hover:shadow-emerald-900/30"
            >
              {loading
                ? t('transactions.form.saving')
                : isEditing
                ? t('transactions.form.update')
                : t('transactions.form.create')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
