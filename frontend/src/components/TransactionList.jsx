import { Inbox } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import TransactionItem from './TransactionItem';

/** Five placeholder rows shown while transactions are loading. */
function SkeletonRows() {
  return (
    <div className="border border-slate-700/60 rounded-xl bg-slate-800/30 overflow-hidden">
      <div className="divide-y divide-slate-700/40">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-700 rounded w-2/5" />
              <div className="h-2.5 bg-slate-700/60 rounded w-1/4" />
            </div>
            <div className="h-4 bg-slate-700 rounded w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TransactionList({ transactions, loading, onEdit, onDelete, onRecategorize }) {
  const { t } = useTranslation();

  if (loading) return <SkeletonRows />;

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Inbox className="w-12 h-12 text-slate-600 mb-4" />
        <p className="text-slate-400 font-medium">{t('transactions.emptyState')}</p>
        <p className="text-slate-500 text-sm mt-1">{t('transactions.emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-700/60 rounded-xl bg-slate-800/30 overflow-hidden">
      <div className="divide-y divide-slate-700/40">
        <AnimatePresence initial={false}>
          {transactions.map((tx) => (
            <TransactionItem
              key={tx._id}
              transaction={tx}
              onEdit={onEdit}
              onDelete={onDelete}
              onRecategorize={onRecategorize}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
