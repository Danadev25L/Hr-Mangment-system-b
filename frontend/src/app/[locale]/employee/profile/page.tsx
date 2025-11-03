'use client'

import React, { useState } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  message,
  Row,
  Col,
  Select,
  DatePicker,
  InputNumber,
  Divider,
  Typography,
  Space,
  Tag,
} from 'antd'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  SaveOutlined,
  UploadOutlined,
  CameraOutlined,
} from '@ant-design/icons'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils'
import type { UploadProps } from 'antd'
import dayjs from 'dayjs'
import apiClient from '@/lib/api'
import type { User, PersonalInformation, EmergencyContact } from '@/types'

const { Title, Text } = Typography
const { Option } = Select

interface ProfileData {
  user: User
  personalInfo: PersonalInformation | null
}

export default function ProfilePage() {
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [isEditingProfessional, setIsEditingProfessional] = useState(false)
  const [personalForm] = Form.useForm()
  const [professionalForm] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['employee-profile'],
    queryFn: async (): Promise<ProfileData> => {
      const [user, personalInfo] = await Promise.all([
        apiClient.getCurrentUser(),
        apiClient.getPersonalInformation().catch(() => null)
      ])

      return { user, personalInfo }
    },
  })

  const updatePersonalInfoMutation = useMutation({
    mutationFn: (data: Partial<PersonalInformation>) => {
      if (profileData?.personalInfo) {
        return apiClient.updatePersonalInformation(data)
      } else {
        return apiClient.createPersonalInformation({
          userId: profileData?.user.id,
          ...data
        })
      }
    },
    onSuccess: () => {
      message.success('Personal information updated successfully')
      setIsEditingPersonal(false)
      queryClient.invalidateQueries({ queryKey: ['employee-profile'] })
    },
    onError: (error) => {
      message.error('Failed to update personal information')
      console.error('Update personal info error:', error)
    },
  })

  const updateProfessionalInfoMutation = useMutation({
    mutationFn: (data: Partial<User>) => {
      return apiClient.updateUser(profileData?.user.id!, data)
    },
    onSuccess: () => {
      message.success('Professional information updated successfully')
      setIsEditingProfessional(false)
      queryClient.invalidateQueries({ queryKey: ['employee-profile'] })
    },
    onError: (error) => {
      message.error('Failed to update professional information')
      console.error('Update professional info error:', error)
    },
  })

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/upload',
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList)
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`)
      }
    },
  }

  const handlePersonalInfoSubmit = (values: Partial<PersonalInformation>) => {
    const submitData = {
      ...values,
      dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).format('YYYY-MM-DD') : undefined
    }
    updatePersonalInfoMutation.mutate(submitData)
  }

  const handleProfessionalInfoSubmit = (values: Partial<User>) => {
    updateProfessionalInfoMutation.mutate(values)
  }

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="employee">
        <DashboardLayout role="employee">
          <div className="flex items-center justify-center min-h-screen">
            <div>Loading...</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="employee">
      <DashboardLayout role="employee">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="!mb-2">
                My Profile
              </Title>
              <Text className="text-gray-500">
                Manage your personal and professional information
              </Text>
            </div>
          </div>

          {/* Profile Header */}
          <Card>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar
                  size={120}
                  src={profileData?.user.avatar}
                  icon={<UserOutlined />}
                  className="bg-primary-100 text-primary-600"
                />
                <Upload {...uploadProps} showUploadList={false}>
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<CameraOutlined />}
                    className="absolute bottom-0 right-0"
                    size="small"
                  />
                </Upload>
              </div>
              <div className="flex-1">
                <Title level={3} className="!mb-1">
                  {profileData?.personalInfo?.firstName || profileData?.user.fullName} {profileData?.personalInfo?.lastName || ''}
                </Title>
                <Text className="text-gray-500 text-lg">
                  {profileData?.user.jobTitle} • {profileData?.user.department || 'No Department'}
                </Text>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Tag color="blue">Employee ID: {profileData?.user.employeeCode}</Tag>
                  <Tag color="green">Joined {formatDate(profileData?.user.createdAt)}</Tag>
                  <Tag color="purple">Role: {profileData?.user.role?.replace('ROLE_', '').toLowerCase()}</Tag>
                </div>
              </div>
            </div>
          </Card>

          <Row gutter={[24, 24]}>
            {/* Personal Information */}
            <Col xs={24} lg={12}>
              <Card
                title="Personal Information"
                extra={
                  <Button
                    type="text"
                    icon={isEditingPersonal ? <SaveOutlined /> : <EditOutlined />}
                    onClick={() => {
                      if (isEditingPersonal) {
                        personalForm.submit()
                      } else {
                        setIsEditingPersonal(true)
                        personalForm.setFieldsValue({
                          ...profileData?.personalInfo,
                          dateOfBirth: profileData?.personalInfo?.dateOfBirth ? dayjs(profileData.personalInfo.dateOfBirth) : null,
                        })
                      }
                    }}
                    loading={updatePersonalInfoMutation.isPending}
                  >
                    {isEditingPersonal ? 'Save' : 'Edit'}
                  </Button>
                }
              >
                <Form
                  form={personalForm}
                  layout="vertical"
                  onFinish={handlePersonalInfoSubmit}
                  disabled={!isEditingPersonal}
                  initialValues={{
                    ...profileData?.personalInfo,
                    dateOfBirth: profileData?.personalInfo?.dateOfBirth ? dayjs(profileData.personalInfo.dateOfBirth) : null,
                  }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="firstName"
                        label="First Name"
                        rules={[{ required: true, message: 'Please enter your first name' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="lastName"
                        label="Last Name"
                        rules={[{ required: true, message: 'Please enter your last name' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="email"
                    label="Personal Email"
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email' },
                    ]}
                  >
                    <Input prefix={<MailOutlined />} />
                  </Form.Item>

                  
                  <Form.Item
                    name="dateOfBirth"
                    label="Date of Birth"
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="gender" label="Gender">
                        <Select placeholder="Select gender">
                          <Option value="male">Male</Option>
                          <Option value="female">Female</Option>
                          <Option value="other">Other</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="maritalStatus" label="Marital Status">
                        <Select placeholder="Select marital status">
                          <Option value="single">Single</Option>
                          <Option value="married">Married</Option>
                          <Option value="divorced">Divorced</Option>
                          <Option value="widowed">Widowed</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="address" label="Address">
                    <Input />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="city" label="City">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="state" label="State">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="zipCode" label="ZIP Code">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="country" label="Country">
                        <Select>
                          <Option value="United States">United States</Option>
                          <Option value="Canada">Canada</Option>
                          <Option value="United Kingdom">United Kingdom</Option>
                          <Option value="Australia">Australia</Option>
                          <Option value="Germany">Germany</Option>
                          <Option value="France">France</Option>
                          <Option value="India">India</Option>
                          <Option value="China">China</Option>
                          <Option value="Japan">Japan</Option>
                          <Option value="Brazil">Brazil</Option>
                          <Option value="Mexico">Mexico</Option>
                          <Option value="Spain">Spain</Option>
                          <Option value="Italy">Italy</Option>
                          <Option value="Netherlands">Netherlands</Option>
                          <Option value="Singapore">Singapore</Option>
                          <Option value="Other">Other</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </Col>

            {/* Professional Information */}
            <Col xs={24} lg={12}>
              <Card
                title="Professional Information"
                extra={
                  <Button
                    type="text"
                    icon={isEditingProfessional ? <SaveOutlined /> : <EditOutlined />}
                    onClick={() => {
                      if (isEditingProfessional) {
                        professionalForm.submit()
                      } else {
                        setIsEditingProfessional(true)
                        professionalForm.setFieldsValue(profileData?.user)
                      }
                    }}
                    loading={updateProfessionalInfoMutation.isPending}
                  >
                    {isEditingProfessional ? 'Save' : 'Edit'}
                  </Button>
                }
              >
                <Form
                  form={professionalForm}
                  layout="vertical"
                  onFinish={handleProfessionalInfoSubmit}
                  disabled={!isEditingProfessional}
                  initialValues={profileData?.user}
                >
                  <Form.Item name="employeeCode" label="Employee ID">
                    <Input disabled />
                  </Form.Item>

                  <Form.Item name="department" label="Department">
                    <Select>
                      <Option value="Engineering">Engineering</Option>
                      <Option value="Marketing">Marketing</Option>
                      <Option value="Sales">Sales</Option>
                      <Option value="HR">Human Resources</Option>
                      <Option value="Finance">Finance</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="jobTitle" label="Position">
                    <Input />
                  </Form.Item>

                  <Form.Item name="baseSalary" label="Base Salary">
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Form>
              </Card>
            </Col>
          </Row>

          {/* Additional Information Section */}
          <Card title="Account Information">
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={12} md={8}>
                <div>
                  <Text className="text-gray-500">Username</Text>
                  <p className="font-medium">{profileData?.user.username}</p>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div>
                  <Text className="text-gray-500">Role</Text>
                  <p className="font-medium capitalize">{profileData?.user.role?.replace('ROLE_', '').toLowerCase()}</p>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div>
                  <Text className="text-gray-500">Account Status</Text>
                  <p className="font-medium">
                    <Tag color={profileData?.user.active ? 'green' : 'red'}>
                      {profileData?.user.active ? 'Active' : 'Inactive'}
                    </Tag>
                  </p>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div>
                  <Text className="text-gray-500">Member Since</Text>
                  <p className="font-medium">{formatDate(profileData?.user.createdAt)}</p>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div>
                  <Text className="text-gray-500">Last Updated</Text>
                  <p className="font-medium">{formatDate(profileData?.user.updatedAt)}</p>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Placeholder for future features */}
          {/*
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title="Skills">
                <div className="space-y-3">
                  <Text className="text-gray-500">Skills management coming soon...</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Certifications">
                <div className="space-y-3">
                  <Text className="text-gray-500">Certifications management coming soon...</Text>
                </div>
              </Card>
            </Col>
          </Row>

          <Card title="Documents">
            <div className="space-y-3">
              <Text className="text-gray-500">Document management coming soon...</Text>
            </div>
          </Card>
          */}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}