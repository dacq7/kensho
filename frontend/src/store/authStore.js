import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,

  login: (user, token) => {
    localStorage.setItem('kensho_token', token);
    set({
      user,
      token,
      isAuthenticated: true,
      hydrated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('kensho_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  initAuth: async () => {
    const stored = localStorage.getItem('kensho_token');
    if (!stored) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        hydrated: true,
      });
      return;
    }

    set({ token: stored });

    try {
      const { data } = await api.get('/auth/me');
      set({
        user: data,
        token: stored,
        isAuthenticated: true,
        hydrated: true,
      });
    } catch {
      localStorage.removeItem('kensho_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        hydrated: true,
      });
    }
  },
}));

export default useAuthStore;
