const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/**
 * Formats a number as MXN currency string.
 * @param {number} amount
 * @returns {string}  e.g. "$1,234.56"
 */
export function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

/**
 * Formats an ISO date string as "DD MMM YYYY" in Spanish.
 * @param {string|Date} dateString
 * @returns {string}  e.g. "19 may. 2026"
 */
export function formatDate(dateString) {
  return dateFormatter.format(new Date(dateString));
}

/**
 * Returns a human-readable relative label for recent dates,
 * falling back to formatDate for anything older than 6 days.
 * @param {string|Date} dateString
 * @returns {string}  "Hoy" | "Ayer" | "Hace N días" | formatted date
 */
export function formatRelativeDate(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0);
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays > 1 && diffDays <= 6) return `Hace ${diffDays} días`;
  return formatDate(dateString);
}
