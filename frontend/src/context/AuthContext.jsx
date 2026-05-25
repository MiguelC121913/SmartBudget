import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, validate any stored token against the backend
  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (!stored) {
      setLoading(false);
      return;
    }

    api
      .get('/api/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        setToken(stored);
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Log in an existing user.
   * @returns {{ success: boolean, error?: string }}
   */
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Algo salió mal, intenta de nuevo';
      return { success: false, error: message };
    }
  };

  /**
   * Register a new user and immediately log them in.
   * @returns {{ success: boolean, error?: string }}
   */
  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/api/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Algo salió mal, intenta de nuevo';
      return { success: false, error: message };
    }
  };

  /** Clear session state and stored token. */
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Returns the auth context. Must be used inside <AuthProvider>. */
export function useAuth() {
  return useContext(AuthContext);
}
