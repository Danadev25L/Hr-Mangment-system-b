'use client'

import React from 'react'
import { Row, Col, Card, Typography, Space, Button } from 'antd'
import {
  RiseOutlined,
  TeamOutlined,
  EyeOutlined,
  BarChartOutlined,
  PieChartOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { createLocalizedPath, getCurrentLocale } from '@/lib/localized-routes'

const { Text } = Typography

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B9D', '#C23531']

interface DashboardChartsProps {
  employeeGrowthData: any[]
  departmentChartData: any[]
}

export function DashboardCharts({ employeeGrowthData, departmentChartData }: DashboardChartsProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const locale = getCurrentLocale(pathname)

  // Fetch annual attendance (all 12 months) from backend
  const { data: attendanceData } = useQuery({
    queryKey: ['annual-attendance'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/charts/annual-attendance`, {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
      })
      if (!response.ok) return []
      const data = await response.json()
      return data.data || []
    },
  })

  // Fetch salary overview from backend
  const { data: salaryData } = useQuery({
    queryKey: ['salary-overview'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/charts/salary-overview`, {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
        },
      })
      if (!response.ok) return null
      const data = await response.json()
      return data.data || null
    },
  })

  // Format attendance data (already comes formatted from backend)
  const monthlyAttendanceData = attendanceData || []

  // Format salary by department data
  const salaryByDepartment = salaryData?.byDepartment?.map((dept: any) => ({
    name: dept.departmentName,
    value: parseInt(dept.totalSalary) || 0,
    employees: parseInt(dept.employeeCount) || 0,
  })) || []

  return (
    <>
      {/* First Row - Employee Growth & Department Distribution */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div className="flex items-center justify-between">
                <Space>
                  <RiseOutlined className="text-blue-500" />
                  <Text strong className="dark:text-white">{t('dashboard.charts.employeeGrowth')}</Text>
                </Space>
                <Button
                  type="link"
                  onClick={() => router.push(createLocalizedPath(locale, '/admin/users'))}
                  icon={<EyeOutlined />}
                  className="dark:text-blue-400"
                >
                  {t('common.viewAll')}
                </Button>
              </div>
            }
            className="dark:bg-gray-800 dark:border-gray-700"
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={employeeGrowthData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <TeamOutlined className="text-purple-500" />
                <Text strong className="dark:text-white">{t('dashboard.charts.departmentDistribution')}</Text>
              </Space>
            }
            className="dark:bg-gray-800 dark:border-gray-700"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Second Row - Annual Attendance & Salary Overview */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <BarChartOutlined className="text-green-500" />
                <Text strong className="dark:text-white">{t('dashboard.charts.annualAttendance')}</Text>
              </Space>
            }
            className="dark:bg-gray-800 dark:border-gray-700"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB',
                  }}
                />
                <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                <Bar dataKey="present" fill="#10B981" name={t('dashboard.stats.present')} />
                <Bar dataKey="absent" fill="#EF4444" name={t('dashboard.stats.absent')} />
                <Bar dataKey="late" fill="#F59E0B" name={t('dashboard.stats.late')} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <PieChartOutlined className="text-orange-500" />
                <Text strong className="dark:text-white">{t('dashboard.charts.salaryByDepartment')}</Text>
              </Space>
            }
            className="dark:bg-gray-800 dark:border-gray-700"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salaryByDepartment}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {salaryByDepartment.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <Text className="text-2xl font-bold dark:text-green-400">
                ${(salaryData?.totalBudget || 0).toLocaleString()}
              </Text>
              <br />
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {t('dashboard.charts.totalSalaryBudget')}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  )
}
