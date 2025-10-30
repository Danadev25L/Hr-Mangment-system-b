import { api } from '@/src/lib/api';
import { BackendUser } from '@/src/types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    fullname?: string;
    role: string;
    departmentId?: string;
    organizationId?: string;
    active: boolean;
  };
}

export interface CheckTokenResponse {
  message: string;
  authData?: {
    user: BackendUser;
  };
}



/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
  /**
   * Login with username and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      // Typed shape for an Axios-like error
      interface AxiosErrorLike {
        response?: {
          status?: number;
          data?: {
            message?: string;
          };
        };
        message?: string;
      }

      const axiosError = error as AxiosErrorLike;
      
      // Handle HTTP errors
      if (axiosError.response?.status === 401) {
        throw new Error('Invalid username or password.');
      }
      
      if (axiosError.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      // Use server message if available, otherwise generic message
      const message = axiosError.response?.data?.message || axiosError.message || 'Login failed. Please try again.';
      throw new Error(message);
    }
  },

  /**
   * Verify JWT token validity
   */
  async checkToken(): Promise<CheckTokenResponse> {
    try {
      const response = await api.get<CheckTokenResponse>('/checkToken');
      return response.data;
    } catch (error: unknown) {
      console.error('checkToken error:', error);
      throw new Error('Token validation failed');
    }
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
};
