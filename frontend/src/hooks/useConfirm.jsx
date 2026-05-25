import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Inner dialog — motion elements handle entry/exit; AnimatePresence in parent controls lifecycle. */
function ConfirmDialogInner({ title, message, onConfirm, onCancel }) {
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-slate-400">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm font-medium transition-all duration-150 active:scale-95"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-150 active:scale-95 hover:shadow-lg hover:shadow-red-900/30"
          >
            {t('common.confirm')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Returns [confirm, ConfirmDialog].
 * `confirm(message, title?)` returns Promise<boolean>.
 * Render `{ConfirmDialog}` anywhere in the component's JSX.
 */
export default function useConfirm() {
  const [open, setOpen] = useState(false);
  const [dialogState, setDialogState] = useState({ title: '', message: '' });
  const resolveRef = useRef(null);

  const confirm = useCallback((message, title = '¿Estás seguro?') => {
    setDialogState({ title, message });
    setOpen(true);
    return new Promise((resolve) => { resolveRef.current = resolve; });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(true);
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(false);
  }, []);

  const ConfirmDialog = (
    <AnimatePresence>
      {open && (
        <ConfirmDialogInner
          key="confirm-dialog"
          title={dialogState.title}
          message={dialogState.message}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </AnimatePresence>
  );

  return [confirm, ConfirmDialog];
}
