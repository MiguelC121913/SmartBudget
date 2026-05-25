const MONTH_NAMES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** @param {string|Date} date @param {Date} now */
function sameMonth(date, now) {
  const d = new Date(date);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/**
 * Breaks down transactions by category for a specific type in the current month.
 * @param {object[]} transactions
 * @param {'expense'|'income'} type
 * @returns {{ category: string, total: number, percentage: number }[]}
 */
export function getCategoryBreakdown(transactions, type = 'expense') {
  const now = new Date();
  const filtered = transactions.filter((t) => t.type === type && sameMonth(t.date, now));

  const totals = {};
  for (const t of filtered) {
    totals[t.category] = (totals[t.category] ?? 0) + t.amount;
  }

  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  return Object.entries(totals)
    .map(([category, total]) => ({
      category,
      total,
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Returns monthly income/expense totals for the last N months in chronological order.
 * @param {object[]} transactions
 * @param {number} monthsBack
 * @returns {{ month: string, income: number, expense: number, net: number }[]}
 */
export function getMonthlyComparison(transactions, monthsBack = 6) {
  const now = new Date();

  const buckets = Array.from({ length: monthsBack }, (_, i) => {
    const offset = monthsBack - 1 - i;
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return {
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      month: `${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getFullYear()}`,
      income: 0,
      expense: 0,
    };
  });

  for (const t of transactions) {
    const d = new Date(t.date);
    const bucket = buckets.find(
      (b) => b.year === d.getFullYear() && b.monthIndex === d.getMonth()
    );
    if (!bucket) continue;
    if (t.type === 'income') bucket.income += t.amount;
    else if (t.type === 'expense') bucket.expense += t.amount;
  }

  return buckets.map(({ month, income, expense }) => ({
    month,
    income,
    expense,
    net: income - expense,
  }));
}

/**
 * Returns cumulative daily balance for the target month.
 * Starts with a synthetic day-0 anchor so the chart line always begins at zero.
 * @param {object[]} transactions
 * @param {number} monthOffset  0 = current month, 1 = last month, etc.
 * @returns {{ day: number, balance: number }[]}
 */
export function getCumulativeBalance(transactions, monthOffset = 0) {
  const ref = new Date();
  const target = new Date(ref.getFullYear(), ref.getMonth() - monthOffset, 1);
  const targetYear = target.getFullYear();
  const targetMonth = target.getMonth();

  const inMonth = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
  });

  if (inMonth.length === 0) return [];

  const byDay = {};
  for (const t of inMonth) {
    const day = new Date(t.date).getDate();
    const delta = t.type === 'income' ? t.amount : -t.amount;
    byDay[day] = (byDay[day] ?? 0) + delta;
  }

  const points = [{ day: 0, balance: 0 }];
  let running = 0;
  for (const day of Object.keys(byDay).map(Number).sort((a, b) => a - b)) {
    running += byDay[day];
    points.push({ day, balance: running });
  }

  return points;
}

/**
 * Returns the top N expense categories for the current month by total amount.
 * @param {object[]} transactions
 * @param {number} limit
 * @returns {{ category: string, total: number, count: number }[]}
 */
export function getTopCategories(transactions, limit = 3) {
  const now = new Date();
  const expenses = transactions.filter((t) => t.type === 'expense' && sameMonth(t.date, now));

  const groups = {};
  for (const t of expenses) {
    if (!groups[t.category]) groups[t.category] = { total: 0, count: 0 };
    groups[t.category].total += t.amount;
    groups[t.category].count += 1;
  }

  return Object.entries(groups)
    .map(([category, { total, count }]) => ({ category, total, count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
