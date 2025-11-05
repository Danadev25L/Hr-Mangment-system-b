import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { AuthResponse, LoginCredentials, RegisterData, ApiResponse, PaginatedResponse } from '@/types'

let messageApi: any = null

export const setMessageApi = (api: any) => {
  messageApi = api
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      // Performance optimizations
      maxRedirects: 5,
      maxContentLength: 50 * 1000 * 1000, // 50MB
      validateStatus: (status) => status >= 200 && status < 500, // Don't throw on 4xx
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken()
          window.location.href = '/login'
        } else if (error.response?.data?.message) {
          if (messageApi) messageApi.error(error.response.data.message)
        } else if (error.message) {
          if (messageApi) messageApi.error(error.message)
        }
        return Promise.reject(error)
      }
    )
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      // Try localStorage first, fallback to cookie
      return localStorage.getItem('token') || this.getCookie('token')
    }
    return null
  }

  private getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }

  private setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
      // Also set token as cookie for middleware to read
      document.cookie = `token=${token}; path=/; max-age=86400; sameSite=strict`
    }
  }

  private setRole(role: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', role)
      // Also set role as cookie for middleware to read
      document.cookie = `userRole=${role}; path=/; max-age=86400; sameSite=strict`
    }
  }

  private getRole(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole') || this.getCookie('userRole')
    }
    return null
  }

  private removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userRole')
      // Also remove the cookies
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post('/auth/login', credentials)
    const { user, token } = response.data
    this.setToken(token)
    this.setRole(user.role)
    return { user, token, refreshToken: '', expiresIn: 86400 }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.client.post('/auth/register', data)
    const { user, token } = response.data
    this.setToken(token)
    this.setRole(user.role)
    return { user, token, refreshToken: '', expiresIn: 86400 }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout')
    } finally {
      this.removeToken()
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/api/shared/profile')
    return response.data.data // Backend returns { success: true, data: userProfile }
  }

  // Users endpoints
  async getUsers(page = 1, limit = 10, filters?: Record<string, any>): Promise<PaginatedResponse> {
    const userRole = this.getRole()
    const params = { page, limit, ...filters }
    
    // Route to appropriate endpoint based on role
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint to get their department employees
      const response = await this.client.get('/api/manager/employees', { params })
      return response.data
    } else {
      // Admins use the admin endpoint to get all users
      const response = await this.client.get('/api/admin/users', { params })
      return response.data
    }
  }

  // Get users for application selection (includes manager for manager role)
  async getUsersForApplications() {
    const userRole = this.getRole()
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers get their department users including themselves
      const response = await this.client.get('/api/manager/employees/for-applications')
      return response.data
    } else {
      // Admins get all users
      const response = await this.client.get('/api/admin/users', { params: { page: 1, limit: 1000 } })
      return response.data
    }
  }

  async getUser(id: number) {
    const userRole = this.getRole()
    
    // Route to appropriate endpoint based on role
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint to view their department employees
      const response = await this.client.get(`/api/manager/employees/${id}`)
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.get(`/api/admin/users/${id}`)
      return response.data
    }
  }

  async createUser(data: any) {
    // Check user role to determine which endpoint to use
    const userRole = this.getRole()
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint to create employees in their department
      const response = await this.client.post('/api/manager/employees', data)
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.post('/api/admin/users', data)
      return response.data
    }
  }

  async updateUser(id: number | string, data: any) {
    const userRole = this.getRole()
    
    // Route to appropriate endpoint based on role
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint to update their department employees
      const response = await this.client.put(`/api/manager/employees/${id}`, data)
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.put(`/api/admin/users/${id}`, data)
      return response.data
    }
  }

  async deleteUser(id: number | string) {
    // Only admins can delete users
    // Managers typically shouldn't have delete permissions
    const response = await this.client.delete(`/api/admin/users/${id}`)
    return response.data
  }

  async getNewEmployeesThisMonth() {
    const response = await this.client.get('/api/admin/users/stats/new-this-month');
    return response.data;
  }

  async updateUserDepartment(userId: number, departmentId: number) {
    const response = await this.client.put(`/api/admin/users/${userId}`, {
      departmentId,
    })
    return response.data
  }

  // Departments endpoints
  async getDepartments() {
    const userRole = this.getRole()
    
    // Both admin and manager can access departments, but use appropriate endpoint
    const endpoint = userRole === 'ROLE_MANAGER' ? '/api/shared/departments' : '/api/admin/departments'
    const response = await this.client.get(endpoint)
    
    // Ensure that the returned data is always an array
    if (Array.isArray(response.data)) {
      return response.data
    } else if (response.data && typeof response.data === 'object') {
      // If the API returns a single object, wrap it in an array
      return [response.data]
    }
    return [] // Return an empty array if data is null or not an object/array
  }

  async createDepartment(data: any) {
    const response = await this.client.post('/api/admin/departments', data)
    return response.data
  }

  async updateDepartment(id: number | string, data: any) {
    const response = await this.client.put(`/api/admin/departments/${id}`, data)
    return response.data
  }

  async deleteDepartment(id: number | string) {
    const response = await this.client.delete(`/api/admin/departments/${id}`)
    return response.data
  }

  // Announcements endpoints
  async getAnnouncements() {
    const userRole = this.getRole()
    
    let endpoint = '/api/employee/announcements' // Default to employee
    if (userRole === 'ROLE_ADMIN') {
      endpoint = '/api/admin/announcements'
    } else if (userRole === 'ROLE_MANAGER') {
      endpoint = '/api/manager/announcements'
    }
    
    const response = await this.client.get(endpoint)
    return response.data
  }

  async getAnnouncement(id: number) {
    const userRole = this.getRole()
    
    let endpoint = `/api/employee/announcements/${id}` // Default to employee
    if (userRole === 'ROLE_ADMIN') {
      endpoint = `/api/admin/announcements/${id}`
    } else if (userRole === 'ROLE_MANAGER') {
      endpoint = `/api/manager/announcements/${id}`
    }
    
    const response = await this.client.get(endpoint)
    return response.data
  }

  async createAnnouncement(data: any) {
    const userRole = this.getRole()
    
    let endpoint = '/api/admin/announcements' // Admin default
    if (userRole === 'ROLE_MANAGER') {
      endpoint = '/api/manager/announcements'
    }
    
    const response = await this.client.post(endpoint, data)
    return response.data
  }

  async updateAnnouncement(id: number, data: any) {
    const userRole = this.getRole()
    
    let endpoint = `/api/admin/announcements/${id}` // Admin default
    if (userRole === 'ROLE_MANAGER') {
      endpoint = `/api/manager/announcements/${id}`
    }
    
    const response = await this.client.put(endpoint, data)
    return response.data
  }

  async deleteAnnouncement(id: number) {
    const userRole = this.getRole()
    
    let endpoint = `/api/admin/announcements/${id}` // Admin default
    if (userRole === 'ROLE_MANAGER') {
      endpoint = `/api/manager/announcements/${id}`
    }
    
    const response = await this.client.delete(endpoint)
    return response.data
  }

  async toggleAnnouncementStatus(id: number) {
    // Only admin can toggle status
    const response = await this.client.patch(`/api/admin/announcements/${id}/toggle`)
    return response.data
  }

  async markAnnouncementAsRead(id: number) {
    // Only employee needs to mark as read
    const response = await this.client.patch(`/api/employee/announcements/${id}/read`)
    return response.data
  }

  async toggleAnnouncement(id: string) {
    const response = await this.client.patch<ApiResponse>(`/admin/announcements/${id}/toggle`)
    return response.data.data
  }

  // Applications endpoints
  async getApplications(page = 1, limit = 10, filters?: Record<string, any>) {
    const userRole = this.getRole()
    const params = { page, limit, ...filters }
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint
      const response = await this.client.get('/api/manager/applications', { params })
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.get('/api/admin/applications', { params })
      return response.data
    }
  }

  async getApplication(id: string) {
    const userRole = this.getRole()
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint
      const response = await this.client.get<ApiResponse>(`/api/manager/applications/${id}`)
      return response.data.data || (response.data as any).application
    } else {
      // Admins use the admin endpoint
      const response = await this.client.get<ApiResponse>(`/api/admin/applications/${id}`)
      return response.data.data || (response.data as any).application
    }
  }

  async createApplication(data: any) {
    const userRole = this.getRole()
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint
      const response = await this.client.post('/api/manager/applications', data)
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.post('/api/admin/applications', data)
      return response.data
    }
  }

  async updateApplication(id: string, data: any) {
    const userRole = this.getRole()
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint
      const response = await this.client.put(`/api/manager/applications/${id}`, data)
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.put(`/api/admin/applications/${id}`, data)
      return response.data
    }
  }

  async deleteApplication(id: string) {
    const userRole = this.getRole()
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint
      const response = await this.client.delete(`/api/manager/applications/${id}`)
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.delete(`/api/admin/applications/${id}`)
      return response.data
    }
  }

  async approveApplication(id: string) {
    const userRole = this.getRole()
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint
      const response = await this.client.put(`/api/manager/applications/${id}/approve`)
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.put(`/api/admin/applications/${id}/approve`)
      return response.data
    }
  }

  async rejectApplication(id: string, rejectionReason?: string) {
    const userRole = this.getRole()
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint
      const response = await this.client.put(`/api/manager/applications/${id}/reject`, {
        rejectionReason,
      })
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.put(`/api/admin/applications/${id}/reject`, {
        rejectionReason,
      })
      return response.data
    }
  }

  // Expenses endpoints
  async getExpenses(page = 1, limit = 10, filters?: Record<string, any>) {
    const userRole = this.getRole()
    const params = { page, limit, ...filters }
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint
      const response = await this.client.get('/api/manager/expenses', { params })
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.get('/api/admin/expenses', { params })
      return response.data
    }
  }

  async getExpense(id: string) {
    const userRole = this.getRole()
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint
      const response = await this.client.get<ApiResponse>(`/api/manager/expenses/${id}`)
      return response.data.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.get<ApiResponse>(`/api/admin/expenses/${id}`)
      return response.data.data
    }
  }

  async createExpense(data: any) {
    const userRole = this.getRole()
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint
      const response = await this.client.post('/api/manager/expenses', data)
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.post('/api/admin/expenses', data)
      return response.data
    }
  }

  async updateExpense(id: string, data: any) {
    const userRole = this.getRole()
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint
      const response = await this.client.put(`/api/manager/expenses/${id}`, data)
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.put(`/api/admin/expenses/${id}`, data)
      return response.data
    }
  }

  async deleteExpense(id: string) {
    const userRole = this.getRole()
    
    if (userRole === 'ROLE_MANAGER') {
      // Managers use the manager endpoint
      const response = await this.client.delete(`/api/manager/expenses/${id}`)
      return response.data
    } else {
      // Admins use the admin endpoint
      const response = await this.client.delete(`/api/admin/expenses/${id}`)
      return response.data
    }
  }

  async updateExpenseStatus(id: string, status: string, adminNote?: string) {
    // Only admins can update expense status
    const response = await this.client.put(`/api/admin/expenses/${id}/status`, {
      status,
      adminNote,
    })
    return response.data
  }

  // Holidays endpoints
  async getHolidays() {
    const userRole = this.getRole()
    
    let endpoint = '/api/employee/holidays' // Default to employee
    if (userRole === 'ROLE_ADMIN') {
      endpoint = '/api/admin/holidays'
    } else if (userRole === 'ROLE_MANAGER') {
      endpoint = '/api/manager/holidays'
    }
    
    const response = await this.client.get(endpoint)
    return response.data
  }

  async getHoliday(id: number) {
    const userRole = this.getRole()
    
    let endpoint = `/api/employee/holidays/${id}` // Default to employee
    if (userRole === 'ROLE_ADMIN') {
      endpoint = `/api/admin/holidays/${id}`
    } else if (userRole === 'ROLE_MANAGER') {
      endpoint = `/api/manager/holidays/${id}`
    }
    
    const response = await this.client.get(endpoint)
    return response.data
  }

  async createHoliday(data: any) {
    // Only admin can create holidays
    const response = await this.client.post('/api/admin/holidays', data)
    return response.data
  }

  async updateHoliday(id: number, data: any) {
    // Only admin can update holidays
    const response = await this.client.put(`/api/admin/holidays/${id}`, data)
    return response.data
  }

  async deleteHoliday(id: number) {
    // Only admin can delete holidays
    const response = await this.client.delete(`/api/admin/holidays/${id}`)
    return response.data
  }

  async getUpcomingHolidays() {
    const userRole = this.getRole()
    
    let endpoint = '/api/employee/holidays/upcoming'
    if (userRole === 'ROLE_ADMIN') {
      endpoint = '/api/admin/holidays/upcoming'
    } else if (userRole === 'ROLE_MANAGER') {
      endpoint = '/api/manager/holidays/upcoming'
    }
    
    const response = await this.client.get(endpoint)
    return response.data
  }

  async getHolidayStatistics() {
    // Only admin can view statistics
    const response = await this.client.get('/api/admin/holidays/statistics')
    return response.data
  }

  // Dashboard endpoints
  async getDashboardStats() {
    const response = await this.client.get<ApiResponse>('/dashboard/stats')
    return response.data.data
  }

  async getChartData(type: string) {
    const response = await this.client.get<ApiResponse>(`/dashboard/charts/${type}`)
    return response.data.data
  }

  // Personal Information endpoints
  async getPersonalInformation(userId?: number) {
    const url = userId ? `/api/admin/personal-info/${userId}` : '/api/employee/personal-info'
    const response = await this.client.get<ApiResponse>(url)
    return response.data.data
  }

  async updatePersonalInformation(data: any, userId?: number) {
    const url = userId ? `/api/admin/personal-info/${userId}` : '/api/employee/personal-info'
    const response = await this.client.put<ApiResponse>(url, data)
    return response.data.data
  }

  async createPersonalInformation(data: any) {
    const response = await this.client.post<ApiResponse>('/api/admin/personal-info', data)
    return response.data.data
  }

  // Analytics endpoints
  async getAnalytics(filters?: Record<string, any>) {
    const response = await this.client.get<ApiResponse>('/admin/analytics', { params: filters })
    return response.data.data
  }

  // Manager endpoints
  async getManagerEmployees(params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    role?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.client.get('/api/manager/employees', { params })
    return response.data
  }

  async createManagerEmployee(data: any) {
    const response = await this.client.post('/api/manager/employees', data)
    return response.data
  }

  async getManagerPayroll(month: number, year: number) {
    const response = await this.client.get(`/api/manager/payroll/${month}/${year}`)
    return response.data
  }

  async addEmployeeOvertime(data: any) {
    const response = await this.client.post('/api/manager/employees/overtime', data)
    return response.data
  }

  // ==================== ATTENDANCE ENDPOINTS ====================
  
  // Employee Attendance
  async checkIn(data: { location?: string; ipAddress?: string; deviceInfo?: string; notes?: string }) {
    const response = await this.client.post('/api/employee/attendance/check-in', data)
    return response.data
  }

  async checkOut(data?: { notes?: string }) {
    const response = await this.client.post('/api/employee/attendance/check-out', data || {})
    return response.data
  }

  async getMyAttendance(params?: { startDate?: string; endDate?: string; month?: number; year?: number }) {
    const response = await this.client.get('/api/employee/attendance', { params })
    return response.data
  }

  async getTodayAttendance() {
    const response = await this.client.get('/api/employee/attendance/today')
    return response.data
  }

  async getMyAttendanceSummary(params?: { month?: number; year?: number }) {
    const response = await this.client.get('/api/employee/attendance/summary', { params })
    return response.data
  }

  async requestAttendanceCorrection(data: {
    date: string;
    requestType: string;
    requestedCheckIn?: string;
    requestedCheckOut?: string;
    reason: string;
  }) {
    const response = await this.client.post('/api/employee/attendance/corrections', data)
    return response.data
  }

  async getMyCorrectionRequests() {
    const response = await this.client.get('/api/employee/attendance/corrections')
    return response.data
  }

  // Manager Attendance
  async getTeamAttendance(params?: { 
    startDate?: string; 
    endDate?: string; 
    month?: number; 
    year?: number;
    userId?: number;
  }) {
    const response = await this.client.get('/api/manager/attendance/team', { params })
    return response.data
  }

  async getTodayTeamAttendance() {
    const response = await this.client.get('/api/manager/attendance/team/today')
    return response.data
  }

  async getTeamAttendanceSummary(params?: { month?: number; year?: number }) {
    const response = await this.client.get('/api/manager/attendance/team/summary', { params })
    return response.data
  }

  async getPendingCorrections() {
    const response = await this.client.get('/api/manager/attendance/corrections/pending')
    return response.data
  }

  async approveCorrection(id: number, reviewNotes?: string) {
    const response = await this.client.put(`/api/manager/attendance/corrections/${id}/approve`, { reviewNotes })
    return response.data
  }

  async rejectCorrection(id: number, reviewNotes: string) {
    const response = await this.client.put(`/api/manager/attendance/corrections/${id}/reject`, { reviewNotes })
    return response.data
  }

  // Admin Attendance
  async getAllAttendance(params?: {
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    userId?: number;
    departmentId?: number;
    status?: string;
  }) {
    const response = await this.client.get('/api/admin/attendance', { params })
    return response.data
  }

  async getAllAttendanceSummaries(params?: { month?: number; year?: number; departmentId?: number }) {
    const response = await this.client.get('/api/admin/attendance/summaries', { params })
    return response.data
  }

  async getAllCorrectionRequests(params?: { status?: string }) {
    const response = await this.client.get('/api/admin/attendance/corrections', { params })
    return response.data
  }

  async createManualAttendance(data: {
    userId: number;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status?: string;
    notes?: string;
  }) {
    const response = await this.client.post('/api/admin/attendance', data)
    return response.data
  }

  async updateAttendance(id: number, data: {
    checkIn?: string;
    checkOut?: string;
    status?: string;
    notes?: string;
  }) {
    const response = await this.client.put(`/api/admin/attendance/${id}`, data)
    return response.data
  }

  async deleteAttendance(id: number) {
    const response = await this.client.delete(`/api/admin/attendance/${id}`)
    return response.data
  }

  async generateMonthlySummaries(data: { month: number; year: number }) {
    const response = await this.client.post('/api/admin/attendance/generate-summaries', data)
    return response.data
  }

  // Advanced Attendance Management
  async getAllEmployeesWithAttendance(params?: {
    date?: string;
    departmentId?: string;
    search?: string;
  }) {
    const response = await this.client.get('/api/admin/attendance/employees', { params })
    return response.data
  }

  async getEmployeeAttendanceDetails(params: { userId: number; date: string }) {
    const response = await this.client.get('/api/admin/attendance/employee/details', { params })
    return response.data
  }

  async getEmployeeAttendanceStats(employeeId: number, month: number, year: number) {
    const response = await this.client.get(`/api/admin/attendance/employee/${employeeId}/details`, {
      params: { month, year }
    })
    return response.data
  }

  async markEmployeeCheckIn(data: {
    employeeId: number;
    checkInTime: string;
    location?: string;
    notes?: string;
  }) {
    const response = await this.client.post('/api/admin/attendance/checkin', data)
    return response.data
  }

  async markEmployeeCheckOut(data: {
    employeeId: number;
    checkOutTime: string;
    location?: string;
    notes?: string;
  }) {
    const response = await this.client.post('/api/admin/attendance/checkout', data)
    return response.data
  }

  async markEmployeeAbsent(data: {
    employeeId: number;
    date: string;
    reason?: string;
  }) {
    const response = await this.client.post('/api/admin/attendance/mark-absent', data)
    return response.data
  }

  async bulkMarkAttendance(data: {
    employees: number[];
    date: string;
    status: string;
    notes?: string;
  }) {
    const response = await this.client.post('/api/admin/attendance/bulk-mark', data)
    return response.data
  }

  async getAttendanceReport(params: {
    type: 'daily' | 'monthly' | 'yearly';
    date?: string;
    month?: number;
    year?: number;
    departmentId?: string;
  }) {
    const response = await this.client.get('/api/admin/attendance/report', { params })
    return response.data
  }

  async exportAttendanceCSV(params: {
    startDate: string;
    endDate: string;
    format?: string;
    departmentId?: string;
  }) {
    const url = `/api/admin/attendance/export/csv?${new URLSearchParams(params as any).toString()}`
    window.open(`${this.client.defaults.baseURL}${url}`, '_blank')
  }

  // Add latency to attendance
  async addLatency(data: {
    employeeId: number;
    attendanceId?: number;
    date: string;
    lateMinutes: number;
    reason?: string;
  }) {
    const response = await this.client.post('/api/admin/attendance/add-latency', data)
    return response.data
  }

  // Add early departure
  async addEarlyDeparture(data: {
    employeeId: number;
    attendanceId?: number;
    date: string;
    earlyMinutes: number;
    reason?: string;
  }) {
    const response = await this.client.post('/api/admin/attendance/add-early-departure', data)
    return response.data
  }

  // Add partial day leave
  async addPartialLeave(data: {
    employeeId: number;
    attendanceId?: number;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }) {
    const response = await this.client.post('/api/admin/attendance/add-partial-leave', data)
    return response.data
  }

  // Check if employee has approved leave for a date
  async checkEmployeeLeave(employeeId: number, date: string) {
    const response = await this.client.get('/api/admin/attendance/check-leave', {
      params: { employeeId, date }
    })
    return response.data
  }

  // ==================== SALARY MANAGEMENT ====================
  
  // Get monthly salaries
  async getMonthlySalaries(params: { month: number; year: number; status?: string; role: string }) {
    const endpoint = params.role === 'ROLE_ADMIN' 
      ? '/api/admin/salary-management/monthly'
      : '/api/manager/salary-management/department'
    
    const response = await this.client.get(endpoint, { 
      params: { 
        month: params.month, 
        year: params.year,
        ...(params.status && { status: params.status })
      }
    })
    return response.data
  }

  // Get employee salary details
  async getEmployeeSalaryDetails(params: { employeeId: number; month: number; year: number; role: string }) {
    const endpoint = params.role === 'ROLE_ADMIN'
      ? `/api/admin/salary-management/employee/${params.employeeId}`
      : `/api/manager/salary-management/employee/${params.employeeId}`
    
    const response = await this.client.get(endpoint, {
      params: { month: params.month, year: params.year }
    })
    return response.data
  }

  // Calculate salaries
  async calculateMonthlySalaries(data: { month: number; year: number }) {
    const response = await this.client.post('/api/admin/salary-management/calculate', data)
    return response.data
  }

  // Add bonus
  async addBonus(data: { employeeId: number; amount: number; reason: string; month: number; year: number }) {
    const response = await this.client.post('/api/admin/salary-management/bonus', data)
    return response.data
  }

  // Add deduction
  async addDeduction(data: { employeeId: number; amount: number; reason: string; month: number; year: number }) {
    const response = await this.client.post('/api/admin/salary-management/deduction', data)
    return response.data
  }

  // Add overtime
  async addOvertime(data: { employeeId: number; amount: number; reason: string; month: number; year: number }) {
    const response = await this.client.post('/api/admin/salary-management/overtime', data)
    return response.data
  }

  // Approve salary
  async approveSalary(salaryId: number) {
    const response = await this.client.put(`/api/admin/salary-management/${salaryId}/approve`)
    return response.data
  }

  // Mark salary as paid
  async markSalaryAsPaid(salaryId: number, paymentData: { paymentMethod: string; paymentReference: string }) {
    const response = await this.client.put(`/api/admin/salary-management/${salaryId}/paid`, paymentData)
    return response.data
  }

  // Get salary components
  async getSalaryComponents() {
    const response = await this.client.get('/api/admin/salary-management/components')
    return response.data
  }

  // Assign component to employee
  async assignSalaryComponent(data: {
    employeeId: number;
    componentId: number;
    amount: number;
    effectiveFrom: string;
    isRecurring?: boolean;
    notes?: string;
  }) {
    const response = await this.client.post('/api/admin/salary-management/components/assign', data)
    return response.data
  }

  // Get employee salary components
  async getEmployeeSalaryComponents(employeeId: number) {
    const response = await this.client.get(`/api/admin/salary-management/components/employee/${employeeId}`)
    return response.data
  }

  // Get salary configuration
  async getSalaryConfig() {
    const response = await this.client.get('/api/admin/salary-management/config')
    return response.data
  }

  // Update salary configuration
  async updateSalaryConfig(data: { configKey: string; configValue: string }) {
    const response = await this.client.put('/api/admin/salary-management/config', data)
    return response.data
  }
}

export const apiClient = new ApiClient()
export default apiClient