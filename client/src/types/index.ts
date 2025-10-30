// User Role Types
export type UserRole = 'admin' | 'manager' | 'employee' | 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE';

// Backend User Response (from checkToken)
export interface BackendUser {
  id: string;
  username: string;
  fullName: string;
  fullname?: string;
  role: string;
  departmentId?: string;
  organizationId?: string;
  active?: boolean;
}

// User Interface (Frontend)
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  avatar?: string;
}

// Menu Item Type
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path: string;
  children?: MenuItem[];
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth State
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: ({ token, user }: { token: string; user: User }) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRole: (role: UserRole) => void;
  logout: () => void;
}
