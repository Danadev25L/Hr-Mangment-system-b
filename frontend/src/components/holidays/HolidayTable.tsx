'use client'

import { Table, Tag, Button, Dropdown, Space } from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { MenuProps } from 'antd'
import { CustomSpinner } from '@/components/ui'

export interface Holiday {
  id: number
  name: string
  date: string
  description?: string
  createdAt?: string
}

interface HolidayTableProps {
  data: Holiday[]
  loading: boolean
  onView: (record: Holiday) => void
  onEdit?: (record: Holiday) => void
  onDelete?: (id: number, name: string) => void
  role: 'admin' | 'manager' | 'employee'
}

export function HolidayTable({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  role,
}: HolidayTableProps) {
  const today = dayjs()

  const columns: any[] = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 180,
      render: (date: string) => (
        <Space>
          <CalendarOutlined className="text-blue-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {dayjs(date).format('MMMM DD, YYYY')}
          </span>
          {dayjs(date).isSame(today, 'day') && (
            <Tag color="green" className="font-medium">TODAY</Tag>
          )}
        </Space>
      ),
      sorter: (a: Holiday, b: Holiday) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      defaultSortOrder: 'ascend' as const,
    },
    {
      title: 'Holiday Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string) => (
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {text || 'Unnamed Holiday'}
        </span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <span className="text-gray-600 dark:text-gray-400">
          {text || 'No description'}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      render: (_: any, record: Holiday) => {
        const holidayDate = dayjs(record.date)
        const isToday = holidayDate.isSame(today, 'day')
        const isPast = holidayDate.isBefore(today, 'day')

        if (isToday) {
          return (
            <Tag color="green" icon={<CheckCircleOutlined />} className="font-medium">
              TODAY
            </Tag>
          )
        } else if (isPast) {
          return <Tag color="default" className="font-medium">PAST</Tag>
        } else {
          const daysUntil = holidayDate.diff(today, 'days')
          return (
            <Tag color="blue" className="font-medium">
              IN {daysUntil} {daysUntil === 1 ? 'DAY' : 'DAYS'}
            </Tag>
          )
        }
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 80,
      render: (_: any, record: Holiday) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View Details',
            onClick: () => onView(record),
          },
        ]

        if (role === 'admin') {
          menuItems.push(
            {
              key: 'edit',
              icon: <EditOutlined />,
              label: 'Edit',
              onClick: () => onEdit?.(record),
            },
            { type: 'divider' },
            {
              key: 'delete',
              icon: <DeleteOutlined />,
              danger: true,
              label: 'Delete',
              onClick: () => onDelete?.(record.id, record.name),
            }
          )
        }

        return (
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="hover:bg-gray-100 dark:hover:bg-gray-700"
            />
          </Dropdown>
        )
      },
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={{
        spinning: loading,
        indicator: <CustomSpinner text="Loading holidays..." />,
      }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} holidays`,
        showQuickJumper: true,
      }}
      scroll={{ x: 1000 }}
      className="shadow-sm"
    />
  )
}
