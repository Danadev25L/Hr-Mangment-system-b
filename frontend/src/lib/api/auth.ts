import { AuthResponse, LoginCredentials, RegisterData } from '@/types'
import baseApiClient from './base'

export class AuthApi {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await baseApiClient.httpClient.post<AuthResponse>('/auth/login', credentials)

    if (response.data.token) {
      baseApiClient.setUserToken(response.data.token)
    }
    if (response.data.user?.role) {
      baseApiClient.setUserRole(response.data.user.role)
    }

    return response.data
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await baseApiClient.httpClient.post<AuthResponse>('/auth/register', data)

    if (response.data.token) {
      baseApiClient.setUserToken(response.data.token)
    }
    if (response.data.user?.role) {
      baseApiClient.setUserRole(response.data.user.role)
    }

    return response.data
  }

  async logout(): Promise<void> {
    try {
      await baseApiClient.httpClient.post('/auth/logout')
    } finally {
      baseApiClient.clearUserToken()
    }
  }

  async getCurrentUser() {
    const response = await baseApiClient.httpClient.get('/api/shared/profile')
    return response.data
  }

  async changePassword(data: { oldPassword: string; newPassword: string }) {
    const response = await baseApiClient.httpClient.put('/api/employee/password', data)
    return response.data
  }
}

export const authApi = new AuthApi()