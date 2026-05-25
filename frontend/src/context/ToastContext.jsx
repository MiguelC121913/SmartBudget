import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let _nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++_nextId;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const showSuccess = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  const showError   = useCallback((msg) => showToast(msg, 'error'),   [showToast]);
  const showWarning = useCallback((msg) => showToast(msg, 'warning'), [showToast]);
  const showInfo    = useCallback((msg) => showToast(msg, 'info'),    [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, dismiss, showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
