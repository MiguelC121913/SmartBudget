const UserSettings = require('../models/UserSettings');
const { decrypt } = require('../services/encryptionService');

/**
 * Retrieves and decrypts the user's custom Anthropic API key.
 * Returns null when the user has no stored key or when decryption fails,
 * allowing the caller to fall back gracefully to the server's own key.
 *
 * Failures are logged by error category only — the plaintext key and the
 * encryption secret are never included in log output.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {Promise<string|null>}
 */
async function getUserApiKey(userId) {
  try {
    const settings = await UserSettings.findOne({ user: userId }).lean();

    if (!settings?.encryptedApiKey) return null;

    return decrypt({
      encrypted: settings.encryptedApiKey,
      iv:        settings.apiKeyIv,
      authTag:   settings.apiKeyAuthTag,
    });
  } catch (err) {
    // Log the error category without exposing the plaintext key or secret.
    console.error(`getUserApiKey: decryption failed for user ${userId} — ${err.message}`);
    return null;
  }
}

module.exports = { getUserApiKey };
