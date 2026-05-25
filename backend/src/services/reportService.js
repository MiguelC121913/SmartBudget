const Anthropic = require('@anthropic-ai/sdk');

/**
 * Computes summary statistics from a list of transactions.
 * @param {object[]} transactions
 * @returns {object}
 */
function calcStats(transactions) {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  // Group expenses by category
  const byCategory = {};
  for (const t of transactions.filter((t) => t.type === 'expense')) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }

  const topCategories = Object.entries(byCategory)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  // Infer daysInMonth from the first transaction's date (all txs are in the same month)
  const ref = new Date(transactions[0].date);
  const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();

  return {
    income,
    expense,
    balance: income - expense,
    topCategory: topCategories[0]?.category ?? null,
    topCategories,
    transactionCount: transactions.length,
    avgDailyExpense: daysInMonth > 0 ? expense / daysInMonth : 0,
  };
}

/**
 * Generates a Markdown monthly financial report using Claude Haiku.
 *
 * @param {object[]} transactions - All transactions for the target month.
 * @param {string}   monthLabel   - Human-readable label, e.g. "Mayo 2026".
 * @param {string|null} apiKey    - User's Anthropic key; falls back to server key.
 * @param {'es'|'en'} lang        - Report language.
 */
async function generateMonthlyReport(transactions, monthLabel, apiKey = null, lang = 'es') {
  if (transactions.length === 0) {
    return { success: false, error: 'no_data' };
  }

  const stats = calcStats(transactions);
  const client = new Anthropic({
    apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY,
  });

  // Build a compact transaction summary — no IDs, no Mongo timestamps
  const txSummary = transactions
    .slice(0, 50) // keep prompt size bounded
    .map((t) => `- ${t.description}: $${t.amount.toFixed(2)} (${t.category}, ${t.type})`)
    .join('\n');

  const isEn = lang === 'en';

  const statsBlock = isEn ? [
    `Month: ${monthLabel}`,
    `Total income: $${stats.income.toFixed(2)}`,
    `Total expenses: $${stats.expense.toFixed(2)}`,
    `Balance: $${stats.balance.toFixed(2)}`,
    `Top spending category: ${stats.topCategory ?? 'N/A'}`,
    `Top 3 categories: ${stats.topCategories.map((c) => `${c.category} ($${c.total.toFixed(2)})`).join(', ')}`,
    `Total transactions: ${stats.transactionCount}`,
    `Average daily expense: $${stats.avgDailyExpense.toFixed(2)}`,
  ].join('\n') : [
    `Mes: ${monthLabel}`,
    `Total ingresos: $${stats.income.toFixed(2)}`,
    `Total gastos: $${stats.expense.toFixed(2)}`,
    `Balance: $${stats.balance.toFixed(2)}`,
    `Categoría con mayor gasto: ${stats.topCategory ?? 'N/A'}`,
    `Top 3 categorías: ${stats.topCategories.map((c) => `${c.category} ($${c.total.toFixed(2)})`).join(', ')}`,
    `Total de transacciones: ${stats.transactionCount}`,
    `Gasto diario promedio: $${stats.avgDailyExpense.toFixed(2)}`,
  ].join('\n');

  const systemPrompt = isEn
    ? 'You are a personal financial assistant. Generate monthly reports in English with actionable insights and an empathetic tone. Use simple Markdown: headers (##) and bullets (-). Be concise but useful.'
    : 'Eres un asistente financiero personal. Generas reportes mensuales en español con insights accionables y tono empático. Usa Markdown simple: headers (##) y bullets (-). Sé conciso pero útil.';

  const userMessage = isEn
    ? `My financial statistics for ${monthLabel}:\n\n${statsBlock}\n\nTransactions this month:\n${txSummary}\n\nGenerate a monthly report with exactly these sections:\n## Executive Summary\n(2-3 lines)\n\n## Patterns I Detected\n(3-5 bullets)\n\n## Recommendations\n(3 actionable bullets)\n\n## Motivational Note\n(1 encouraging line)`
    : `Mis estadísticas financieras de ${monthLabel}:\n\n${statsBlock}\n\nTransacciones del mes:\n${txSummary}\n\nGenera un reporte mensual con exactamente estas secciones:\n## Resumen ejecutivo\n(2-3 líneas)\n\n## Patrones que detecté\n(3-5 bullets)\n\n## Recomendaciones\n(3 bullets accionables)\n\n## Nota motivacional\n(1 línea alentadora)`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const report = response.content[0]?.text ?? '';
    return { success: true, report, stats };
  } catch (err) {
    console.error('reportService.generateMonthlyReport error:', err.message);
    const reason = err.status === 429
      ? (isEn ? 'Anthropic rate limit reached. Please try again in a moment.' : 'Límite de solicitudes de Anthropic alcanzado. Intenta en unos momentos.')
      : (isEn ? 'Claude AI is not available at the moment. Please try again.' : 'Claude AI no está disponible en este momento. Intenta de nuevo.');
    return { success: false, error: reason };
  }
}

module.exports = { generateMonthlyReport };
