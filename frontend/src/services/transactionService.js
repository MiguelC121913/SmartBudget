import api from './api';

/**
 * Fetch a paginated, filtered list of transactions.
 * @param {{ type?: string, category?: string, startDate?: string, endDate?: string, limit?: number, skip?: number }} [params]
 */
export function listTransactions(params = {}) {
  return api.get('/api/transactions', { params }).then((r) => r.data);
}

/**
 * Create a new transaction. Omit `category` to trigger AI auto-categorisation.
 * @param {{ description: string, amount: number, type: string, category?: string, date: string }} data
 */
export function createTransaction(data) {
  return api.post('/api/transactions', data).then((r) => r.data);
}

/**
 * Update an existing transaction by id.
 * @param {string} id
 * @param {Partial<{ description: string, amount: number, type: string, category: string, date: string }>} data
 */
export function updateTransaction(id, data) {
  return api.put(`/api/transactions/${id}`, data).then((r) => r.data);
}

/**
 * Delete a transaction by id.
 * @param {string} id
 */
export function deleteTransaction(id) {
  return api.delete(`/api/transactions/${id}`).then((r) => r.data);
}

/**
 * Fetch a single transaction by id.
 * @param {string} id
 */
export function getTransaction(id) {
  return api.get(`/api/transactions/${id}`).then((r) => r.data);
}

/**
 * Ask the AI to re-categorise an existing transaction.
 * @param {string} id
 */
export function recategorizeTransaction(id) {
  return api.post(`/api/transactions/${id}/recategorize`).then((r) => r.data);
}
