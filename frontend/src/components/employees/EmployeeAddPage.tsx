'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Form, message } from 'antd'
import { ArrowLeftOutlined, HomeOutlined, TeamOutlined, PlusOutlined, UserAddOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { EmployeeForm } from '@/components/employees/EmployeeForm'
import apiClient from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useLocale, useTranslations } from 'next-intl'
import { 
  PageHeader, 
  EnhancedCard, 
  EnhancedButton,
} from '@/components/ui'
import { EmployeesIllustration } from '@/components/ui/illustrations'

interface EmployeeAddPageProps {
  role: 'admin' | 'manager'
}

export function EmployeeAddPage({ role }: EmployeeAddPageProps) {
  const [form] = Form.useForm()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Array<{ 
    id: number; 
    departmentName: string;
    manager?: { id: number; fullName: string } | null;
  }>>([])
  const { user } = useAuth()

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `/${locale}${basePath}/employees`
  const dashboardPath = `/${locale}${basePath}/dashboard`
  const isAdmin = role === 'admin'

  // Get manager's department info
  const managerDepartment = user?.department
  const managerDepartmentId = typeof managerDepartment === 'object' ? managerDepartment?.id : managerDepartment
  const managerDepartmentName = typeof managerDepartment === 'object' ? managerDepartment?.departmentName : t('employees.addPage.yourDepartment') || 'Your Department'

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await apiClient.getDepartments()
      
      // Fetch manager info for each department
      const departmentsWithManagers = await Promise.all(
        (response || []).map(async (dept: any) => {
          try {
            // Get users in this department to find the manager
            const usersResponse = await apiClient.getUsersByDepartment(dept.id)
            const manager = usersResponse?.find((u: any) => u.role === 'ROLE_MANAGER' && u.active)
            
            return {
              ...dept,
              manager: manager ? { id: manager.id, fullName: manager.fullName } : null
            }
          } catch (error) {
            return { ...dept, manager: null }
          }
        })
      )
      
      setDepartments(departmentsWithManagers)
    } catch (error) {
      console.error('Error fetching departments:', error)
      message.error(t('employees.addPage.failedToFetchDepartments'))
    }
  }, [t])

  useEffect(() => {
    // Only fetch departments if user is admin
    if (isAdmin) {
      fetchDepartments()
    }
  }, [isAdmin, fetchDepartments])

  const onFinish = async (values: any) => {
    try {
      setLoading(true)
      
      // For managers, force role to ROLE_EMPLOYEE and use manager's department
      const employeeData = {
        username: values.username,
        password: values.password,
        fullName: values.fullName,
        jobTitle: values.jobTitle,
        role: isAdmin ? values.role : 'ROLE_EMPLOYEE', // Managers can only create employees
        departmentId: isAdmin 
          ? (values.role === 'ROLE_ADMIN' ? null : values.departmentId)
          : managerDepartmentId, // Use manager's department
        baseSalary: values.baseSalary,
        employmentType: values.employmentType || 'Full-time',
        workLocation: values.workLocation || 'Office',
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
        email: values.email,
        phone: values.phone,
        address: values.address,
        city: values.city,
        country: values.country,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
        gender: values.gender,
        maritalStatus: values.maritalStatus,
        emergencyContact: values.emergencyContact,
        emergencyPhone: values.emergencyPhone,
      }
      const response = await apiClient.createUser(employeeData)
      message.success(response.message || t('employees.addPage.createSuccess'))
      form.resetFields()
      setTimeout(() => router.push(listPath), 1000)
    } catch (error: any) {
      console.error('Error creating employee:', error)
      const errorMessage = error.response?.data?.message || t('employees.addPage.createFailed')
      const errorData = error.response?.data
      
      // Handle specific error cases with detailed messages
      if (errorMessage.includes('already has a manager')) {
        const managerInfo = errorData?.existingManager
        const managerDetails = managerInfo 
          ? ` (${managerInfo.fullName} - ${managerInfo.employeeCode})`
          : ''
        
        message.error({
          content: (
            <div>
              <div className="font-semibold">{t('employees.addPage.managerExistsTitle')}</div>
              <div>{t('employees.addPage.managerExistsDesc')}{managerDetails}.</div>
              <div className="text-xs mt-1">{t('employees.addPage.managerExistsAction')}</div>
            </div>
          ),
          duration: 6,
        })
      } else if (errorMessage.includes('Password must contain')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">{t('employees.addPage.weakPasswordTitle')}</div>
              <div>{t('employees.addPage.weakPasswordDesc')}</div>
              <div className="text-xs mt-1">{t('employees.addPage.weakPasswordExample')}</div>
            </div>
          ),
          duration: 5,
        })
      } else if (errorMessage.includes('already exists')) {
        const field = errorMessage.includes('Username') ? 'Username' : 
                      errorMessage.includes('Email') ? 'Email' : 'Field'
        message.error({
          content: (
            <div>
              <div className="font-semibold">{t('employees.addPage.duplicateTitle')} {field}</div>
              <div>{errorMessage}</div>
            </div>
          ),
          duration: 4,
        })
      } else if (errorMessage.includes('Gender must be')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">{t('employees.addPage.invalidGenderTitle')}</div>
              <div>{t('employees.addPage.invalidGenderDesc')}</div>
            </div>
          ),
          duration: 4,
        })
      } else if (errorMessage.includes('base salary') || errorMessage.includes('salary is required')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">{t('employees.addPage.salaryRequiredTitle')}</div>
              <div>{t('employees.addPage.salaryRequiredDesc')}</div>
            </div>
          ),
          duration: 4,
        })
      } else if (errorMessage.includes('Department is required')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">{t('employees.addPage.departmentRequiredTitle')}</div>
              <div>{t('employees.addPage.departmentRequiredDesc')}</div>
            </div>
          ),
          duration: 4,
        })
      } else if (errorMessage.includes('Forbidden') || errorMessage.includes('Only administrators')) {
        message.error({
          content: (
            <div>
              <div className="font-semibold">{t('employees.addPage.accessDeniedTitle')}</div>
              <div>{errorMessage}</div>
            </div>
          ),
          duration: 5,
        })
      } else {
        message.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('employees.addPage.title')}
        description={
          isAdmin 
            ? t('employees.addPage.descriptionAdmin')
            : t('employees.addPage.descriptionManager')
        }
        icon={<EmployeesIllustration className="w-20 h-20" />}
        gradient="purple"
        action={
          <EnhancedButton
            variant="secondary"
            icon={<ArrowLeftOutlined />}
            onClick={() => handleNavigation(listPath)}
          >
            {role === 'admin' ? t('employees.addPage.backToEmployees') : t('employees.addPage.backToTeam')}
          </EnhancedButton>
        }
      />

      {/* Form Card */}
      <EnhancedCard className="shadow-md">
        <EmployeeForm
          form={form}
          onFinish={onFinish}
          loading={loading}
          onCancel={() => handleNavigation(listPath)}
          isAdmin={isAdmin}
          departments={departments}
          userDepartment={managerDepartmentName}
        />
      </EnhancedCard>
    </div>
  )
}
