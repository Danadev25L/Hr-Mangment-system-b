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
import { useTranslations } from 'next-intl'
import {
  EnhancedTable,
  SearchInput,
  StatCard,
  PageHeader,
  EnhancedModal,
  EnhancedButton,
} from '@/components/ui'
import { DepartmentsIllustration } from '@/components/ui/illustrations'

const { Search} = Input

export default function DepartmentsPage() {
  const t = useTranslations()
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
      message.success(t('departments.createSuccess'))
      setIsModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('departments.createError'))
    },
  })

  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateDepartment(id, data),
    onSuccess: () => {
      message.success(t('departments.updateSuccess'))
      setIsModalVisible(false)
      setEditingDepartment(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('departments.updateError'))
    },
  })

  const deleteDepartmentMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteDepartment(id),
    onSuccess: () => {
      message.success(t('departments.deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('departments.deleteError'))
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
      title: t('departments.departmentName'),
      key: 'department',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar
            icon={<TeamOutlined />}
            className="bg-blue-100 text-blue-600"
          />
          <div>
            <p className="font-medium text-gray-900">{record.departmentName}</p>
            <p className="text-sm text-gray-500">{t('departments.departmentId')}: {record.id}</p>
          </div>
        </div>
      ),
    },
    {
      title: t('departments.employees'),
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
      title: t('departments.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'} className="capitalize">
          {isActive ? t('departments.active') : t('departments.inactive')}
        </Tag>
      ),
      filters: [
        { text: t('departments.active'), value: true },
        { text: t('departments.inactive'), value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: t('departments.created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: t('departments.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditDepartment(record)}
          />
          <Popconfirm
            title={t('departments.deleteDepartment')}
            description={`${t('departments.deleteConfirm')} ${record.departmentName}?`}
            onConfirm={() => deleteDepartmentMutation.mutate(record.id.toString())}
            okText={t('common.delete')}
            cancelText={t('common.cancel')}
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
          <PageHeader
            title={t('departments.title')}
            description={t('departments.subtitle')}
            icon={<DepartmentsIllustration className="w-20 h-20" />}
            gradient="blue"
            action={
              <EnhancedButton
                variant="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateDepartment}
              >
                {t('departments.addDepartment')}
              </EnhancedButton>
            }
          />

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title={t('departments.totalDepartments')}
              value={departmentStats?.totalDepartments || 0}
              icon={<BankOutlined />}
              color="blue"
            />
            <StatCard
              title={t('departments.activeDepartments')}
              value={departmentStats?.activeDepartments || 0}
              icon={<TeamOutlined />}
              color="green"
            />
            <StatCard
              title={t('departments.totalEmployees')}
              value={departmentStats?.totalEmployees || 0}
              icon={<UserOutlined />}
              color="purple"
            />
          </div>

          {/* Search */}
          <SearchInput
            placeholder={t('departments.searchPlaceholder')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          {/* Departments Table */}
          <EnhancedTable
            columns={columns}
            dataSource={filteredDepartments}
            rowKey="id"
            loading={isLoading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                t('departments.showingResults', { from: range[0], to: range[1], total }),
            }}
          />

          {/* Create/Edit Department Modal */}
          <EnhancedModal
            title={editingDepartment ? t('departments.editDepartment') : t('departments.createDepartment')}
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
                label={t('departments.departmentName')}
                rules={[{ required: true, message: t('departments.departmentNameRequired') }]}
              >
                <Input placeholder={t('departments.enterDepartmentName')} className="rounded-lg" />
              </Form.Item>

              <Form.Item
                name="isActive"
                label={t('departments.status')}
                valuePropName="checked"
              >
                <Checkbox>{t('departments.active')}</Checkbox>
              </Form.Item>

              <Form.Item className="mb-0">
                <div className="flex justify-end gap-3">
                  <EnhancedButton
                    variant="secondary"
                    onClick={() => setIsModalVisible(false)}
                  >
                    {t('departments.cancel')}
                  </EnhancedButton>
                  <EnhancedButton
                    variant="primary"
                    htmlType="submit"
                    loading={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
                  >
                    {editingDepartment ? t('departments.update') : t('departments.create')}
                  </EnhancedButton>
                </div>
              </Form.Item>
            </Form>
          </EnhancedModal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}