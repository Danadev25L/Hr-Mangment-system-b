'use client'

import React, { useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  Switch,
  Space,
  Breadcrumb,
  message,
  Spin,
  Empty,
} from 'antd'
import {
  HomeOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

interface AnnouncementEditPageProps {
  role: 'admin' | 'manager'
  id: string
}

export function AnnouncementEditPage({ role, id }: AnnouncementEditPageProps) {
  const [form] = Form.useForm()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isCompanyWide, setIsCompanyWide] = React.useState(false)
  const [selectedDepartment, setSelectedDepartment] = React.useState<number | null>(null)

  const basePath = role === 'admin' ? '/admin' : '/manager'
  const dashboardPath = `${basePath}/dashboard`
  const listPath = `${basePath}/announcements`

  // Fetch announcement details
  const { data: announcement, isLoading: announcementLoading } = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => apiClient.getAnnouncement(parseInt(id)),
  })

  // Fetch departments (admin only)
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: role === 'admin',
  })

  // Fetch users for selected department
  const { data: users } = useQuery({
    queryKey: ['users', selectedDepartment],
    queryFn: () => {
      if (role === 'admin') {
        return apiClient.getUsers(selectedDepartment || undefined)
      } else {
        // Manager: get users from their department
        return apiClient.getUsersForApplications()
      }
    },
    enabled: role === 'manager' || (role === 'admin' && (isCompanyWide || selectedDepartment !== null)),
  })

  // Update announcement mutation
  const updateAnnouncementMutation = useMutation({
    mutationFn: (data: any) => apiClient.updateAnnouncement(parseInt(id), data),
    onSuccess: () => {
      message.success('Announcement updated successfully')
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcement', id] })
      router.push(listPath)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update announcement')
    },
  })

  // Set form initial values when announcement is loaded
  useEffect(() => {
    if (announcement) {
      const announcementData = announcement.announcement || announcement
      
      const isCompanyWideAnnouncement = !announcementData.departmentId
      setIsCompanyWide(isCompanyWideAnnouncement)
      
      if (announcementData.departmentId) {
        setSelectedDepartment(announcementData.departmentId)
      }

      const recipientIds = announcement.recipients?.map((r: any) => r.userId) || []

      form.setFieldsValue({
        title: announcementData.title,
        description: announcementData.description,
        date: announcementData.date ? dayjs(announcementData.date) : dayjs(),
        isActive: announcementData.isActive !== undefined ? announcementData.isActive : true,
        isCompanyWide: isCompanyWideAnnouncement,
        departmentId: announcementData.departmentId,
        recipientIds: recipientIds,
      })
    }
  }, [announcement, form])

  const handleSubmit = (values: any) => {
    const payload: any = {
      title: values.title,
      description: values.description,
      date: values.date.format('YYYY-MM-DD'),
      isActive: values.isActive,
    }

    if (role === 'admin') {
      if (values.isCompanyWide) {
        payload.departmentId = null
        payload.recipientIds = []
      } else if (values.departmentId) {
        payload.departmentId = values.departmentId
        payload.recipientIds = values.recipientIds || []
      }
    } else {
      // Manager - department is implicit, just send recipients
      payload.recipientIds = values.recipientIds || []
    }

    updateAnnouncementMutation.mutate(payload)
  }

  const handleCompanyWideChange = (checked: boolean) => {
    setIsCompanyWide(checked)
    if (checked) {
      form.setFieldsValue({ departmentId: undefined, recipientIds: [] })
      setSelectedDepartment(null)
    }
  }

  const handleDepartmentChange = (value: number) => {
    setSelectedDepartment(value)
    form.setFieldsValue({ recipientIds: [] })
  }

  if (announcementLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (!announcement) {
    return (
      <Card>
        <Empty description="Announcement not found" />
        <div className="text-center mt-4">
          <Button onClick={() => router.push(listPath)}>
            Back to Announcements
          </Button>
        </div>
      </Card>
    )
  }

  const departmentList = Array.isArray(departments) ? departments : departments?.departments || []
  const userList = Array.isArray(users) ? users : users?.users || []

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
            title: 'Edit Announcement',
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
          <h1 className="text-2xl font-semibold m-0">Edit Announcement</h1>
        </div>
      </Card>

      {/* Form Card */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            isActive: true,
            date: dayjs(),
            isCompanyWide: false,
          }}
        >
          {/* Company-wide toggle (admin only) */}
          {role === 'admin' && (
            <Form.Item
              name="isCompanyWide"
              label="Company-wide Announcement"
              valuePropName="checked"
              tooltip="If enabled, this announcement will be visible to all employees across all departments"
            >
              <Switch onChange={handleCompanyWideChange} />
            </Form.Item>
          )}

          {/* Department selection (admin only, hidden if company-wide) */}
          {role === 'admin' && !isCompanyWide && (
            <Form.Item
              name="departmentId"
              label="Department"
              rules={[
                { required: !isCompanyWide, message: 'Please select a department' },
              ]}
            >
              <Select
                placeholder="Select department"
                onChange={handleDepartmentChange}
                showSearch
                optionFilterProp="children"
              >
                {departmentList.map((dept: any) => (
                  <Option key={dept.id} value={dept.id}>
                    {dept.departmentName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* Title */}
          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: 'Please enter announcement title' },
              { max: 255, message: 'Title cannot exceed 255 characters' },
            ]}
          >
            <Input placeholder="Enter announcement title" />
          </Form.Item>

          {/* Date */}
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          {/* Description */}
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
              placeholder="Enter announcement description"
              showCount
              maxLength={2000}
            />
          </Form.Item>

          {/* Recipients (optional) */}
          {(role === 'manager' || (role === 'admin' && selectedDepartment !== null && !isCompanyWide)) && (
            <Form.Item
              name="recipientIds"
              label={`Select Recipients (Optional)`}
              tooltip="If no recipients are selected, the announcement will be sent to all users in the department"
            >
              <Select
                mode="multiple"
                placeholder="Select specific users or leave empty for all department users"
                showSearch
                optionFilterProp="children"
              >
                {userList.map((user: any) => (
                  <Option key={user.id} value={user.id}>
                    {user.fullName} - {user.role}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* Active Status */}
          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          {/* Form Actions */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={updateAnnouncementMutation.isPending}
              >
                Update Announcement
              </Button>
              <Button onClick={() => router.push(listPath)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
