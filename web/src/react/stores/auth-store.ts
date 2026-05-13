import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { queryClient } from '../lib/query-client';

export interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: 'user' | 'creator' | 'admin';
  plan: 'free' | 'premium' | 'business';
  points: number;
  level: number;
  favoriteIds: string[];
  visitedPlaceIds: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  addFavorite: (placeId: string) => void;
  removeFavorite: (placeId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),

      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
        localStorage.setItem('etunisia_token', token);
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('etunisia_token');
        queryClient.clear();
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...updates } });
        }
      },

      addFavorite: (placeId) => {
        const current = get().user;
        if (current && !current.favoriteIds.includes(placeId)) {
          set({
            user: {
              ...current,
              favoriteIds: [...current.favoriteIds, placeId],
            },
          });
        }
      },

      removeFavorite: (placeId) => {
        const current = get().user;
        if (current) {
          set({
            user: {
              ...current,
              favoriteIds: current.favoriteIds.filter((id) => id !== placeId),
            },
          });
        }
      },
    }),
    {
      name: 'etunisia-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
