'use client'

import React, { useState, useEffect } from 'react'
import { Form, message } from 'antd'
import { ArrowLeftOutlined, HomeOutlined, TeamOutlined, PlusOutlined, UserAddOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { EmployeeForm } from '@/components/employees/EmployeeForm'
import apiClient from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from 'next-intl'
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
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Array<{ id: number; departmentName: string }>>([])
  const { user } = useAuth()

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `/${locale}${basePath}/employees`
  const dashboardPath = `/${locale}${basePath}/dashboard`
  const isAdmin = role === 'admin'

  // Get manager's department info
  const managerDepartment = user?.department
  const managerDepartmentId = typeof managerDepartment === 'object' ? managerDepartment?.id : managerDepartment
  const managerDepartmentName = typeof managerDepartment === 'object' ? managerDepartment?.departmentName : 'Your Department'

  useEffect(() => {
    // Only fetch departments if user is admin
    if (isAdmin) {
      fetchDepartments()
    }
  }, [isAdmin])

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.getDepartments()
      setDepartments(response || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
      message.error('Failed to fetch departments')
    }
  }

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
      message.success(response.message || 'Employee created successfully!')
      form.resetFields()
      setTimeout(() => router.push(listPath), 1000)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create employee'
      if (errorMessage.includes('already has a manager')) {
        message.error('This department already has a manager. Choose a different department or role.')
      } else if (errorMessage.includes('Password must contain')) {
        message.error('Password must contain uppercase, lowercase, number, and special character')
      } else if (errorMessage.includes('already exists')) {
        message.error(errorMessage)
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
        title="Add New Employee"
        description={
          isAdmin 
            ? "Create a new employee account with all necessary details and permissions" 
            : "Add a new team member to your department with employee credentials"
        }
        icon={<EmployeesIllustration className="w-20 h-20" />}
        gradient="purple"
        action={
          <EnhancedButton
            variant="secondary"
            icon={<ArrowLeftOutlined />}
            onClick={() => handleNavigation(listPath)}
          >
            Back to {role === 'admin' ? 'Employees' : 'Team'}
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
