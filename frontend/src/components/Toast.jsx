import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const CONFIG = {
  success: { Icon: CheckCircle, border: 'border-emerald-700', bg: 'bg-emerald-950/90', text: 'text-emerald-300', iconClass: 'text-emerald-400' },
  error:   { Icon: XCircle,      border: 'border-red-700',     bg: 'bg-red-950/90',     text: 'text-red-300',     iconClass: 'text-red-400'     },
  warning: { Icon: AlertTriangle, border: 'border-amber-700',  bg: 'bg-amber-950/90',   text: 'text-amber-300',   iconClass: 'text-amber-400'   },
  info:    { Icon: Info,          border: 'border-sky-700',     bg: 'bg-sky-950/90',     text: 'text-sky-300',     iconClass: 'text-sky-400'     },
};

function ToastItem({ toast, onDismiss }) {
  const cfg = CONFIG[toast.type] ?? CONFIG.info;
  const { Icon } = cfg;

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-sm ${cfg.bg} ${cfg.border}`}
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconClass}`} />
      <p className={`flex-1 text-sm leading-snug ${cfg.text}`}>{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="p-0.5 rounded text-slate-500 hover:text-white transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default function Toast() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
