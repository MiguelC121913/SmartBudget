const Anthropic = require('@anthropic-ai/sdk');

const TIMEOUT_MS = 10_000;

/**
 * Validates an Anthropic API key by making a minimal, low-cost test call
 * (claude-haiku-4-5 with max_tokens: 5).
 *
 * Returns a structured result rather than throwing so callers can map each
 * failure reason to a user-facing message without catching raw SDK errors.
 *
 * @param {string} apiKey - The key to validate.
 * @returns {Promise<
 *   { valid: true } |
 *   { valid: false, reason: 'invalid_key'|'rate_limited'|'no_credits'|'unknown', message?: string }
 * >}
 */
async function validateAnthropicKey(apiKey) {
  const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS });

  try {
    await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'Say "ok"' }],
    });
    return { valid: true };
  } catch (err) {
    const status = err.status;

    if (status === 401) return { valid: false, reason: 'invalid_key' };
    if (status === 429) return { valid: false, reason: 'rate_limited' };
    if (status === 402) return { valid: false, reason: 'no_credits' };

    return { valid: false, reason: 'unknown', message: err.message };
  }
}

module.exports = { validateAnthropicKey };
