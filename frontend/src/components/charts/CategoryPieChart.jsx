import { useMemo, memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getCategoryBreakdown } from '../../utils/analytics';
import { getCategoryLabel } from '../../utils/categories';
import { formatCurrency } from '../../utils/formatters';

const PALETTE = [
  '#10b981', '#3b82f6', '#f59e0b', '#f43f5e', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#0ea5e9', '#6b7280',
];

const CategoryPieChart = memo(function CategoryPieChart({ transactions }) {
  const { t } = useTranslation();
  const data = useMemo(
    () => getCategoryBreakdown(transactions, 'expense').map((d) => ({
      ...d,
      name: getCategoryLabel(d.category),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, t], // re-derive labels when language changes
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-xl shadow-slate-950/50"
    >
      <div className="flex items-center gap-2 mb-4">
        <PieIcon className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-white">{t('charts.categoryBreakdown')}</h3>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-2">
          <PieIcon className="w-8 h-8 opacity-40" />
          <p className="text-sm">{t('charts.noExpenses')}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="44%"
              outerRadius={90}
              innerRadius={50}
              isAnimationActive
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const { name, value, payload: p } = payload[0];
                return (
                  <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm shadow-lg">
                    <p className="text-white font-medium">{name}</p>
                    <p className="text-slate-300">{formatCurrency(value)}</p>
                    <p className="text-slate-500 text-xs">{p.percentage}%</p>
                  </div>
                );
              }}
            />
            <Legend
              content={({ payload: lp }) => (
                <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                  {lp?.map((entry, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-slate-300">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      {entry.value}
                      <span className="text-slate-500">({entry.payload?.percentage ?? 0}%)</span>
                    </li>
                  ))}
                </ul>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
});

export default CategoryPieChart;
