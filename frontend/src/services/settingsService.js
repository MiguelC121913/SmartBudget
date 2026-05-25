import api from './api';

/**
 * Fetch the current API key settings for the authenticated user.
 * Returns { hasCustomKey: boolean, apiKeyLastFour?: string }
 */
export function getSettings() {
  return api.get('/api/settings').then((r) => r.data);
}

/**
 * Save and validate a new Anthropic API key.
 * @param {string} apiKey
 * @returns {Promise<{ hasCustomKey: boolean, apiKeyLastFour: string }>}
 */
export function updateApiKey(apiKey) {
  return api.put('/api/settings/api-key', { apiKey }).then((r) => r.data);
}

/**
 * Remove the stored API key, reverting the user to demo mode.
 * @returns {Promise<{ hasCustomKey: boolean }>}
 */
export function deleteApiKey() {
  return api.delete('/api/settings/api-key').then((r) => r.data);
}
