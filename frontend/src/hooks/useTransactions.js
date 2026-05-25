import { useState, useEffect, useCallback } from 'react';
import * as svc from '../services/transactionService';

const EMPTY_FILTERS = { type: '', category: '', startDate: '', endDate: '' };

/**
 * Manages transaction list state with CRUD operations and filter-driven re-fetching.
 *
 * @returns {{
 *   transactions: object[],
 *   total: number,
 *   loading: boolean,
 *   error: string|null,
 *   filters: object,
 *   setFilters: Function,
 *   fetchTransactions: Function,
 *   createTransaction: Function,
 *   updateTransaction: Function,
 *   deleteTransaction: Function,
 *   recategorize: Function,
 * }}
 */
export default function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Strip empty string values so they are not sent as query params
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const data = await svc.listTransactions(params);
      setTransactions(data.transactions ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al cargar transacciones');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  /** Creates a transaction and prepends it to the list on success. */
  const createTransaction = useCallback(async (data) => {
    const result = await svc.createTransaction(data);
    const created = result.transaction ?? result;
    setTransactions((prev) => [created, ...prev]);
    setTotal((t) => t + 1);
    return created;
  }, []);

  /** Updates a transaction in place within the list. */
  const updateTransaction = useCallback(async (id, data) => {
    const result = await svc.updateTransaction(id, data);
    const updated = result.transaction ?? result;
    setTransactions((prev) => prev.map((t) => (t._id === id ? updated : t)));
    return updated;
  }, []);

  /** Removes a transaction from the list. */
  const deleteTransaction = useCallback(async (id) => {
    await svc.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t._id !== id));
    setTotal((n) => n - 1);
  }, []);

  /** Re-categorises a transaction via AI and updates it in the list. */
  const recategorize = useCallback(async (id) => {
    const result = await svc.recategorizeTransaction(id);
    const updated = result.transaction ?? result;
    setTransactions((prev) => prev.map((t) => (t._id === id ? updated : t)));
    return updated;
  }, []);

  return {
    transactions,
    total,
    loading,
    error,
    filters,
    setFilters,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    recategorize,
  };
}
