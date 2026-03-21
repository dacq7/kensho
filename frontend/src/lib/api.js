import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('budokan_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? '');

    if (status === 401) {
      localStorage.removeItem('budokan_token');
      const skipRedirect =
        url.includes('/auth/login') || url.includes('/auth/me');
      if (!skipRedirect) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);

export default api;
