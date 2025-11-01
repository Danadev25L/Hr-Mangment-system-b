'use client'

import React, { useState } from 'react'
import {
  Table,
  Card,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
  Avatar,
  Progress,
  Checkbox,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
  DollarOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { ColumnsType } from 'antd/es/table'
import type { Department } from '@/types'

const { Search } = Input

export default function DepartmentsPage() {
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: departments, isLoading, refetch } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
  })

  const { data: departmentStats } = useQuery({
    queryKey: ['department-stats'],
    queryFn: () => apiClient.get('/api/admin/departments/statistics'),
  })

  const createDepartmentMutation = useMutation({
    mutationFn: (data: any) => apiClient.createDepartment(data),
    onSuccess: () => {
      message.success('Department created successfully')
      setIsModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create department')
    },
  })

  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateDepartment(id, data),
    onSuccess: () => {
      message.success('Department updated successfully')
      setIsModalVisible(false)
      setEditingDepartment(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to update department')
    },
  })

  const deleteDepartmentMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteDepartment(id),
    onSuccess: () => {
      message.success('Department deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to delete department')
    },
  })

  const handleCreateDepartment = () => {
    setEditingDepartment(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    form.setFieldsValue(department)
    setIsModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingDepartment) {
        await updateDepartmentMutation.mutateAsync({
          id: editingDepartment.id.toString(),
          data: values,
        })
      } else {
        await createDepartmentMutation.mutateAsync(values)
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  
  const columns: ColumnsType<Department> = [
    {
      title: 'Department',
      key: 'department',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar
            icon={<TeamOutlined />}
            className="bg-blue-100 text-blue-600"
          />
          <div>
            <p className="font-medium text-gray-900">{record.departmentName}</p>
            <p className="text-sm text-gray-500">Department ID: {record.id}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Employees',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      render: (count, record) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{count || 0}</span>
          <Progress
            percent={count > 0 ? (count / 50) * 100 : 0}
            size="small"
            showInfo={false}
            strokeColor="#2563eb"
          />
          {record.users && record.users.length > 0 && (
            <div className="flex -space-x-1">
              {record.users.slice(0, 3).map((user: any, index: number) => (
                <Avatar
                  key={user.id}
                  size="small"
                  icon={<UserOutlined />}
                  className="bg-gray-100 text-gray-600 border-2 border-white"
                  title={user.username}
                />
              ))}
              {record.users.length > 3 && (
                <Avatar
                  size="small"
                  className="bg-gray-200 text-gray-600 border-2 border-white"
                >
                  +{record.users.length - 3}
                </Avatar>
              )}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.employeeCount || 0) - (b.employeeCount || 0),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'} className="capitalize">
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditDepartment(record)}
          />
          <Popconfirm
            title="Delete Department"
            description={`Are you sure you want to delete ${record.departmentName}?`}
            onConfirm={() => deleteDepartmentMutation.mutate(record.id.toString())}
            okText="Delete"
            cancelText="Cancel"
            okType="danger"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const filteredDepartments = (departments?.data || departments || []).filter((dept: any) =>
    dept.departmentName?.toLowerCase().includes(searchText.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <DashboardLayout role="ROLE_ADMIN">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
              <p className="text-gray-500">Manage organizational departments</p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateDepartment}
            >
              Add Department
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Departments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {departmentStats?.totalDepartments || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BankOutlined className="text-blue-600 text-xl" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Departments</p>
                  <p className="text-2xl font-bold text-green-600">
                    {departmentStats?.activeDepartments || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TeamOutlined className="text-green-600 text-xl" />
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {departmentStats?.totalEmployees || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserOutlined className="text-purple-600 text-xl" />
                </div>
              </div>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <Search
              placeholder="Search departments..."
              allowClear
              enterButton={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </Card>

          {/* Departments Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={filteredDepartments}
              rowKey="id"
              loading={isLoading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `Showing ${range[0]} to ${range[1]} of ${total} departments`,
              }}
            />
          </Card>

          {/* Create/Edit Department Modal */}
          <Modal
            title={editingDepartment ? 'Edit Department' : 'Create Department'}
            open={isModalVisible}
            onCancel={() => {
              setIsModalVisible(false)
              setEditingDepartment(null)
              form.resetFields()
            }}
            footer={null}
            width={600}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                name="departmentName"
                label="Department Name"
                rules={[{ required: true, message: 'Please enter department name' }]}
              >
                <Input placeholder="Enter department name" />
              </Form.Item>

              <Form.Item
                name="isActive"
                label="Status"
                valuePropName="checked"
              >
                <Checkbox>Active</Checkbox>
              </Form.Item>

              <Form.Item className="mb-0">
                <div className="flex justify-end space-x-2">
                  <Button onClick={() => setIsModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
                  >
                    {editingDepartment ? 'Update' : 'Create'}
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}