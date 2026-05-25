import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '../utils/categories';

/**
 * Horizontal filter bar for type, category, and date range.
 */
export default function TransactionFilters({ filters, onFiltersChange }) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const update = (key, value) => onFiltersChange({ ...filters, [key]: value });
  const clear = () => onFiltersChange({ type: '', category: '', startDate: '', endDate: '' });
  const hasActiveFilters = filters.type || filters.category || filters.startDate || filters.endDate;

  const typeBtn = (value, label) => {
    const active = filters.type === value;
    return (
      <button
        key={value}
        onClick={() => update('type', active ? '' : value)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 ${
          active
            ? value === 'expense'
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : value === 'income'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-slate-600 text-white border border-slate-500'
            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-slate-300'
        }`}
      >
        {label}
      </button>
    );
  };

  const inputClass =
    'bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition';

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <div className="flex items-center gap-1">
        {typeBtn('', t('transactions.filters.all'))}
        {typeBtn('expense', t('transactions.filters.expense'))}
        {typeBtn('income', t('transactions.filters.income'))}
      </div>

      <select
        value={filters.category}
        onChange={(e) => update('category', e.target.value)}
        className={inputClass}
      >
        <option value="">{t('transactions.filters.allCategories')}</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.emoji} {isEn ? cat.labelEn : cat.labelEs}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={filters.startDate}
        onChange={(e) => update('startDate', e.target.value)}
        className={`${inputClass} w-36`}
        title={t('transactions.filters.dateFrom')}
        aria-label={t('transactions.filters.dateFrom')}
      />
      <span className="text-slate-500 text-xs">→</span>
      <input
        type="date"
        value={filters.endDate}
        onChange={(e) => update('endDate', e.target.value)}
        className={`${inputClass} w-36`}
        title={t('transactions.filters.dateTo')}
        aria-label={t('transactions.filters.dateTo')}
      />

      {hasActiveFilters && (
        <button
          onClick={clear}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all duration-150 active:scale-95"
        >
          {t('transactions.filters.clearFilters')}
        </button>
      )}
    </div>
  );
}
