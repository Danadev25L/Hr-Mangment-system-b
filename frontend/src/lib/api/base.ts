import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { AuthResponse, LoginCredentials, RegisterData, ApiResponse } from '@/types'

let messageApi: any = null

export const setMessageApi = (api: any) => {
  messageApi = api
}

export class BaseApiClient {
  protected client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Performance optimizations
      maxRedirects: 2,
      maxContentLength: 5 * 1000 * 1000,
      validateStatus: (status) => status >= 200 && status < 500,
      transitional: {
        clarifyTimeoutError: true,
      },
      decompress: true,
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
        // Log error for debugging
        console.error('API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          data: error.response?.data,
          message: error.message
        })

        if (error.response?.status === 401) {
          this.removeToken()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        } else if (error.response?.status === 400) {
          // Handle 400 Bad Request errors with more specific messages
          const errorData = error.response?.data
          let errorMessage = 'Invalid request data'

          if (errorData?.message) {
            errorMessage = errorData.message
          } else if (errorData?.error) {
            errorMessage = errorData.error
          } else if (errorData?.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.join(', ')
          }

          if (messageApi) {
            messageApi.error(errorMessage)
          }
        } else if (error.response?.status >= 500) {
          // Handle server errors
          if (messageApi) {
            messageApi.error('Server error. Please try again later.')
          }
        } else if (error.response?.data?.message) {
          if (messageApi) messageApi.error(error.response.data.message)
        } else if (error.message && !error.config?.skipGlobalError) {
          if (messageApi) messageApi.error(error.message)
        }

        return Promise.reject(error)
      }
    )
  }

  protected getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || this.getCookie('token')
    }
    return null
  }

  protected getCookie(name: string): string | null {
    if (typeof window === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null
    }
    return null
  }

  protected setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
      const isSecure = window.location.protocol === 'https:'
      document.cookie = `token=${token}; path=/; max-age=86400; sameSite=strict${isSecure ? '; secure' : ''}`
    }
  }

  protected removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      const isSecure = window.location.protocol === 'https:'
      document.cookie = `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; sameSite=strict${isSecure ? '; secure' : ''}`
    }
  }

  protected setRole(role: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRole', role)
      const isSecure = window.location.protocol === 'https:'
      document.cookie = `userRole=${role}; path=/; max-age=86400; sameSite=strict${isSecure ? '; secure' : ''}`
    }
  }

  protected getRole(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole') || this.getCookie('userRole')
    }
    return null
  }

  public getUserRole(): string | null {
    return this.getRole()
  }

  public get httpClient(): AxiosInstance {
    return this.client
  }

  public setUserToken(token: string) {
    this.setToken(token)
  }

  public setUserRole(role: string) {
    this.setRole(role)
  }

  public clearUserToken() {
    this.removeToken()
  }

  protected getUserEndpoint(roleBasePath: string, employeePath?: string, adminPath?: string): string {
    const userRole = this.getRole()

    if (userRole === 'employee' && employeePath) {
      return employeePath
    } else if (userRole === 'manager' && adminPath) {
      return '/api/manager/' + roleBasePath
    } else if (userRole === 'admin') {
      return adminPath || `/api/admin/${roleBasePath}`
    }

    return roleBasePath
  }
}

// Create singleton instance
const baseApiClient = new BaseApiClient()
export default baseApiClient