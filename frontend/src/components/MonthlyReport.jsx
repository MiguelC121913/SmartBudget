import { useState, useMemo } from 'react';
import { FileText, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Markdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { generateMonthlyReport } from '../services/reportService';
import { useToast } from '../context/ToastContext';

const MD_COMPONENTS = {
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-white uppercase tracking-wide mt-5 mb-2 pb-1 border-b border-slate-700">
      {children}
    </h2>
  ),
  p:  ({ children }) => <p className="text-sm text-slate-300 leading-relaxed my-1">{children}</p>,
  ul: ({ children }) => <ul className="space-y-1.5 my-2">{children}</ul>,
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-sm text-slate-300">
      <span className="text-emerald-400 shrink-0 mt-px">•</span>
      <span className="leading-snug">{children}</span>
    </li>
  ),
};

function ReportSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Stats strip placeholder */}
      <div className="grid grid-cols-3 gap-3 pb-4 border-b border-slate-700/60">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1.5 text-center">
            <div className="h-2.5 bg-slate-700/60 rounded mx-auto w-12" />
            <div className="h-4 bg-slate-700 rounded mx-auto w-16" />
          </div>
        ))}
      </div>
      {/* Section headers + lines */}
      {[40, 100, 100, 60].map((w, i) => (
        <div key={i} className="space-y-2">
          <div className={`h-3 bg-slate-700 rounded`} style={{ width: `${w}%` }} />
          {i < 3 && (
            <>
              <div className="h-2.5 bg-slate-700/60 rounded w-full" />
              <div className="h-2.5 bg-slate-700/60 rounded w-4/5" />
              {i > 0 && <div className="h-2.5 bg-slate-700/60 rounded w-3/4" />}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function MonthlyReport() {
  const { showError } = useToast();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'es';

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  // Session cache: { "2026-5": { report, stats, message? }, ... }
  const [reports, setReports] = useState({});

  const options = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: `${t(`months.${d.getMonth() + 1}`)} ${d.getFullYear()}`,
      });
    }
    return opts;
  }, [t]);

  const { year, month } = options[selectedIdx];
  const cacheKey = `${year}-${month}-${lang}`;
  const currentReport = reports[cacheKey] ?? null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateMonthlyReport(year, month);
      setReports((prev) => ({ ...prev, [cacheKey]: data }));
    } catch (err) {
      const msg = err.response?.data?.message ?? t('report.error', 'Error al generar el reporte.');
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (e) => {
    setSelectedIdx(Number(e.target.value));
    // No cache reset — switching preserves previously generated reports.
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-xl shadow-slate-950/50"
    >

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
          <h2 className="text-base font-semibold text-white">{t('report.title')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedIdx}
            onChange={handleSelectChange}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {options.map((o, i) => (
              <option key={i} value={i}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-semibold text-sm transition-all duration-150 active:scale-95 hover:shadow-lg hover:shadow-emerald-900/30 whitespace-nowrap"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentReport?.report ? (
              <><RefreshCw className="w-4 h-4" /> {t('report.regenerate')}</>
            ) : (
              t('report.generate')
            )}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && <ReportSkeleton />}

      {/* No-data message from backend */}
      {!loading && currentReport?.message && !currentReport?.report && (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-8">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
          {currentReport.message}
        </div>
      )}

      {/* Report content */}
      {!loading && currentReport?.report && (
        <div>
          {currentReport.stats && (
            <div className="grid grid-cols-3 gap-3 mb-5 pb-5 border-b border-slate-700">
              <StatChip label={t('report.stats.income')} value={`$${currentReport.stats.income.toFixed(2)}`} color="text-emerald-400" />
              <StatChip label={t('report.stats.expense')} value={`$${currentReport.stats.expense.toFixed(2)}`} color="text-red-400" />
              <StatChip
                label={t('report.stats.balance')}
                value={`$${currentReport.stats.balance.toFixed(2)}`}
                color={currentReport.stats.balance >= 0 ? 'text-sky-400' : 'text-orange-400'}
              />
            </div>
          )}
          <Markdown components={MD_COMPONENTS}>{currentReport.report}</Markdown>
        </div>
      )}

      {/* Empty state */}
      {!loading && !currentReport && (
        <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
          <FileText className="w-9 h-9 text-slate-700" />
          <p className="text-sm text-center max-w-xs">{t('report.emptyHint')}</p>
        </div>
      )}
    </motion.section>
  );
}
