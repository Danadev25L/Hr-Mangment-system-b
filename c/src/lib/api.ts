import axios from 'axios';

// Base API URL - adjust based on your backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Try to get token from multiple sources for compatibility
      let token = null;
      
      // First try Zustand store
      const authStore = localStorage.getItem('auth-storage');
      if (authStore) {
        try {
          const { state } = JSON.parse(authStore);
          if (state?.token) {
            token = state.token;
          }
        } catch (error) {
          console.error('Error parsing auth storage:', error);
        }
      }
      
      // Fallback to direct localStorage token
      if (!token) {
        token = localStorage.getItem('token');
      }
      
      // Add token to headers if found
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // Handle 429 Too Many Requests (Rate Limited)
    if (error.response?.status === 429) {
      console.warn('⚠️ Rate limit exceeded. Too many requests to the server.');
      const retryAfter = error.response.headers['retry-after'];
      const message = retryAfter 
        ? `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
        : 'Rate limit exceeded. Please wait a moment before trying again.';
      return Promise.reject(new Error(message));
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized access detected');
      if (typeof window !== 'undefined') {
        // Clear all auth data
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login only if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('🚫 Access forbidden');
    }

    return Promise.reject(error);
  }
);

// API endpoints based on backend routes
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    checkToken: '/checkToken',
  },

  // Admin endpoints
  admin: {
    users: '/api/admin/users',
    userStats: '/api/admin/users/statistics',
    departments: '/api/admin/departments',
    departmentStats: '/api/admin/departments/statistics',
    organizations: '/api/admin/organizations',
    payroll: '/api/admin/payroll',
    payments: '/api/admin/payments',
    paymentAnalytics: (year: number) => `/api/admin/payments/year/${year}`,
    salary: '/api/admin/salary',
    applications: '/api/admin/applications',
    expenses: (year: number) => `/api/admin/expenses/year/${year}`,
  },

  // Manager endpoints
  manager: {
    employees: '/api/manager/employees',
    payroll: (month: number, year: number) => `/api/manager/payroll/${month}/${year}`,
    announcements: '/api/manager/announcements',
    jobs: '/api/manager/jobs',
    activeJobs: '/api/manager/jobs/active',
    expenses: '/api/manager/expenses',
    applications: '/api/manager/applications',
    recentApplications: '/api/manager/applications/recent',
  },

  // Employee endpoints
  employee: {
    profile: '/api/employee/profile',
    salaryHistory: '/api/employee/salary-history',
    overtime: '/api/employee/overtime',
    notifications: '/api/employee/notifications',
    personalInfo: '/api/employee/personal-info',
    applications: '/api/employee/applications',
    applicationStats: '/api/employee/applications/stats',
  },

  // Shared endpoints
  shared: {
    notifications: '/api/shared/notifications',
    unreadCount: '/api/shared/notifications/unread-count',
    personalEvents: '/api/shared/personal-events',
  },
};
