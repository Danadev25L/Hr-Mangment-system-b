import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { message } from 'antd'
import apiClient from '@/lib/api'

interface UseDepartmentsOptions extends Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'> {}

export const useDepartments = (options?: UseDepartmentsOptions) => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    ...options,
  })
}

export const useDepartmentById = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: ['department', id],
    queryFn: () => apiClient.getDepartmentById(id),
    enabled: !!id && enabled,
  })
}

export const useDepartmentStats = () => {
  return useQuery({
    queryKey: ['department-stats'],
    queryFn: () => apiClient.get('/api/admin/departments/statistics'),
  })
}

export const useCreateDepartment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createDepartment(data),
    onSuccess: () => {
      message.success('Department created successfully')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['department-stats'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create department')
    },
  })
}

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateDepartment(id, data),
    onSuccess: (_, variables) => {
      message.success('Department updated successfully')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['department', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['department-stats'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update department')
    },
  })
}

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteDepartment(id),
    onSuccess: () => {
      message.success('Department deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['department-stats'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete department')
    },
  })
}
