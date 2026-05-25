import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

if (import.meta.env.DEV) {
  console.log('API baseURL:', baseURL);
}

const api = axios.create({ baseURL });

// Attach the JWT token to every outgoing request if one is stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 responses, wipe the stale token and redirect to login.
// Skip redirect for auth endpoints — a 401 there is a legitimate "wrong credentials"
// response that the calling code handles itself.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const isAuthEndpoint = url.includes('/api/auth/login') || url.includes('/api/auth/register');

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
