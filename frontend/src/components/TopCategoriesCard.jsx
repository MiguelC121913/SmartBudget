import { useMemo, memo } from 'react';
import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getTopCategories } from '../utils/analytics';
import { getCategoryLabel, getCategoryEmoji } from '../utils/categories';
import { formatCurrency } from '../utils/formatters';

const RANK_STYLES = [
  'bg-amber-400 text-slate-900',
  'bg-slate-400 text-slate-900',
  'bg-amber-700 text-white',
];

const TopCategoriesCard = memo(function TopCategoriesCard({ transactions }) {
  const { t } = useTranslation();
  const categories = useMemo(() => getTopCategories(transactions, 3), [transactions]);
  const maxTotal = categories[0]?.total ?? 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-xl shadow-slate-950/50">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">{t('charts.topCategories')}</h3>
      </div>

      {categories.length === 0 ? (
        <div className="h-40 flex flex-col items-center justify-center text-slate-500 gap-2">
          <Crown className="w-7 h-7 opacity-40" />
          <p className="text-sm">{t('charts.noExpenses')}</p>
        </div>
      ) : (
        <ul className="space-y-5">
          {categories.map(({ category, total, count }, i) => (
            <motion.li
              key={category}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08, ease: 'easeOut' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${RANK_STYLES[i] ?? 'bg-slate-600 text-white'}`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-white font-medium truncate">
                  {getCategoryEmoji(category)} {getCategoryLabel(category)}
                </span>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-white">{formatCurrency(total)}</p>
                  <p className="text-xs text-slate-500">
                    {t('charts.transactionCount', { count })}
                  </p>
                </div>
              </div>
              <div className="ml-9 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 + 0.1, ease: 'easeOut' }}
                />
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default TopCategoriesCard;
