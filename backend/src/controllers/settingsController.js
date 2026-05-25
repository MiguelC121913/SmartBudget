const UserSettings = require('../models/UserSettings');
const { encrypt, decrypt } = require('../services/encryptionService');
const { validateAnthropicKey } = require('../services/anthropicValidator');

/** User-facing messages mapped from Anthropic validation failure reasons. */
const VALIDATION_MESSAGES = {
  invalid_key:  'La API key no es válida. Verifica que sea correcta en console.anthropic.com.',
  rate_limited: 'Tu cuenta de Anthropic tiene demasiadas solicitudes activas. Intenta en unos minutos.',
  no_credits:   'Tu cuenta de Anthropic no tiene créditos disponibles. Recarga en console.anthropic.com.',
  unknown:      'No se pudo verificar la API key con Anthropic. Intenta de nuevo.',
};

/**
 * Safely extracts the last 4 characters of a decrypted key for display.
 * Returns null without crashing if decryption fails.
 *
 * @param {object} settings - UserSettings document (plain object).
 * @returns {string|null}
 */
function getLastFour(settings) {
  try {
    const plain = decrypt({
      encrypted: settings.encryptedApiKey,
      iv:        settings.apiKeyIv,
      authTag:   settings.apiKeyAuthTag,
    });
    return plain.slice(-4);
  } catch {
    return null;
  }
}

/**
 * @desc  Get current API key settings for the authenticated user.
 *        NEVER returns the key in full — only the last 4 characters.
 * @route GET /api/settings
 * @access Private
 */
const getSettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ user: req.user._id }).lean();

    if (!settings?.hasCustomKey) {
      return res.json({ hasCustomKey: false });
    }

    return res.json({
      hasCustomKey:    true,
      apiKeyLastFour:  getLastFour(settings),
    });
  } catch (err) {
    console.error('settingsController.getSettings:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc  Save and validate a new Anthropic API key for the authenticated user.
 * @route PUT /api/settings/api-key
 * @access Private
 */
const updateApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    // Basic format guard before spending a round-trip to Anthropic.
    if (
      !apiKey ||
      typeof apiKey !== 'string' ||
      !apiKey.startsWith('sk-ant-') ||
      apiKey.length < 20
    ) {
      return res.status(400).json({
        message: 'Formato de API key inválido. Debe comenzar con "sk-ant-".',
      });
    }

    const validation = await validateAnthropicKey(apiKey);

    if (!validation.valid) {
      return res.status(400).json({
        message: VALIDATION_MESSAGES[validation.reason] ?? VALIDATION_MESSAGES.unknown,
      });
    }

    const { encrypted, iv, authTag } = encrypt(apiKey);

    await UserSettings.findOneAndUpdate(
      { user: req.user._id },
      {
        encryptedApiKey: encrypted,
        apiKeyIv:        iv,
        apiKeyAuthTag:   authTag,
        hasCustomKey:    true,
      },
      { upsert: true, new: true }
    );

    return res.json({
      hasCustomKey:   true,
      apiKeyLastFour: apiKey.slice(-4),
    });
  } catch (err) {
    console.error('settingsController.updateApiKey:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc  Remove the stored API key for the authenticated user.
 * @route DELETE /api/settings/api-key
 * @access Private
 */
const deleteApiKey = async (req, res) => {
  try {
    await UserSettings.findOneAndUpdate(
      { user: req.user._id },
      {
        encryptedApiKey: null,
        apiKeyIv:        null,
        apiKeyAuthTag:   null,
        hasCustomKey:    false,
      }
    );

    return res.json({ hasCustomKey: false });
  } catch (err) {
    console.error('settingsController.deleteApiKey:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getSettings, updateApiKey, deleteApiKey };
