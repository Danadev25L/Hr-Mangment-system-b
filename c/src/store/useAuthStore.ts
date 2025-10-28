import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, User, UserRole } from '@/src/types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Set authentication data after successful login (like React client)
      setAuth: ({ token, user }: { token: string; user: User }) => {
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },

      setUser: (user: User | null) =>
        set({ user, isAuthenticated: !!user }),

      setToken: (token: string | null) =>
        set({ token }),

      setRole: (role: UserRole) =>
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        })),

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        // Also clear localStorage like React client
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      },
    }),
    {
      name: 'hrs-auth-storage', // Match React client naming
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields like React client
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
