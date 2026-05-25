import i18n from '../i18n/config';

/** Canonical category definitions. Values are the English codes the backend expects. */
export const CATEGORIES = [
  { value: 'food',          labelEs: 'Comida',          labelEn: 'Food',          emoji: '🍔', type: 'expense' },
  { value: 'transport',     labelEs: 'Transporte',       labelEn: 'Transport',     emoji: '🚗', type: 'expense' },
  { value: 'entertainment', labelEs: 'Entretenimiento',  labelEn: 'Entertainment', emoji: '🎬', type: 'expense' },
  { value: 'utilities',     labelEs: 'Servicios',        labelEn: 'Utilities',     emoji: '💡', type: 'expense' },
  { value: 'health',        labelEs: 'Salud',            labelEn: 'Health',        emoji: '🏥', type: 'expense' },
  { value: 'shopping',      labelEs: 'Compras',          labelEn: 'Shopping',      emoji: '🛍️', type: 'expense' },
  { value: 'education',     labelEs: 'Educación',        labelEn: 'Education',     emoji: '📚', type: 'expense' },
  { value: 'salary',        labelEs: 'Salario',          labelEn: 'Salary',        emoji: '💰', type: 'income' },
  { value: 'investment',    labelEs: 'Inversión',        labelEn: 'Investment',    emoji: '📈', type: 'income' },
  { value: 'other_income',  labelEs: 'Otros ingresos',   labelEn: 'Other income',  emoji: '💵', type: 'income' },
  { value: 'other',         labelEs: 'Otro',             labelEn: 'Other',         emoji: '📦', type: 'expense' },
];

/**
 * Returns the display label for a category value in the current UI language.
 * Falls back to a capitalised version of the raw value when not found.
 * @param {string} value
 * @param {string} [lang] - Override language; defaults to i18n.language.
 * @returns {string}
 */
export function getCategoryLabel(value, lang) {
  const resolvedLang = lang ?? i18n.language ?? 'es';
  const cat = CATEGORIES.find((c) => c.value === value);
  if (!cat) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
  }
  return resolvedLang.startsWith('en') ? cat.labelEn : cat.labelEs;
}

/**
 * Returns the emoji for a category value. Defaults to 📦.
 * @param {string} value
 * @returns {string}
 */
export function getCategoryEmoji(value) {
  return CATEGORIES.find((c) => c.value === value)?.emoji ?? '📦';
}

/**
 * Returns categories for the given transaction type, always including 'other'.
 * @param {'expense'|'income'} type
 * @returns {typeof CATEGORIES}
 */
export function getCategoriesByType(type) {
  const filtered = CATEGORIES.filter((c) => c.type === type);
  // 'other' has type 'expense'; for income lists we append it manually.
  if (type === 'income' && !filtered.some((c) => c.value === 'other')) {
    const other = CATEGORIES.find((c) => c.value === 'other');
    if (other) filtered.push(other);
  }
  return filtered;
}
