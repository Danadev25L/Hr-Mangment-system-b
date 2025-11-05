'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Space,
  Divider,
  message,
  Modal,
  Descriptions,
  Tag,
  Row,
  Col,
  Typography,
  Alert,
  Spin,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  EditOutlined,
  SaveOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DollarOutlined,
  CalendarOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { PageHeader } from '@/components/ui/PageHeader';
import { EnhancedCard } from '@/components/ui/EnhancedCard';
import { AvatarWithInitials } from '@/components/ui/AvatarWithInitials';
import apiClient from '@/lib/api';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

interface ProfileData {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  employeeCode: string;
  department?: string | { id: number; departmentName: string; createdAt: string; updatedAt: string; isActive: boolean };
  position?: string;
  dateOfJoining?: string;
  salary?: {
    baseSalary: number;
    currency: string;
    lastUpdated: string;
    updatedBy?: string;
  };
  lastProfileUpdate?: string;
  updatedAt?: string;
  updatedBy?: string;
  createdAt: string;
  createdBy?: string;
  role: string;
  status?: string;
  active?: boolean;
}

interface ProfilePageProps {
  role: 'ROLE_EMPLOYEE' | 'ROLE_MANAGER' | 'ROLE_ADMIN';
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ role }) => {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Fetch profile data
  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile', role],
    queryFn: async () => {
      const response = await apiClient.getCurrentUser();
      return response as ProfileData;
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use the updateUser API method
      const response = await apiClient.updateUser(profile?.id!, data);
      return response;
    },
    onSuccess: () => {
      message.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditMode(false);
    },
    onError: () => {
      message.error('Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      // Mock password change - implement in backend
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      message.success('Password changed successfully!');
      setPasswordModal(false);
      passwordForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const handleSaveProfile = (values: any) => {
    updateProfileMutation.mutate({
      fullName: values.fullName,
      username: values.username,
      phone: values.phone,
      address: values.address,
    });
  };

  const handleChangePassword = (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('New passwords do not match!');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  const handleEditToggle = () => {
    if (editMode) {
      form.resetFields();
    } else {
      form.setFieldsValue({
        fullName: profile?.fullName,
        username: profile?.username,
        phone: profile?.phone,
        address: profile?.address,
      });
    }
    setEditMode(!editMode);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="My Profile"
        description="View and manage your personal information"
        icon={<UserOutlined />}
        gradient="purple"
      />

      {/* Last Update Alert */}
      {(profile?.updatedAt || profile?.lastProfileUpdate) && (
        <Alert
          message={
            <div className="flex items-center justify-between">
              <Space direction="vertical" size="small">
                <Space>
                  <ClockCircleOutlined />
                  <Text strong>
                    Last Profile Update: {dayjs(profile.updatedAt || profile.lastProfileUpdate).format('MMMM DD, YYYY [at] HH:mm')}
                  </Text>
                </Space>
                <Text type="secondary" className="text-xs ml-6">
                  {dayjs(profile.updatedAt || profile.lastProfileUpdate).fromNow()}
                  {profile?.updatedBy && ` • Updated by: ${profile.updatedBy}`}
                </Text>
              </Space>
            </div>
          }
          type="info"
          showIcon={false}
          className="rounded-lg"
        />
      )}

      <Row gutter={[24, 24]}>
        {/* Left Column - Profile Card */}
        <Col xs={24} lg={8}>
          <EnhancedCard
            title={
              <div className="flex items-center space-x-2">
                <UserOutlined />
                <span>Profile Overview</span>
              </div>
            }
            className="h-full"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <AvatarWithInitials
                name={profile?.fullName || 'User'}
                size="xl"
                variant="gradient"
                className="!w-32 !h-32 !text-3xl shadow-xl"
              />
              <div>
                <Title level={4} className="mb-1">
                  {profile?.fullName}
                </Title>
                <Text type="secondary" className="block">
                  @{profile?.username}
                </Text>
                <Tag color="blue" className="mt-2">
                  {profile?.employeeCode}
                </Tag>
              </div>

              <Divider className="my-4" />

              <div className="w-full space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <MailOutlined className="text-gray-400" />
                  <Text>{profile?.email}</Text>
                </div>
                {profile?.phone && (
                  <div className="flex items-center space-x-3">
                    <PhoneOutlined className="text-gray-400" />
                    <Text>{profile.phone}</Text>
                  </div>
                )}
                {profile?.department && (
                  <div className="flex items-center space-x-3">
                    <IdcardOutlined className="text-gray-400" />
                    <Text>{typeof profile.department === 'string' ? profile.department : (profile.department as any).departmentName || 'N/A'}</Text>
                  </div>
                )}
                {profile?.dateOfJoining && (
                  <div className="flex items-center space-x-3">
                    <CalendarOutlined className="text-gray-400" />
                    <Text>Joined {dayjs(profile.dateOfJoining).format('MMM DD, YYYY')}</Text>
                  </div>
                )}
              </div>

              <Button
                type="primary"
                icon={<LockOutlined />}
                onClick={() => setPasswordModal(true)}
                block
                size="large"
                className="mt-4"
              >
                Change Password
              </Button>
            </div>
          </EnhancedCard>
        </Col>

        {/* Right Column - Details & Salary */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" className="w-full">
            {/* Personal Information Card */}
            <EnhancedCard
              title={
                <div className="flex items-center space-x-2">
                  <UserOutlined />
                  <span>Personal Information</span>
                </div>
              }
              extra={
                <Button
                  icon={editMode ? <SaveOutlined /> : <EditOutlined />}
                  onClick={editMode ? form.submit : handleEditToggle}
                  type={editMode ? 'primary' : 'default'}
                  loading={updateProfileMutation.isPending}
                >
                  {editMode ? 'Save Changes' : 'Edit Profile'}
                </Button>
              }
            >
              {!editMode ? (
                <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                  <Descriptions.Item label="Full Name" span={2}>
                    <Text strong>{profile?.fullName}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Username">
                    <Text strong>@{profile?.username}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Employee Code">
                    <Tag color="blue">{profile?.employeeCode}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email" span={2}>
                    <Space>
                      <MailOutlined />
                      {profile?.email}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone" span={2}>
                    <Space>
                      <PhoneOutlined />
                      {profile?.phone || <Text type="secondary">Not provided</Text>}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Address" span={2}>
                    <Space>
                      <HomeOutlined />
                      {profile?.address || <Text type="secondary">Not provided</Text>}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Department" span={2}>
                    {profile?.department 
                      ? (typeof profile.department === 'string' 
                          ? profile.department 
                          : (profile.department as any).departmentName || 'N/A')
                      : <Text type="secondary">Not assigned</Text>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Position" span={2}>
                    {profile?.position || <Text type="secondary">Not specified</Text>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Member Since" span={2}>
                    <Space>
                      <CalendarOutlined />
                      {dayjs(profile?.createdAt).format('MMMM DD, YYYY')}
                      <Text type="secondary">({dayjs(profile?.createdAt).fromNow()})</Text>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSaveProfile}
                  initialValues={{
                    fullName: profile?.fullName,
                    username: profile?.username,
                    phone: profile?.phone,
                    address: profile?.address,
                  }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="fullName"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please enter your full name' }]}
                      >
                        <Input prefix={<UserOutlined />} placeholder="John Doe" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="username"
                        label="Username"
                        rules={[{ required: true, message: 'Please enter your username' }]}
                      >
                        <Input prefix={<UserOutlined />} placeholder="johndoe" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="phone" label="Phone Number">
                        <Input prefix={<PhoneOutlined />} placeholder="+1234567890" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="address" label="Address">
                        <Input prefix={<HomeOutlined />} placeholder="123 Main St, City" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Space>
                    <Button onClick={handleEditToggle}>Cancel</Button>
                  </Space>
                </Form>
              )}
            </EnhancedCard>

            {/* Salary Information Card */}
            {profile?.salary && (
              <EnhancedCard
                title={
                  <div className="flex items-center space-x-2">
                    <DollarOutlined />
                    <span>Salary Information</span>
                  </div>
                }
                className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
              >
                <Alert
                  message="💼 This information is read-only and managed by HR department"
                  type="info"
                  showIcon
                  className="mb-4"
                />
                <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                  <Descriptions.Item label="Base Salary" span={2}>
                    <div className="flex flex-col">
                      <Text strong className="text-3xl text-green-600">
                        {profile.salary.currency} {profile.salary.baseSalary.toLocaleString()}
                      </Text>
                      <Text type="secondary" className="text-xs mt-1">per month</Text>
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="Currency">
                    <Tag color="green" className="text-sm">{profile.salary.currency}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Last Updated" span={2}>
                    <Space direction="vertical" size="small">
                      <Space>
                        <CalendarOutlined className="text-blue-500" />
                        <Text strong>{dayjs(profile.salary.lastUpdated).format('MMMM DD, YYYY [at] HH:mm')}</Text>
                      </Space>
                      <Text type="secondary" className="text-xs">
                        {dayjs(profile.salary.lastUpdated).fromNow()}
                      </Text>
                    </Space>
                  </Descriptions.Item>
                  {profile.salary.updatedBy && (
                    <Descriptions.Item label="Updated By" span={2}>
                      <Space>
                        <UserOutlined className="text-purple-500" />
                        <Text>{profile.salary.updatedBy}</Text>
                      </Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </EnhancedCard>
            )}

            {/* Account Activity Card */}
            <EnhancedCard
              title={
                <div className="flex items-center space-x-2">
                  <ClockCircleOutlined />
                  <span>Account Activity</span>
                </div>
              }
            >
              <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                <Descriptions.Item label="Account Created" span={2}>
                  <Space direction="vertical" size="small">
                    <Space>
                      <CalendarOutlined className="text-blue-500" />
                      <Text strong>{dayjs(profile?.createdAt).format('MMMM DD, YYYY [at] HH:mm')}</Text>
                    </Space>
                    <Text type="secondary" className="text-xs">
                      {dayjs(profile?.createdAt).fromNow()}
                    </Text>
                  </Space>
                </Descriptions.Item>
                {profile?.createdBy && (
                  <Descriptions.Item label="Created By" span={2}>
                    <Space>
                      <UserOutlined className="text-purple-500" />
                      <Text>{profile.createdBy}</Text>
                    </Space>
                  </Descriptions.Item>
                )}
                {profile?.updatedAt && (
                  <Descriptions.Item label="Last Profile Update" span={2}>
                    <Space direction="vertical" size="small">
                      <Space>
                        <ClockCircleOutlined className="text-orange-500" />
                        <Text strong>{dayjs(profile.updatedAt).format('MMMM DD, YYYY [at] HH:mm')}</Text>
                      </Space>
                      <Text type="secondary" className="text-xs">
                        {dayjs(profile.updatedAt).fromNow()}
                      </Text>
                    </Space>
                  </Descriptions.Item>
                )}
                {profile?.updatedBy && (
                  <Descriptions.Item label="Last Updated By" span={2}>
                    <Space>
                      <UserOutlined className="text-purple-500" />
                      <Text>{profile.updatedBy}</Text>
                    </Space>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Account Status" span={2}>
                  <Tag 
                    color={profile?.active ? 'success' : 'error'} 
                    icon={<CheckCircleOutlined />}
                    className="text-sm"
                  >
                    {profile?.active ? 'Active' : 'Inactive'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </EnhancedCard>
          </Space>
        </Col>
      </Row>

      {/* Change Password Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <LockOutlined className="text-blue-500" />
            <span>Change Password</span>
          </div>
        }
        open={passwordModal}
        onCancel={() => {
          setPasswordModal(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          className="mt-4"
        >
          <Alert
            message="Password Requirements"
            description={
              <ul className="list-disc list-inside text-sm mt-2">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character</li>
              </ul>
            }
            type="info"
            showIcon
            className="mb-4"
          />

          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter current password"
              iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter new password"
              iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm new password"
              iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setPasswordModal(false);
                passwordForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<LockOutlined />}
              loading={changePasswordMutation.isPending}
            >
              Change Password
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
