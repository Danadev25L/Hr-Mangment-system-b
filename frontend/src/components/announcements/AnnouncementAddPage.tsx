'use client'

import React, { useState, useMemo } from 'react'
import {
  Card,
  Button,
  Form,
  Input,
  message,
  Row,
  Col,
  Breadcrumb,
  Space,
  DatePicker,
  Select,
  Switch,
} from 'antd'
import {
  PlusOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter } from 'next/navigation'

const { TextArea } = Input

interface AnnouncementAddPageProps {
  role: 'admin' | 'manager'
}

export function AnnouncementAddPage({ role }: AnnouncementAddPageProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
  const [isCompanyWide, setIsCompanyWide] = useState(false)

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const listPath = `${basePath}/announcements`
  const dashboardPath = `${basePath}/dashboard`

  // Fetch departments
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
  })

  // Fetch users based on selected department (for admin)
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-for-announcements', selectedDepartment],
    queryFn: () => apiClient.getUsersForApplications(),
    enabled: role === 'admin' && selectedDepartment !== null,
  })

  // Fetch manager's department users (for manager)
  const { data: managerUsers, isLoading: isLoadingManagerUsers } = useQuery({
    queryKey: ['manager-users-for-announcements'],
    queryFn: () => apiClient.getUsersForApplications(),
    enabled: role === 'manager',
  })

  // Filter users by selected department (for admin)
  const filteredUsers = useMemo(() => {
    if (role === 'manager') {
      const usersList = Array.isArray(managerUsers) ? managerUsers : managerUsers?.data || []
      return usersList
    }
    
    if (!users || !selectedDepartment || isCompanyWide) return []
    const usersList = Array.isArray(users) ? users : users?.data || []
    return usersList.filter((user: any) => user.departmentId === selectedDepartment)
  }, [users, managerUsers, selectedDepartment, role, isCompanyWide])

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: (values: any) => apiClient.createAnnouncement(values),
    onSuccess: () => {
      message.success('Announcement created successfully')
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      router.push(listPath)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create announcement')
    },
  })

  const handleSubmit = async (values: any) => {
    const payload = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
      departmentId: isCompanyWide ? null : (values.departmentId || null),
      recipientUserIds: values.recipientUserIds || [],
      isActive: values.isActive !== undefined ? values.isActive : true,
    }
    createAnnouncementMutation.mutate(payload)
  }

  const handleDepartmentChange = (value: number) => {
    setSelectedDepartment(value)
    form.setFieldsValue({ recipientUserIds: undefined })
  }

  const handleCompanyWideChange = (checked: boolean) => {
    setIsCompanyWide(checked)
    if (checked) {
      form.setFieldsValue({ 
        departmentId: undefined,
        recipientUserIds: undefined 
      })
      setSelectedDepartment(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            title: (
              <span className="flex items-center cursor-pointer" onClick={() => router.push(dashboardPath)}>
                <HomeOutlined className="mr-1" />
                Dashboard
              </span>
            ),
          },
          {
            title: (
              <span className="cursor-pointer" onClick={() => router.push(listPath)}>
                Announcements
              </span>
            ),
          },
          {
            title: 'Create New',
          },
        ]}
      />

      {/* Page Header */}
      <Card>
        <div className="flex items-center space-x-3">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(listPath)}
          />
          <div>
            <h1 className="text-2xl font-bold m-0">Create Announcement</h1>
            <p className="text-gray-500 mt-1">
              {role === 'admin' ? 'Create announcement for all company or specific department' : 'Create announcement for your department'}
            </p>
          </div>
        </div>
      </Card>

      {/* Announcement Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isActive: true,
          }}
        >
          {/* Admin: Company-wide or Department selection */}
          {role === 'admin' && (
            <>
              <Form.Item
                label="Announcement Scope"
                tooltip="Choose if this announcement is for the entire company or a specific department"
              >
                <Space>
                  <span>Department-specific</span>
                  <Switch 
                    checked={isCompanyWide}
                    onChange={handleCompanyWideChange}
                  />
                  <span>Company-wide</span>
                </Space>
              </Form.Item>

              {!isCompanyWide && (
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="departmentId"
                      label="Select Department"
                      rules={[{ required: !isCompanyWide, message: 'Please select a department' }]}
                    >
                      <Select
                        placeholder="Select department"
                        loading={isLoadingDepartments}
                        onChange={handleDepartmentChange}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children as unknown as string)
                            ?.toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      >
                        {(Array.isArray(departments) ? departments : departments?.data || []).map((dept: any) => (
                          <Select.Option key={dept.id} value={dept.id}>
                            {dept.departmentName || dept.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </>
          )}

          {/* Recipient Selection (optional) */}
          {((role === 'admin' && selectedDepartment && !isCompanyWide) || role === 'manager') && (
            <Form.Item
              name="recipientUserIds"
              label="Select Recipients (Optional)"
              tooltip="Leave empty to send to all users in the department"
            >
              <Select
                mode="multiple"
                placeholder="Select specific users (or leave empty for all)"
                loading={role === 'admin' ? isLoadingUsers : isLoadingManagerUsers}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {filteredUsers.map((user: any) => (
                  <Select.Option key={user.id} value={user.id}>
                    {user.fullName || user.name} ({user.employeeCode || user.email})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="title"
                label="Title"
                rules={[
                  { required: true, message: 'Please enter announcement title' },
                  { max: 255, message: 'Title cannot exceed 255 characters' },
                ]}
              >
                <Input placeholder="e.g., Office Closure Notice" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="date"
                label="Announcement Date"
                rules={[{ required: true, message: 'Please select announcement date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please enter announcement description' },
              { max: 2000, message: 'Description cannot exceed 2000 characters' },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Enter the full announcement details..."
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={createAnnouncementMutation.isPending}
              >
                Create Announcement
              </Button>
              <Button onClick={() => router.push(listPath)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
