import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import apiClient from '@/lib/api'

interface UseHolidaysParams {
  page?: number
  limit?: number
  year?: number
}

export const useHolidays = (params?: UseHolidaysParams) => {
  return useQuery({
    queryKey: ['holidays', params],
    queryFn: () => apiClient.getHolidays(),
  })
}

export const useHolidayById = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: ['holiday', id],
    queryFn: () => apiClient.getHoliday(Number(id)),
    enabled: !!id && enabled,
  })
}

export const useCreateHoliday = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createHoliday(data),
    onSuccess: () => {
      message.success('Holiday created successfully')
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create holiday')
    },
  })
}

export const useUpdateHoliday = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      apiClient.updateHoliday(Number(id), data),
    onSuccess: (_, variables) => {
      message.success('Holiday updated successfully')
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      queryClient.invalidateQueries({ queryKey: ['holiday', variables.id] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update holiday')
    },
  })
}

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string | number) => apiClient.deleteHoliday(Number(id)),
    onSuccess: () => {
      message.success('Holiday deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete holiday')
    },
  })
}
