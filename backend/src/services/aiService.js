const Anthropic = require('@anthropic-ai/sdk');

/** Categories the model may return. */
const VALID_CATEGORIES = [
  'food', 'transport', 'entertainment', 'utilities', 'health',
  'shopping', 'education', 'salary', 'investment', 'other_income', 'other',
];

/** Categories that belong exclusively to expenses. */
const EXPENSE_ONLY_CATEGORIES = new Set([
  'food', 'transport', 'entertainment', 'utilities', 'health', 'shopping', 'education',
]);

// Lazy server client — avoids instantiating with a potentially unset env var at
// module load time, and allows tests to inject ANTHROPIC_API_KEY after require().
let _serverClient = null;
const getServerClient = () => {
  if (!_serverClient) {
    _serverClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _serverClient;
};

/**
 * Ask Claude Haiku to classify a transaction into one of the predefined categories.
 * Returns null (never throws) when the AI call fails so the caller can apply a fallback.
 *
 * @param {string} description - Human-readable transaction description.
 * @param {'expense'|'income'} type - Direction of the transaction.
 * @param {string|null} [apiKey] - User's own Anthropic key; uses the server key when omitted.
 * @returns {Promise<string|null>} A valid category string, or null on error.
 */
const categorizeTransaction = async (description, type, apiKey = null) => {
  const client = apiKey ? new Anthropic({ apiKey }) : getServerClient();

  try {
    const incomeCategories  = ['salary', 'investment', 'other_income'];
    const expenseCategories = ['food', 'transport', 'entertainment', 'utilities',
                               'health', 'shopping', 'education', 'other'];

    const allowedCategories = type === 'income' ? incomeCategories : expenseCategories;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 20,
      system:
        'You are a personal finance transaction categorizer. ' +
        'You must respond with exactly ONE word from the allowed categories list. ' +
        'No explanations, no punctuation, no extra text.',
      messages: [
        {
          role: 'user',
          content:
            `Transaction description: "${description}"\n` +
            `Transaction type: ${type}\n\n` +
            `Allowed categories (pick exactly one): ${allowedCategories.join(', ')}\n\n` +
            `Respond with only the category name in lowercase.`,
        },
      ],
    });

    const raw = response.content[0]?.text ?? '';
    const category = raw.trim().toLowerCase().replace(/[^a-z_]/g, '');

    if (!allowedCategories.includes(category)) {
      console.warn(`aiService: invalid category "${category}" for type ${type}, using fallback`);
      return type === 'income' ? 'other_income' : 'other';
    }

    return category;
  } catch (err) {
    console.error('aiService.categorizeTransaction error:', err.message);
    return null;
  }
};

module.exports = { categorizeTransaction };
