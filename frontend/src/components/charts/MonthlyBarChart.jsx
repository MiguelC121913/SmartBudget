import { useMemo, memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getMonthlyComparison } from '../../utils/analytics';
import { formatCurrency } from '../../utils/formatters';

function fmtY(v) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

const MonthlyBarChart = memo(function MonthlyBarChart({ transactions }) {
  const { t } = useTranslation();
  const data = useMemo(() => getMonthlyComparison(transactions, 6), [transactions]);
  const isEmpty = data.every((d) => d.income === 0 && d.expense === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-xl shadow-slate-950/50"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-white">{t('charts.monthlyTrend')}</h3>
      </div>

      {isEmpty ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-2">
          <BarChart3 className="w-8 h-8 opacity-40" />
          <p className="text-sm text-center">{t('charts.notEnoughData')}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={256}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtY} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.05)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm shadow-lg">
                    <p className="text-slate-300 font-medium mb-1.5">{label}</p>
                    {payload.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 mb-0.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-slate-400">
                          {p.dataKey === 'income' ? t('charts.income') : t('charts.expense')}:
                        </span>
                        <span className="text-white">{formatCurrency(p.value)}</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-slate-300">
                  {value === 'income' ? t('charts.income') : t('charts.expense')}
                </span>
              )}
            />
            <Bar dataKey="income" name="income" fill="#10b981" radius={[3, 3, 0, 0]} isAnimationActive />
            <Bar dataKey="expense" name="expense" fill="#ef4444" radius={[3, 3, 0, 0]} isAnimationActive />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
});

export default MonthlyBarChart;
