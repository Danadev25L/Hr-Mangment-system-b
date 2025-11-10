'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Modal,
  message,
  Select,
  DatePicker,
  Dropdown,
} from 'antd'
import {
  PlusOutlined,
  ExportOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  ClearOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import apiClient from '@/lib/api'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import {
  EnhancedTable,
  SearchInput,
  StatCard,
  PageHeader,
  FilterBar,
  FilterSelect,
  FilterDateRange,
  EnhancedButton,
  EnhancedModal,
} from '@/components/ui'
import { ExpensesIllustration } from '@/components/ui/illustrations'
import { ExpenseStats } from './ExpenseStats'
import { ExpenseTable } from './ExpenseTable'
import type { MenuProps } from 'antd'

const { RangePicker } = DatePicker
const { Option } = Select

interface ExpenseListPageProps {
  role: 'admin' | 'manager'
  title?: string
  description?: string
}

export interface Expense {
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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const locale = useLocale()

  // Set default title and description if not provided
  const pageTitle = title || (role === 'admin' ? t('expenses.allExpenses') : t('expenses.teamExpenses'))
  const pageDescription = description || (role === 'admin' 
    ? t('expenses.subtitle') 
    : t('expenses.subtitleManager'))
  
  // Initialize from URL params
  const [searchText, setSearchText] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || undefined,
    department: role === 'admin' ? searchParams.get('department') || undefined : undefined,
  })
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    searchParams.get('startDate') && searchParams.get('endDate')
      ? [dayjs(searchParams.get('startDate')), dayjs(searchParams.get('endDate'))]
      : null
  )
  const [pagination, setPagination] = useState({
    current: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('limit') || '10'),
  })

  // Fetch departments for admin
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.getDepartments(),
    enabled: role === 'admin',
  })

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchText) params.set('search', searchText)
    if (filters.status) params.set('status', filters.status)
    if (filters.department) params.set('department', filters.department)
    if (dateRange?.[0]) params.set('startDate', dateRange[0].toISOString())
    if (dateRange?.[1]) params.set('endDate', dateRange[1].toISOString())
    params.set('page', pagination.current.toString())
    params.set('limit', pagination.pageSize.toString())
    
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchText, filters, dateRange, pagination, pathname, router])

  // Fetch expenses
  const { data: expensesData, isLoading, refetch } = useQuery({
    queryKey: [
      'expenses',
      role,
      pagination.current,
      pagination.pageSize,
      searchText,
      filters,
      dateRange
    ],
    queryFn: () =>
      apiClient.getExpenses(pagination.current, pagination.pageSize, {
        search: searchText,
        status: filters.status,
        department: filters.department,
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
      } else if (status === 'paid') {
        message.success(t('expenses.paidSuccess'))
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
    onError: (error: any, { status }) => {
      if (status === 'approved') {
        message.error(error.response?.data?.message || t('expenses.approveError'))
      } else if (status === 'rejected') {
        message.error(error.response?.data?.message || t('expenses.rejectError'))
      } else {
        message.error(error.response?.data?.message || t('expenses.updateError'))
      }
    },
  })

  const handleDeleteExpense = (expense: Expense) => {
    Modal.confirm({
      title: t('expenses.deleteExpense'),
      content: t('expenses.deleteConfirm'),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => deleteExpenseMutation.mutate(expense.id),
    })
  }

  const handleApprove = (expense: Expense) => {
    Modal.confirm({
      title: t('expenses.approve'),
      content: t('expenses.approveConfirm', { amount: expense.amount, reason: expense.reason }),
      okText: t('expenses.approve'),
      okType: 'primary',
      cancelText: t('common.cancel'),
      onOk: () => updateStatusMutation.mutate({ id: expense.id, status: 'approved' }),
    })
  }

  const handleReject = (expense: Expense) => {
    Modal.confirm({
      title: t('expenses.reject'),
      content: t('expenses.rejectConfirm', { amount: expense.amount, reason: expense.reason }),
      okText: t('expenses.reject'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: () => updateStatusMutation.mutate({ id: expense.id, status: 'rejected' }),
    })
  }

  const handleMarkPaid = (expense: Expense) => {
    Modal.confirm({
      title: t('expenses.markAsPaid'),
      content: t('expenses.markPaidConfirm', { amount: expense.amount }),
      okText: t('expenses.markPaid'),
      okType: 'primary',
      cancelText: t('common.cancel'),
      onOk: () => updateStatusMutation.mutate({ id: expense.id, status: 'paid' }),
    })
  }

  // Export handlers
  const handleExportExcel = () => {
    const data = expensesData?.data || []
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((expense: Expense) => ({
        [t('expenses.submittedBy')]: expense.userName,
        [t('expenses.department')]: expense.departmentName || t('expenses.na'),
        [t('expenses.reason')]: expense.reason,
        [t('expenses.amount')]: t('expenses.amountValue', { amount: expense.amount }),
        [t('expenses.status')]: expense.status,
        [t('expenses.date')]: dayjs(expense.date).format('YYYY-MM-DD'),
        [t('expenses.createdAt')]: dayjs(expense.createdAt).format('YYYY-MM-DD HH:mm'),
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses')
    XLSX.writeFile(workbook, `expenses_${dayjs().format('YYYY-MM-DD')}.xlsx`)
    message.success(t('expenses.exportedToExcel'))
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    const data = expensesData?.data || []

    doc.setFontSize(18)
    doc.text(t('expenses.expenseReport'), 14, 22)
    doc.setFontSize(11)
    doc.text(`${t('expenses.generated')}: ${dayjs().format('YYYY-MM-DD HH:mm')}`, 14, 30)

    const tableData = data.map((expense: Expense) => [
      expense.userName,
      expense.departmentName || t('expenses.na'),
      expense.reason,
      t('expenses.amountValue', { amount: expense.amount }),
      expense.status,
      dayjs(expense.date).format('YYYY-MM-DD'),
    ])

    autoTable(doc, {
      head: [[
        t('expenses.submittedBy'),
        t('expenses.department'),
        t('expenses.reason'),
        t('expenses.amount'),
        t('expenses.status'),
        t('expenses.date')
      ]],
      body: tableData,
      startY: 35,
    })

    doc.save(`expenses_${dayjs().format('YYYY-MM-DD')}.pdf`)
    message.success(t('expenses.exportedToPDF'))
  }

  const handlePrint = () => {
    window.print()
    message.success(t('expenses.printDialogOpened'))
  }

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: t('expenses.exportToExcel'),
      onClick: handleExportExcel,
    },
    {
      key: 'pdf',
      icon: <FilePdfOutlined />,
      label: t('expenses.exportToPDF'),
      onClick: handleExportPDF,
    },
    {
      type: 'divider',
    },
    {
      key: 'print',
      icon: <PrinterOutlined />,
      label: t('expenses.printList'),
      onClick: handlePrint,
    },
  ]

  const handleResetFilters = () => {
    setSearchText('')
    setFilters({
      status: undefined,
      department: undefined,
    })
    setDateRange(null)
    setPagination({ current: 1, pageSize: 10 })
    message.success(t('expenses.filtersResetSuccess'))
  }

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    })
  }

  // Calculate statistics
  const expenses = expensesData?.data || []
  const totalExpenses = expensesData?.pagination?.total || 0
  const pendingCount = expenses.filter((e: Expense) => e.status === 'pending').length
  const approvedCount = expenses.filter((e: Expense) => e.status === 'approved').length
  const totalAmount = expenses.reduce((sum: number, e: Expense) => sum + Number(e.amount), 0)

  const basePath = role === 'admin' ? '/admin/expenses' : '/manager/expenses'

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        icon={<ExpensesIllustration className="w-20 h-20" />}
        gradient="green"
        action={
          <div className="flex items-center gap-3">
            <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
              <EnhancedButton
                variant="secondary"
                icon={<ExportOutlined />}
              >
                {t('common.export')}
              </EnhancedButton>
            </Dropdown>
            <EnhancedButton
              variant="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push(`/${locale}${basePath}/add`)}
            >
              {t('expenses.addExpense')}
            </EnhancedButton>
          </div>
        }
      />

      {/* Stats */}
      <ExpenseStats
        totalExpenses={totalExpenses}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        totalAmount={totalAmount}
      />

      {/* Search */}
      <SearchInput
        placeholder={t('expenses.searchByReason')}
        value={searchText}
        onChange={(e) => {
          setSearchText(e.target.value)
          setPagination({ ...pagination, current: 1 })
        }}
      />

      {/* Filters */}
      <FilterBar>
        <FilterSelect
          placeholder={t('expenses.status')}
          options={[
            { label: t('expenses.pending'), value: 'pending' },
            { label: t('expenses.approved'), value: 'approved' },
            { label: t('expenses.rejected'), value: 'rejected' },
            { label: t('expenses.paid'), value: 'paid' },
          ]}
          value={filters.status}
          onChange={(value) => {
            setFilters({ ...filters, status: value as string })
            setPagination({ ...pagination, current: 1 })
          }}
        />

        {role === 'admin' && (
          <FilterSelect
            placeholder={t('expenses.department')}
            options={[
              { label: t('expenses.companyWide'), value: '0' },
              ...(Array.isArray(departmentsData)
                ? departmentsData.map((dept: any) => ({
                    label: dept.departmentName,
                    value: dept.id.toString(),
                  }))
                : []),
            ]}
            value={filters.department}
            onChange={(value) => {
              setFilters({ ...filters, department: value as string })
              setPagination({ ...pagination, current: 1 })
            }}
          />
        )}

        <FilterDateRange
          value={dateRange as any}
          onChange={(dates) => {
            setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            setPagination({ ...pagination, current: 1 })
          }}
          placeholder={[t('expenses.startDate'), t('expenses.endDate')]}
        />

        <div className="ml-auto flex gap-2">
          <EnhancedButton
            variant="ghost"
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            {t('common.refresh')}
          </EnhancedButton>
          <EnhancedButton
            variant="secondary"
            icon={<ClearOutlined />}
            onClick={handleResetFilters}
          >
            {t('common.reset')}
          </EnhancedButton>
        </div>
      </FilterBar>

      {/* Table */}
      <ExpenseTable
        data={expensesData?.data || []}
        loading={isLoading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: expensesData?.pagination?.total || 0,
        }}
        onTableChange={handleTableChange}
        onView={(expense: Expense) => router.push(`/${locale}${basePath}/${expense.id}`)}
        onEdit={(expense: Expense) => router.push(`/${locale}${basePath}/${expense.id}/edit`)}
        onDelete={handleDeleteExpense}
        onApprove={handleApprove}
        onReject={handleReject}
        onMarkPaid={handleMarkPaid}
        role={role}
      />
    </div>
  )
}
