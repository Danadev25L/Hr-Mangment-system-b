import { useAuthStore } from '@/src/store/useAuthStore';
import { authService } from '@/src/services/auth.service';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

/**
 * Auth guard hook for protecting routes - OPTIMIZED VERSION
 * Prevents duplicate API calls and implements smart caching
 */
export const useAuthGuard = (requiredRole?: 'admin' | 'manager' | 'employee') => {
  const router = useRouter();
  const { user, setAuth, logout, isAuthenticated: storeAuthenticated } = useAuthStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      console.log('🛡️ Auth Guard - Starting check...', { requiredRole, storeAuthenticated, user });
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      const cachedUser = localStorage.getItem('user');
      
      console.log('Auth state:', { 
        hasToken: !!token, 
        hasCachedUser: !!cachedUser, 
        storeAuthenticated,
        currentUser: user 
      });
      
      // IMMEDIATE BLOCK: No token = redirect immediately
      if (!token) {
        console.log('🚨 BLOCKED: No token found, redirecting to login');
        logout(); // Clear any stale data
        setLoading(false);
        setIsAuthenticated(false);
        router.replace('/login');
        return;
      }

      // If we have valid cached user data and store says we're authenticated, use it
      if (storeAuthenticated && user && cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          const normalizedRole = parsedUser.role;
          
          console.log('✅ Using cached authentication:', parsedUser.name, normalizedRole);
          
          // Check role requirements
          if (requiredRole && normalizedRole !== requiredRole) {
            console.log(`🔄 Role mismatch: ${normalizedRole} != ${requiredRole}, redirecting`);
            setLoading(false);
            setIsAuthenticated(true); // They are authenticated, just wrong page
            router.replace(`/${normalizedRole}`);
            return;
          }
          
          // SUCCESS: Using cached authentication
          setIsAuthenticated(true);
          setLoading(false);
          return;
        } catch (error) {
          console.warn('Failed to parse cached user, will validate with server:', error);
          // Continue to server validation
        }
      }

      try {
        console.log('📡 Validating token with backend...');
        const response = await authService.checkToken();
        console.log('✅ Token validation successful:', response);
        
        // Validate response structure
        if (!response.authData || !response.authData.user) {
          console.log('🚨 BLOCKED: Invalid response from server');
          logout();
          setLoading(false);
          setIsAuthenticated(false);
          router.replace('/login');
          return;
        }

        const backendUser = response.authData.user;
        
        // Normalize role from backend (ROLE_ADMIN -> admin)
        const normalizedRole = backendUser.role.replace('ROLE_', '').toLowerCase();
        
        const userData = {
          id: backendUser.id,
          name: backendUser.fullName || backendUser.fullname || backendUser.username,
          email: backendUser.username,
          role: normalizedRole as 'admin' | 'manager' | 'employee',
          departmentId: backendUser.departmentId,
        };
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(userData));
        setAuth({ token, user: userData });
        
        console.log('✅ Authentication successful for user:', userData.name);
        
        // Check role requirements
        if (requiredRole && normalizedRole !== requiredRole) {
          console.log(`🔄 Role mismatch: ${normalizedRole} != ${requiredRole}, redirecting`);
          setLoading(false);
          setIsAuthenticated(true); // They are authenticated, just wrong page
          router.replace(`/${normalizedRole}`);
          return;
        }
        
        // SUCCESS: User is authenticated and authorized
        setIsAuthenticated(true);
        setLoading(false);
        
      } catch (error) {
        console.log('🚨 BLOCKED: Token validation failed:', error);
        // Clear ALL auth data and cache
        authService.logout();
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        logout();
        setLoading(false);
        setIsAuthenticated(false);
        router.replace('/login');
      }
    };

    checkAuthentication();
  }, [router, logout, setAuth, requiredRole, storeAuthenticated, user]);

  return { isAuthenticated, user, loading };
};

/**
 * Lightweight role check hook for pages inside authenticated layout
 * Use this instead of useAuthGuard when you're already inside the dashboard layout
 */
export const useRoleGuard = (requiredRole: 'admin' | 'manager' | 'employee') => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // Calculate access directly based on current state
  const hasAccess = isAuthenticated && user && user.role === requiredRole;
  const loading = !user && isAuthenticated; // Only loading if we should have user but don't

  useEffect(() => {
    // Only handle redirects, not state updates
    if (isAuthenticated && user && user.role !== requiredRole) {
      console.log(`🔄 Role guard: ${user.role} != ${requiredRole}, redirecting`);
      router.replace(`/${user.role}`);
    }
  }, [user, isAuthenticated, requiredRole, router]);

  return { hasAccess, loading, user };
};

/**
 * Check if user has specific role
 */
export const useHasRole = (role: 'admin' | 'manager' | 'employee'): boolean => {
  const { user } = useAuthStore();
  return user?.role === role;
};

/**
 * Get current user
 */
export const useCurrentUser = () => {
  const { user } = useAuthStore();
  return user;
};
