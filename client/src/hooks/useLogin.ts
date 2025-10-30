import { useMutation } from '@tanstack/react-query';
import { authService, LoginCredentials } from '@/src/services/auth.service';
import { useAuthStore } from '@/src/store/useAuthStore';
import { App } from 'antd';

// Simple rate limiting for login attempts
let lastLoginAttempt = 0;
const LOGIN_COOLDOWN = 2000; // 2 seconds between attempts

/**
 * Custom hook for login mutation
 * Handles login process with React Query
 */
export const useLogin = () => {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const now = Date.now();
      
      // Prevent too frequent login attempts
      if (now - lastLoginAttempt < LOGIN_COOLDOWN) {
        throw new Error('Please wait a moment before trying again.');
      }
      
      lastLoginAttempt = now;
      return authService.login(credentials);
    },
    
    onSuccess: (data) => {
      console.log('✅ Login successful:', data);

      const { token, user: backendUser } = data;
      
      // Normalize role to match frontend expectations (ROLE_ADMIN -> admin)
      const normalizedRole = backendUser.role.replace('ROLE_', '').toLowerCase();
      
      const user = {
        id: backendUser.id,
        name: backendUser.fullName || backendUser.fullname || backendUser.username,
        email: backendUser.username,
        role: normalizedRole as 'admin' | 'manager' | 'employee',
        departmentId: backendUser.departmentId,
      };

      console.log('💾 Storing auth data like React client...');
      
      // Store in both Zustand store and localStorage for compatibility (matching React client)
      useAuthStore.getState().setAuth({ token, user });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      message.success(`Welcome ${user.name}!`);

      console.log('🚀 Redirecting to dashboard...');
      // Use window.location.href like React client for immediate redirect
      window.location.href = `/dashboard/${user.role}`;
    },

    onError: (error: Error) => {
      console.error('❌ Login failed:', error);
      message.error(error.message || 'Invalid username or password');
    },
  });
};
