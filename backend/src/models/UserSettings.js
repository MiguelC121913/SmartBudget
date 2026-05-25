const mongoose = require('mongoose');

/**
 * Stores per-user settings, including an AES-256-GCM encrypted Anthropic API key.
 * One document per user (enforced by the unique index on `user`).
 *
 * Encrypted key fields are stored as hex strings:
 *   - encryptedApiKey: the ciphertext
 *   - apiKeyIv:        random 16-byte initialisation vector used during encryption
 *   - apiKeyAuthTag:   GCM authentication tag (16 bytes) used to detect tampering
 */
const userSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    encryptedApiKey: { type: String, default: null },
    apiKeyIv:        { type: String, default: null },
    apiKeyAuthTag:   { type: String, default: null },
    /** Quick check without decryption — true when all encrypted fields are populated. */
    hasCustomKey:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserSettings', userSettingsSchema);
