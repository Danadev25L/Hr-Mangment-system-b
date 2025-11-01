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
    const response = await this.client.get<ApiResponse>('/holidays')
    return response.data.data
  }

  async createHoliday(data: any) {
    const response = await this.client.post<ApiResponse>('/admin/holidays', data)
    return response.data.data
  }

  async updateHoliday(id: string, data: any) {
    const response = await this.client.put<ApiResponse>(`/admin/holidays/${id}`, data)
    return response.data.data
  }

  async deleteHoliday(id: string) {
    const response = await this.client.delete<ApiResponse>(`/admin/holidays/${id}`)
    return response.data.data
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
}

export const apiClient = new ApiClient()
export default apiClient