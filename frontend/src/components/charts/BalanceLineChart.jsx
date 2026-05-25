import { useMemo, memo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getCumulativeBalance } from '../../utils/analytics';
import { formatCurrency } from '../../utils/formatters';

function fmtY(v) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v}`;
}

const BalanceLineChart = memo(function BalanceLineChart({ transactions }) {
  const { t } = useTranslation();
  const data = useMemo(() => getCumulativeBalance(transactions), [transactions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-xl shadow-slate-950/50"
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-white">{t('charts.cumulativeBalance')}</h3>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-2">
          <TrendingUp className="w-8 h-8 opacity-40" />
          <p className="text-sm">{t('charts.noTransactions')}</p>
        </div>
      ) : (
        // Dynamic line color per-balance-sign is non-trivial in Recharts; stays emerald.
        <ResponsiveContainer width="100%" height={256}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -4, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{ value: t('charts.day'), position: 'insideBottomRight', offset: -2, fill: '#64748b', fontSize: 10 }}
            />
            <YAxis tickFormatter={fmtY} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const val = payload[0].value;
                return (
                  <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm shadow-lg">
                    <p className="text-slate-500 text-xs mb-0.5">{t('charts.dayLabel', { n: label })}</p>
                    <p className={`font-semibold ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(val)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#balanceGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
});

export default BalanceLineChart;
