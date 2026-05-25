import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, TrendingUp, TrendingDown, Scale, LogOut, Key, Zap, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useTransactions from '../hooks/useTransactions';
import useSettings from '../hooks/useSettings';
import TransactionList from '../components/TransactionList';
import TransactionForm from '../components/TransactionForm';
import TransactionFilters from '../components/TransactionFilters';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import MonthlyBarChart from '../components/charts/MonthlyBarChart';
import BalanceLineChart from '../components/charts/BalanceLineChart';
import TopCategoriesCard from '../components/TopCategoriesCard';
import MonthlyReport from '../components/MonthlyReport';
import LanguageToggle from '../components/LanguageToggle';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { showError } = useToast();

  const {
    transactions,
    loading,
    error,
    filters,
    setFilters,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    recategorize,
  } = useTransactions();

  const { settings: byokSettings } = useSettings();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const kpis = useMemo(() => {
    const now = new Date();
    const thisMonth = (t) => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    };
    const income = transactions
      .filter((t) => t.type === 'income' && thisMonth(t))
      .reduce((s, t) => s + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'expense' && thisMonth(t))
      .reduce((s, t) => s + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  const handleLogout = () => { logout(); navigate('/'); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };

  const handleCreate = async (data) => {
    await createTransaction(data);
    closeForm();
  };

  const handleUpdate = async (data) => {
    await updateTransaction(editing._id, data);
    closeForm();
  };

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
    } catch (err) {
      showError(err.response?.data?.message ?? t('transactions.messages.deleteError'));
    }
  };

  const handleRecategorize = async (id) => {
    try {
      await recategorize(id);
    } catch (err) {
      showError(err.response?.data?.message ?? t('transactions.messages.recategorizeError'));
    }
  };

  const openEdit = (transaction) => { setEditing(transaction); setFormOpen(true); };

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span className="font-bold tracking-tight text-white">SmartBudget</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 hidden sm:block">
              {t('dashboard.greeting', { name: user?.name })}
            </span>

            {byokSettings !== null && (
              <button
                onClick={() => navigate('/settings')}
                title={t('common.viewSettings')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 active:scale-95 border ${
                  byokSettings.hasCustomKey
                    ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400 hover:bg-emerald-900/50'
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {byokSettings.hasCustomKey ? (
                  <><Key className="w-3 h-3" /> {t('dashboard.byokActive')}</>
                ) : (
                  <><Zap className="w-3 h-3" /> {t('dashboard.demoMode')}</>
                )}
              </button>
            )}

            <LanguageToggle />

            <button
              onClick={() => navigate('/settings')}
              title={t('common.settings')}
              aria-label={t('common.settings')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150 active:scale-95"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-150 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <KpiCard
            index={0}
            icon={TrendingUp}
            label={t('dashboard.kpi.income')}
            value={formatCurrency(kpis.income)}
            color="text-emerald-400"
            bg="bg-emerald-900/20 border-emerald-800/50"
          />
          <KpiCard
            index={1}
            icon={TrendingDown}
            label={t('dashboard.kpi.expense')}
            value={formatCurrency(kpis.expenses)}
            color="text-red-400"
            bg="bg-red-900/20 border-red-800/50"
          />
          <KpiCard
            index={2}
            icon={Scale}
            label={t('dashboard.kpi.balance')}
            value={formatCurrency(kpis.balance)}
            color={kpis.balance >= 0 ? 'text-sky-400' : 'text-orange-400'}
            bg={kpis.balance >= 0 ? 'bg-sky-900/20 border-sky-800/50' : 'bg-orange-900/20 border-orange-800/50'}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">{t('dashboard.transactions')}</h2>
          <button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-sm transition-all duration-150 active:scale-95 shadow-lg shadow-emerald-900/30 hover:shadow-xl hover:shadow-emerald-900/40"
          >
            <Plus className="w-4 h-4" />
            {t('dashboard.newTransaction')}
          </button>
        </div>

        {/* Fetch error banner (persistent) */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/50 border border-red-700 text-red-400 text-sm">
            {error}
          </div>
        )}

        <TransactionFilters filters={filters} onFiltersChange={setFilters} />

        {/* ── Charts ──────────────────────────────────────────────────────── */}
        <section className="mt-6 mb-8">
          <h2 className="text-base font-semibold text-white mb-4">{t('dashboard.analysis')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {loading ? <ChartSkeleton /> : <CategoryPieChart transactions={transactions} />}
            {loading ? <ChartSkeleton /> : <MonthlyBarChart transactions={transactions} />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              {loading ? <ChartSkeleton /> : <BalanceLineChart transactions={transactions} />}
            </div>
            {loading ? <ChartSkeleton /> : <TopCategoriesCard transactions={transactions} />}
          </div>
        </section>

        {/* Monthly AI report */}
        <div className="mb-8">
          <MonthlyReport />
        </div>

        {/* Transaction list */}
        <div className="mt-2">
          <TransactionList
            transactions={transactions}
            loading={loading}
            onEdit={openEdit}
            onDelete={handleDelete}
            onRecategorize={handleRecategorize}
          />
        </div>
      </main>

      <AnimatePresence>
        {formOpen && (
          <TransactionForm
            key="transaction-form"
            isEditing={!!editing}
            initialData={editing ?? undefined}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={closeForm}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-72 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 bg-slate-700 rounded" />
        <div className="h-3 bg-slate-700 rounded w-32" />
      </div>
      <div className="flex items-center justify-center h-52">
        <div className="w-28 h-28 rounded-full bg-slate-700/60" />
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, bg, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1, ease: 'easeOut' }}
      className={`${bg} border rounded-xl p-5 flex items-center gap-4 shadow-xl shadow-slate-950/50`}
    >
      <Icon className={`w-7 h-7 shrink-0 ${color}`} />
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className={`text-lg font-bold ${color} mt-0.5`}>{value}</p>
      </div>
    </motion.div>
  );
}
