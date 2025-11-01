'use client'

import React, { useState, useEffect } from 'react'
import { Form, Card, message, Breadcrumb, Button, Space } from 'antd'
import { ArrowLeftOutlined, HomeOutlined, TeamOutlined, PlusOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { EmployeeForm } from '@/components/employees/EmployeeForm'
import apiClient from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{children}</h1>
)

const Text = ({ children }: { children: React.ReactNode }) => (
  <p className="text-gray-500 dark:text-gray-400">{children}</p>
)

interface EmployeeAddPageProps {
  role: 'admin' | 'manager'
}

export function EmployeeAddPage({ role }: EmployeeAddPageProps) {
  const [form] = Form.useForm()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Array<{ id: number; departmentName: string }>>([])
  const { user } = useAuth()

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `${basePath}/employees`
  const dashboardPath = `${basePath}/dashboard`
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

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          {
            title: (
              <a href={dashboardPath} className="flex items-center gap-2">
                <HomeOutlined />
                <span>Dashboard</span>
              </a>
            ),
          },
          {
            title: (
              <a href={listPath} className="flex items-center gap-2">
                <TeamOutlined />
                <span>{role === 'admin' ? 'Employees' : 'My Team'}</span>
              </a>
            ),
          },
          {
            title: (
              <span className="flex items-center gap-2">
                <PlusOutlined />
                <span>Add Employee</span>
              </span>
            ),
          },
        ]}
      />
      <div className="flex items-center justify-between">
        <div>
          <Title>Add New Employee</Title>
          <Text>Fill in the employee details below</Text>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(listPath)}>
          Back to {role === 'admin' ? 'Employees' : 'Team'}
        </Button>
      </div>
      <Card className="shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <EmployeeForm
          form={form}
          onFinish={onFinish}
          loading={loading}
          onCancel={() => router.push(listPath)}
          isAdmin={isAdmin}
          departments={departments}
          userDepartment={managerDepartmentName}
        />
      </Card>
    </div>
  )
}
