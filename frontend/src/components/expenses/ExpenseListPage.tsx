'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  message,
  Modal,
  Tag,
  Card,
  Dropdown,
  Menu,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import apiClient from '@/lib/api'
import { useTranslations } from 'next-intl'

const { RangePicker } = DatePicker

interface ExpenseListPageProps {
  role: 'admin' | 'manager'
  title?: string
  description?: string
}

interface Expense {
  id: number
  userId: number
  userName: string
  departmentId: number | null
  departmentName: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  date: string
  createdAt: string
}

export default function ExpenseListPage({ role, title, description }: ExpenseListPageProps) {
  const t = useTranslations()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Set default title and description if not provided
  const pageTitle = title || (role === 'admin' ? t('expenses.allExpenses') : t('expenses.teamExpenses'))
  const pageDescription = description || (role === 'admin' 
    ? t('expenses.subtitle') 
    : t('expenses.subtitleManager'))
  
  const [searchText, setSearchText] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    department: 'all',
  })
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  })

  // Fetch departments for admin
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: role === 'admin',
  })

  // Fetch expenses
  const { data: expensesData, isLoading, refetch } = useQuery({
    queryKey: ['expenses', role, pagination.current, pagination.pageSize, searchText, filters, dateRange],
    queryFn: () =>
      apiClient.getExpenses(pagination.current, pagination.pageSize, {
        search: searchText,
        status: filters.status !== 'all' ? filters.status : undefined,
        department: filters.department !== 'all' ? filters.department : undefined,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      }),
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: number) => apiClient.deleteExpense(expenseId.toString()),
    onSuccess: () => {
      message.success(t('expenses.deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('expenses.deleteError'))
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.updateExpenseStatus(id.toString(), status),
    onSuccess: (_, { status }) => {
      if (status === 'approved') {
        message.success(t('expenses.approveSuccess'))
      } else if (status === 'rejected') {
        message.success(t('expenses.rejectSuccess'))
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: (error: any, { status }) => {
      if (status === 'approved') {
        message.error(error.response?.data?.message || t('expenses.approveError'))
      } else if (status === 'rejected') {
        message.error(error.response?.data?.message || t('expenses.rejectError'))
      }
    },
  })

  const handleSearch = (value: string) => {
    setSearchText(value)
    setPagination({ ...pagination, current: 1 })
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
    setPagination({ ...pagination, current: 1 })
  }

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates)
    setPagination({ ...pagination, current: 1 })
  }

  const handleDeleteExpense = (expense: Expense) => {
    Modal.confirm({
      title: t('expenses.deleteExpense'),
      content: t('expenses.deleteConfirm'),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: 'No',
      onOk: () => deleteExpenseMutation.mutate(expense.id),
    })
  }

  const handleApprove = (expense: Expense) => {
    Modal.confirm({
      title: t('expenses.approve'),
      content: `${t('expenses.approve')} $${expense.amount} - "${expense.reason}"?`,
      okText: t('expenses.approve'),
      okType: 'primary',
      cancelText: t('common.cancel'),
      onOk: () => updateStatusMutation.mutate({ id: expense.id, status: 'approved' }),
    })
  }

  const handleReject = (expense: Expense) => {
    Modal.confirm({
      title: t('expenses.reject'),
      content: `${t('expenses.reject')} $${expense.amount} - "${expense.reason}"?`,
      okText: t('expenses.reject'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => updateStatusMutation.mutate({ id: expense.id, status: 'rejected' }),
    })
  }

  const handleMarkPaid = (expense: Expense) => {
    Modal.confirm({
      title: 'Mark as Paid',
      content: `Mark expense of $${expense.amount} as paid?`,
      okText: 'Mark Paid',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: () => updateStatusMutation.mutate({ id: expense.id, status: 'paid' }),
    })
  }

  const exportToExcel = () => {
    const data = expensesData?.data || []
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((expense: Expense) => ({
        'Submitted By': expense.userName,
        Department: expense.departmentName || 'N/A',
        Reason: expense.reason,
        Amount: `$${expense.amount}`,
        Status: expense.status,
        Date: dayjs(expense.date).format('YYYY-MM-DD'),
        'Created At': dayjs(expense.createdAt).format('YYYY-MM-DD HH:mm'),
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses')
    XLSX.writeFile(workbook, `expenses_${dayjs().format('YYYY-MM-DD')}.xlsx`)
    message.success('Expenses exported to Excel successfully')
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const data = expensesData?.data || []

    doc.setFontSize(18)
    doc.text('Expense Report', 14, 22)
    doc.setFontSize(11)
    doc.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm')}`, 14, 30)

    const tableData = data.map((expense: Expense) => [
      expense.userName,
      expense.departmentName || 'N/A',
      expense.reason,
      `$${expense.amount}`,
      expense.status,
      dayjs(expense.date).format('YYYY-MM-DD'),
    ])

    ;(doc as any).autoTable({
      head: [['Submitted By', 'Department', 'Reason', 'Amount', 'Status', 'Date']],
      body: tableData,
      startY: 35,
    })

    doc.save(`expenses_${dayjs().format('YYYY-MM-DD')}.pdf`)
    message.success('Expenses exported to PDF successfully')
  }

  const handlePrint = () => {
    window.print()
    message.success('Print dialog opened')
  }

  const getStatusTag = (status: string) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <ClockCircleOutlined />, text: t('expenses.pending') },
      approved: { color: 'success', icon: <CheckCircleOutlined />, text: t('expenses.approved') },
      rejected: { color: 'error', icon: <CloseCircleOutlined />, text: t('expenses.rejected') },
      paid: { color: 'processing', icon: <DollarOutlined />, text: t('expenses.approved') },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text.toUpperCase()}
      </Tag>
    )
  }

  const columns = [
    {
      title: t('expenses.submittedBy'),
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
    },
    ...(role === 'admin'
      ? [
          {
            title: t('expenses.department'),
            dataIndex: 'departmentName',
            key: 'departmentName',
            width: 150,
            render: (text: string) => text || t('expenses.department'),
          },
        ]
      : []),
    {
      title: t('expenses.expenseTitle'),
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: t('expenses.amount'),
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <span className="font-semibold text-green-600">${amount.toFixed(2)}</span>
      ),
    },
    {
      title: t('expenses.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: t('expenses.date'),
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: t('expenses.actions'),
      key: 'actions',
      width: 100,
      render: (_: any, record: Expense) => {
        const menuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: t('expenses.viewDetails'),
            onClick: () => router.push(`${basePath}/${record.id}`),
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: t('common.edit'),
            onClick: () => router.push(`${basePath}/${record.id}/edit`),
          },
          ...(role === 'admin' && record.status === 'pending'
            ? [
                { type: 'divider' as const },
                {
                  key: 'approve',
                  icon: <CheckCircleOutlined />,
                  label: t('expenses.approve'),
                  onClick: () => handleApprove(record),
                },
                {
                  key: 'reject',
                  icon: <CloseCircleOutlined />,
                  label: 'Reject',
                  onClick: () => handleReject(record),
                },
              ]
            : []),
          ...(role === 'admin' && record.status === 'approved'
            ? [
                { type: 'divider' as const },
                {
                  key: 'paid',
                  icon: <DollarOutlined />,
                  label: 'Mark as Paid',
                  onClick: () => handleMarkPaid(record),
                },
              ]
            : []),
          { type: 'divider' as const },
          {
            key: 'delete',
            danger: true,
            icon: <DeleteOutlined />,
            label: 'Delete',
            onClick: () => handleDeleteExpense(record),
          },
        ]

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  const exportMenuItems = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: 'Export to Excel',
      onClick: exportToExcel,
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: 'Export to PDF',
      onClick: exportToPDF,
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: 'Print',
      onClick: handlePrint,
    },
  ]

  // Calculate statistics
  const expenses = expensesData?.data || []
  const totalExpenses = expenses.length
  const pendingCount = expenses.filter((e: Expense) => e.status === 'pending').length
  const approvedCount = expenses.filter((e: Expense) => e.status === 'approved').length
  const totalAmount = expenses.reduce((sum: number, e: Expense) => sum + Number(e.amount), 0)

  const basePath = role === 'admin' ? '/admin/expenses' : '/manager/expenses'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{pageDescription}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
          <Dropdown menu={{ items: exportMenuItems }} trigger={['click']}>
            <Button icon={<ExportOutlined />}>Export</Button>
          </Dropdown>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push(`${basePath}/add`)}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={16}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Total Expenses"
              value={totalExpenses}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Pending"
              value={pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Approved"
              value={approvedCount}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={totalAmount}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Table Card */}
      <Card>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Search by reason or name..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-64"
            allowClear
          />

          <Select
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            className="w-40"
            suffixIcon={<FilterOutlined />}
          >
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="approved">Approved</Select.Option>
            <Select.Option value="rejected">Rejected</Select.Option>
            <Select.Option value="paid">Paid</Select.Option>
          </Select>

          {role === 'admin' && (
            <Select
              value={filters.department}
              onChange={(value) => handleFilterChange('department', value)}
              className="w-48"
              suffixIcon={<FilterOutlined />}
            >
              <Select.Option value="all">All Departments</Select.Option>
              <Select.Option value="0">Company-wide</Select.Option>
              {departmentsData?.map((dept: any) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.departmentName}
                </Select.Option>
              ))}
            </Select>
          )}

          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            placeholder={['Start Date', 'End Date']}
          />
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={expensesData?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: expensesData?.pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} expenses`,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize: pageSize || 10 })
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  )
}
