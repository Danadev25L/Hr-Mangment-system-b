import { PaginatedResponse, User } from '@/types'
import baseApiClient from './base'

export class EmployeesApi {
  async getUsers(page = 1, limit = 10, filters?: Record<string, any>): Promise<PaginatedResponse<User>> {
    const userRole = baseApiClient.getUserRole()
    const params = { page, limit, ...filters }

    let response
    if (userRole === 'manager') {
      response = await baseApiClient.httpClient.get('/api/manager/employees', { params })
    } else {
      response = await baseApiClient.httpClient.get('/api/admin/users', { params })
    }

    return response.data
  }

  async getUsersForApplications() {
    const userRole = baseApiClient.getUserRole()

    if (userRole === 'employee') {
      const response = await baseApiClient.httpClient.get('/api/shared/profile')
      return response.data
    }

    if (userRole === 'manager') {
      const response = await baseApiClient.httpClient.get('/api/manager/employees/for-applications')
      return response.data
    }

    const response = await baseApiClient.httpClient.get('/api/admin/users', {
      params: { page: 1, limit: 1000 }
    })
    return response.data
  }

  async getUser(id: number) {
    const userRole = baseApiClient.getUserRole()

    if (userRole === 'manager') {
      const response = await baseApiClient.httpClient.get(`/api/manager/employees/${id}`)
      return response.data
    }

    const response = await baseApiClient.httpClient.get(`/api/admin/users/${id}`)
    return response.data
  }

  async createUser(data: any) {
    const userRole = baseApiClient.getUserRole()

    if (userRole === 'manager') {
      const response = await baseApiClient.httpClient.post('/api/manager/employees', data)
      return response.data
    }

    const response = await baseApiClient.httpClient.post('/api/admin/users', data)
    return response.data
  }

  async updateUser(id: number | string, data: any) {
    const userRole = baseApiClient.getUserRole()

    if (userRole === 'manager') {
      const response = await baseApiClient.httpClient.put(`/api/manager/employees/${id}`, data)
      return response.data
    }

    const response = await baseApiClient.httpClient.put(`/api/admin/users/${id}`, data)
    return response.data
  }

  async deleteUser(id: number | string) {
    const response = await baseApiClient.httpClient.delete(`/api/admin/users/${id}`)
    return response.data
  }

  async getNewEmployeesThisMonth() {
    const response = await baseApiClient.httpClient.get('/api/admin/users/stats/new-this-month')
    return response.data
  }

  async updateUserDepartment(userId: number, departmentId: number) {
    const response = await baseApiClient.httpClient.put(`/api/admin/users/${userId}`, {
      departmentId
    })
    return response.data
  }

  async getUsersByDepartment(departmentId: number) {
    const response = await baseApiClient.httpClient.get(`/api/admin/users/department/${departmentId}`)
    return response.data
  }

  async getManagerEmployees(params?: {
    page?: number;
    limit?: number;
    departmentId?: number;
    status?: string;
  }) {
    const response = await baseApiClient.httpClient.get('/api/manager/employees', { params })
    return response.data
  }

  async createManagerEmployee(data: any) {
    const response = await baseApiClient.httpClient.post('/api/manager/employees', data)
    return response.data
  }

  async addEmployeeOvertime(data: any) {
    const response = await baseApiClient.httpClient.post('/api/manager/employees/overtime', data)
    return response.data
  }

  async getDepartments() {
    const response = await baseApiClient.httpClient.get('/api/shared/departments')
    return response.data
  }
}

export const employeesApi = new EmployeesApi()