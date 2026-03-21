import { create } from 'zustand';
import api from '../lib/api';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,

  login: (user, token) => {
    localStorage.setItem('budokan_token', token);
    set({
      user,
      token,
      isAuthenticated: true,
      hydrated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('budokan_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  initAuth: async () => {
    const stored = localStorage.getItem('budokan_token');
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
      localStorage.removeItem('budokan_token');
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
