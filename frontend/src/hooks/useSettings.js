import { useState, useEffect, useCallback } from 'react';
import * as svc from '../services/settingsService';

/**
 * Manages the user's API key settings.
 *
 * @returns {{
 *   settings: { hasCustomKey: boolean, apiKeyLastFour?: string } | null,
 *   loading: boolean,
 *   error: string | null,
 *   updateApiKey: (key: string) => Promise<{ success: boolean, error?: string }>,
 *   deleteApiKey: () => Promise<{ success: boolean, error?: string }>,
 *   refresh: () => void,
 * }}
 */
export default function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await svc.getSettings();
      setSettings(data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const updateApiKey = async (apiKey) => {
    try {
      const data = await svc.updateApiKey(apiKey);
      setSettings(data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Error al guardar la API key',
      };
    }
  };

  const deleteApiKey = async () => {
    try {
      const data = await svc.deleteApiKey();
      setSettings(data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Error al eliminar la API key',
      };
    }
  };

  return { settings, loading, error, updateApiKey, deleteApiKey, refresh };
}
