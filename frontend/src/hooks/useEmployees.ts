import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { message } from 'antd'
import apiClient from '@/lib/api'
import type { User } from '@/types'

interface UseEmployeesParams {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
  department?: string
  startDate?: string
  endDate?: string
}

interface UseEmployeesOptions extends Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'> {
  params?: UseEmployeesParams
}

export const useEmployees = (options?: UseEmployeesOptions) => {
  const { params = {}, ...queryOptions } = options || {}
  
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => apiClient.getUsers(
      params.page || 1,
      params.limit || 10,
      {
        search: params.search,
        role: params.role,
        status: params.status,
        department: params.department,
        startDate: params.startDate,
        endDate: params.endDate,
      }
    ),
    ...queryOptions,
  })
}

export const useManagerEmployees = (options?: UseEmployeesOptions) => {
  const { params = {}, ...queryOptions } = options || {}
  
  return useQuery({
    queryKey: ['manager-employees', params],
    queryFn: () => apiClient.getManagerEmployees({
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search,
      role: params.role,
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
    }),
    ...queryOptions,
  })
}

export const useEmployeeById = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => apiClient.getUserById(id),
    enabled: !!id && enabled,
  })
}

export const useCreateEmployee = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createUser(data),
    onSuccess: () => {
      message.success('Employee created successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['manager-employees'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create employee')
    },
  })
}

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      apiClient.updateUser(id, data),
    onSuccess: (_, variables) => {
      message.success('Employee updated successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['manager-employees'] })
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update employee')
    },
  })
}

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string | number) => apiClient.deleteUser(id),
    onSuccess: () => {
      message.success('Employee deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['manager-employees'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete employee')
    },
  })
}
