export interface User {
  id: number
  username: string
  fullName: string
  employeeCode: string
  jobTitle?: string
  role: 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE'
  active: boolean
  departmentId?: number
  jobId?: number
  baseSalary: number
  department?: string | { id: number; departmentName: string; [key: string]: any }
  updatedBy?: number
  createdAt: string
  updatedAt: string

  // Employment details
  employmentType?: string
  workLocation?: string
  startDate?: string
  endDate?: string
  probationEnd?: string

  // Contact information
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string

  // Personal information
  dateOfBirth?: string
  gender?: string
  maritalStatus?: string
  
  // Emergency contact
  emergencyContact?: string
  emergencyPhone?: string

  // Additional fields
  skills?: string
  experience?: string
  lastLogin?: string

  // Frontend convenience properties
  firstName?: string
  lastName?: string
  joinDate?: string
  avatar?: string
  status?: 'active' | 'inactive' | 'suspended'

  // Extended profile fields
  personalInfo?: PersonalInformation
  personalInformation?: PersonalInformation
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  password: string
  fullName: string
  employeeCode: string
  jobTitle?: string
  role?: 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_EMPLOYEE'
  departmentId?: number
  baseSalary?: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Department {
  id: number
  departmentName: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  users?: Array<{
    id: number
    username: string
    role: string
    active: boolean
    jobTitle?: string
  }>
  employeeCount?: number

  // Frontend convenience properties
  name?: string
  description?: string
  manager?: string
  budget?: number
}

export interface PersonalInformation {
  id: number
  userId: number
  firstName: string
  lastName: string
  email?: string
  address?: string
  city?: string
  country?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed'
  createdAt: string
  updatedAt: string

  // Frontend convenience properties
  phone?: string
  state?: string
  zipCode?: string
  emergencyContact?: EmergencyContact
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
}

export interface Job {
  id: number
  jobTitle: string
  departmentId: number
  description?: string
  requirements?: string
  salaryRange?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Announcement {
  id: number
  title: string
  description: string
  date: string
  departmentId?: number
  createdBy: number
  isActive: boolean
  createdAt: string
  updatedAt: string

  // Frontend convenience properties
  content?: string
  type?: 'general' | 'urgent' | 'policy' | 'event'
  priority?: 'low' | 'medium' | 'high'
  author?: string
  targetAudience?: 'all' | 'admin' | 'manager' | 'employee'
}

export interface Holiday {
  id: number
  name: string
  date: string
  type: 'public' | 'company' | 'religious'
  recurring: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: number
  userId: number
  departmentId?: number
  itemName?: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  date: string
  createdAt: string
  updatedAt: string
  
  // Approval tracking
  approvedBy?: number
  approvedAt?: string
  approvedByName?: string
  approvedByEmail?: string
  
  // Rejection tracking
  rejectedBy?: number
  rejectedAt?: string
  rejectedByName?: string
  rejectedByEmail?: string
  
  // Payment tracking
  paidBy?: number
  paidAt?: string
  paidByName?: string
  paidByEmail?: string

  // User details
  userName?: string
  userEmail?: string
  userRole?: string
  
  // Department details
  departmentName?: string

  // Frontend convenience properties
  title?: string
  description?: string
  category?: 'travel' | 'supplies' | 'training' | 'equipment' | 'other'
  submittedBy?: string
  submittedDate?: string
  receiptUrl?: string
  notes?: string
}

export interface Application {
  id: number
  userId: number
  jobId?: number
  title: string
  reason: string
  startDate?: string
  endDate?: string
  applicationType: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: number
  approvedAt?: string
  approvedByName?: string
  approvedByEmail?: string
  rejectedBy?: number
  rejectedAt?: string
  rejectedByName?: string
  rejectedByEmail?: string
  rejectionReason?: string
  adminAction: boolean
  createdAt: string
  updatedAt: string

  // User details
  userName?: string
  userEmail?: string
  userRole?: string
  employeeCode?: string
  
  // Department details
  departmentId?: number
  departmentName?: string

  // Frontend convenience properties
  type?: 'leave' | 'promotion' | 'transfer' | 'resignation'
  description?: string
  submittedBy?: string
  reviewedBy?: string
  submittedDate?: string
  reviewedDate?: string
  response?: string
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalDepartments: number
  pendingApplications: number
  totalExpenses: number
  pendingExpenses: number
  recentActivities: Activity[]
}

export interface Activity {
  id: string
  type: 'user_created' | 'user_updated' | 'expense_submitted' | 'application_created' | 'announcement_posted'
  description: string
  userId: string
  userName: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string[]
    borderWidth?: number
  }[]
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  announcements: boolean
  applications: boolean
  expenses: boolean
  holidays: boolean
}

export interface UserProfile extends User {
  notificationSettings: NotificationSettings
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
  }
}