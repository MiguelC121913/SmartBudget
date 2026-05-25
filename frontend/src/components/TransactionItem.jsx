import { motion } from 'framer-motion';
import { ArrowDownCircle, ArrowUpCircle, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';
import { getCategoryLabel, getCategoryEmoji } from '../utils/categories';
import useConfirm from '../hooks/useConfirm';

export default function TransactionItem({ transaction, onEdit, onDelete, onRecategorize }) {
  const [confirm, ConfirmDialog] = useConfirm();
  const { t } = useTranslation();
  const isExpense = transaction.type === 'expense';
  const emoji = getCategoryEmoji(transaction.category);
  const label = getCategoryLabel(transaction.category);
  const date = formatRelativeDate(transaction.date);

  const handleDelete = async () => {
    const ok = await confirm(
      t('transactions.delete.message', { description: transaction.description }),
      t('transactions.delete.title'),
    );
    if (ok) onDelete(transaction._id);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -80 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors rounded-lg group"
      >
        <div className="shrink-0 mt-0.5">
          {isExpense ? (
            <ArrowDownCircle className="w-7 h-7 text-red-400" />
          ) : (
            <ArrowUpCircle className="w-7 h-7 text-emerald-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center md:gap-2">
            <p className="text-sm font-semibold text-white truncate">{transaction.description}</p>
            <span className="inline-flex items-center gap-1 self-start md:self-auto mt-1 md:mt-0 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300 whitespace-nowrap">
              {emoji} {label}
              {transaction.categorizedByAI && <span title="AI">✨</span>}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 md:hidden whitespace-nowrap">{date}</p>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-xs text-slate-500 whitespace-nowrap">{date}</span>
            <p className={`text-sm font-bold whitespace-nowrap ${isExpense ? 'text-red-400' : 'text-emerald-400'}`}>
              {isExpense ? '−' : '+'}{formatCurrency(transaction.amount)}
            </p>
          </div>

          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onRecategorize(transaction._id)}
              title={t('transactions.item.recategorize')}
              aria-label={t('transactions.item.recategorize')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-700 transition-all duration-150 active:scale-95 hover:[&>svg]:rotate-12"
            >
              <RefreshCw className="w-3.5 h-3.5 transition-transform duration-200" />
            </button>
            <button
              onClick={() => onEdit(transaction)}
              title={t('transactions.item.edit')}
              aria-label={t('transactions.item.edit')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-150 active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              title={t('transactions.item.delete')}
              aria-label={t('transactions.item.delete')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-all duration-150 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
      {ConfirmDialog}
    </>
  );
}
