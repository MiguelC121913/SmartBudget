const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

/**
 * AES-256-GCM is chosen over AES-CBC because it is an AEAD (Authenticated
 * Encryption with Associated Data) scheme. The authentication tag it produces
 * guarantees both confidentiality AND integrity: any silent bit-flip or
 * truncation of the ciphertext will be detected at decryption time, preventing
 * padding-oracle and ciphertext-modification attacks that affect CBC.
 */

// Validate and materialise the key at module load time so the server fails
// fast on a bad configuration rather than silently falling back.
const secretHex = process.env.ENCRYPTION_SECRET;
if (!secretHex || secretHex.length !== 64) {
  throw new Error(
    'ENCRYPTION_SECRET must be set to exactly 64 hex characters (32 bytes). ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
  );
}
const KEY = Buffer.from(secretHex, 'hex');

/**
 * Encrypts a UTF-8 plaintext string with AES-256-GCM.
 * A fresh random IV is generated per call, so encrypting the same plaintext
 * twice produces different ciphertexts — preventing frequency analysis.
 *
 * @param {string} plaintext - The value to encrypt (e.g. an API key).
 * @returns {{ encrypted: string, iv: string, authTag: string }}
 *   All three values are hex strings safe to persist in the database.
 */
function encrypt(plaintext) {
  const iv = crypto.randomBytes(16); // 128-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]).toString('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return { encrypted, iv: iv.toString('hex'), authTag };
}

/**
 * Decrypts a value previously produced by {@link encrypt}.
 * Throws an error if the auth tag does not match, indicating the ciphertext
 * has been tampered with or the wrong key was used.
 *
 * @param {{ encrypted: string, iv: string, authTag: string }} params - Hex strings.
 * @returns {string} The original UTF-8 plaintext.
 * @throws {Error} When the auth tag is invalid.
 */
function decrypt({ encrypted, iv, authTag }) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, 'hex')
  );
  // setAuthTag must be called before final() for GCM authentication to work.
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final(), // throws if auth tag mismatch
  ]);

  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
