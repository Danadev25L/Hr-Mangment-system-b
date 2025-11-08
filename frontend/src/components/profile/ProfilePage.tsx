'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { EnhancedCard } from '@/components/ui/EnhancedCard';
import { AvatarWithInitials } from '@/components/ui/AvatarWithInitials';
import apiClient from '@/lib/api';

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
  CrownOutlined,
  TeamOutlined,
  SafetyOutlined,
} from '@ant-design/icons';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import React, { useState } from 'react';

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
  Badge,
} from 'antd';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

// Role-specific color themes with light/dark mode support
const ROLE_THEMES = {
  ROLE_EMPLOYEE: {
    gradient: 'from-green-500 to-emerald-600',
    darkGradient: 'dark:from-green-600 dark:to-emerald-700',
    bgGradient: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-500 dark:border-green-400',
    textColor: 'text-green-600 dark:text-green-400',
    iconColor: 'text-green-500 dark:text-green-400',
    hoverBg: 'hover:bg-green-50 dark:hover:bg-green-900/30',
    primary: 'green',
    secondary: 'emerald',
    tagColor: 'success',
    icon: <TeamOutlined />,
    roleLabel: 'roleEmployee',
  },
  ROLE_MANAGER: {
    gradient: 'from-blue-500 to-cyan-600',
    darkGradient: 'dark:from-blue-600 dark:to-cyan-700',
    bgGradient: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-500 dark:border-blue-400',
    textColor: 'text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-500 dark:text-blue-400',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
    primary: 'blue',
    secondary: 'cyan',
    tagColor: 'processing',
    icon: <SafetyOutlined />,
    roleLabel: 'roleManager',
  },
  ROLE_ADMIN: {
    gradient: 'from-purple-500 to-pink-600',
    darkGradient: 'dark:from-purple-600 dark:to-pink-700',
    bgGradient: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-500 dark:border-purple-400',
    textColor: 'text-purple-600 dark:text-purple-400',
    iconColor: 'text-purple-500 dark:text-purple-400',
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-900/30',
    primary: 'purple',
    secondary: 'magenta',
    tagColor: 'magenta',
    icon: <CrownOutlined />,
    roleLabel: 'roleAdministrator',
  },
};

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

  // Get role-specific theme
  const theme = ROLE_THEMES[role] || ROLE_THEMES.ROLE_EMPLOYEE;

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
      message.success(t('profile.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditMode(false);
    },
    onError: () => {
      message.error(t('profile.updateError'));
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      // Call actual backend API for password change
      return await apiClient.changePassword({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
    },
    onSuccess: () => {
      message.success(t('profile.passwordChangeSuccess'));
      setPasswordModal(false);
      passwordForm.resetFields();
    },
    onError: (error: any) => {
      // Backend returns detailed error messages
      console.error('Password change error:', error);
      const errorMessage = error.message || error.response?.data?.message || t('profile.passwordChangeError');
      message.error(errorMessage);
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
      {/* Header with Role-Specific Gradient - Light/Dark Mode */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${theme.gradient} ${theme.darkGradient} p-8 shadow-xl`}>
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-xl">
                {theme.icon && React.cloneElement(theme.icon as React.ReactElement, { 
                  className: "text-4xl text-white drop-shadow-lg" 
                })}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-1">{t('profile.title')}</h1>
                <p className="text-white/90 dark:text-white/80 text-lg drop-shadow">
                  {t('profile.subtitle')}
                </p>
                <Badge 
                  count={t(`profile.${theme.roleLabel}`)} 
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.25)', 
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    padding: '0 12px',
                    height: '24px',
                    lineHeight: '24px',
                    marginTop: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column - Profile Card with Role Color - Light/Dark Mode */}
        <Col xs={24} lg={8}>
          <EnhancedCard
            title={
              <div className="flex items-center space-x-2">
                <span className={theme.iconColor}>{theme.icon}</span>
                <span>{t('profile.profileOverview')}</span>
              </div>
            }
            className={`h-full border-t-4 ${theme.borderColor}`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Role-colored Avatar with Dark Mode Support */}
              <div className={`p-1 rounded-full bg-gradient-to-br ${theme.gradient} ${theme.darkGradient} shadow-lg`}>
                <AvatarWithInitials
                  name={profile?.fullName || 'User'}
                  size="xl"
                  variant="gradient"
                  className="!w-32 !h-32 !text-3xl shadow-xl border-4 border-white dark:border-gray-800"
                />
              </div>
              <div>
                <Title level={4} className="mb-1 dark:text-white">
                  {profile?.fullName}
                </Title>
                <Text type="secondary" className="block dark:text-gray-400">
                  @{profile?.username}
                </Text>
                <Space className="mt-2">
                  <Tag color={theme.tagColor}>{profile?.employeeCode}</Tag>
                  <Tag color={theme.primary} icon={theme.icon}>
                    {t(`profile.${theme.roleLabel}`)}
                  </Tag>
                </Space>
              </div>

              <Divider className="my-4 dark:border-gray-700" />

              <div className="w-full space-y-3 text-left">
                <div className={`flex items-center space-x-3 p-2 rounded-lg ${theme.bgGradient} transition-colors ${theme.hoverBg}`}>
                  <MailOutlined className={theme.iconColor} />
                  <Text className="dark:text-gray-300">{profile?.email}</Text>
                </div>
                {profile?.phone && (
                  <div className={`flex items-center space-x-3 p-2 rounded-lg ${theme.bgGradient} transition-colors ${theme.hoverBg}`}>
                    <PhoneOutlined className={theme.iconColor} />
                    <Text className="dark:text-gray-300">{profile.phone}</Text>
                  </div>
                )}
                {profile?.department && (
                  <div className={`flex items-center space-x-3 p-2 rounded-lg ${theme.bgGradient} transition-colors ${theme.hoverBg}`}>
                    <IdcardOutlined className={theme.iconColor} />
                    <Text className="dark:text-gray-300">{typeof profile.department === 'string' ? profile.department : (profile.department as any).departmentName || 'N/A'}</Text>
                  </div>
                )}
                {profile?.dateOfJoining && (
                  <div className={`flex items-center space-x-3 p-2 rounded-lg ${theme.bgGradient} transition-colors ${theme.hoverBg}`}>
                    <CalendarOutlined className={theme.iconColor} />
                    <Text className="dark:text-gray-300">{t('profile.joined')} {dayjs(profile.dateOfJoining).format('MMM DD, YYYY')}</Text>
                  </div>
                )}
              </div>

              <Button
                type="primary"
                icon={<LockOutlined />}
                onClick={() => setPasswordModal(true)}
                block
                size="large"
                className={`mt-4 bg-gradient-to-r ${theme.gradient} ${theme.darkGradient} border-0 hover:opacity-90 shadow-lg`}
              >
                {t('profile.changePassword')}
              </Button>
            </div>
          </EnhancedCard>
        </Col>

        {/* Right Column - Details & Salary */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" className="w-full">
            {/* Personal Information Card with Role Color - Light/Dark Mode */}
            <EnhancedCard
              title={
                <div className="flex items-center space-x-2">
                  <UserOutlined className={theme.iconColor} />
                  <span>{t('profile.personalInformation')}</span>
                </div>
              }
              extra={
                <Button
                  icon={editMode ? <SaveOutlined /> : <EditOutlined />}
                  onClick={editMode ? form.submit : handleEditToggle}
                  type={editMode ? 'primary' : 'default'}
                  loading={updateProfileMutation.isPending}
                  className={editMode ? `bg-gradient-to-r ${theme.gradient} ${theme.darkGradient} border-0` : ''}
                >
                  {editMode ? t('profile.saveChanges') : t('profile.editProfile')}
                </Button>
              }
              className={`border-l-4 ${theme.borderColor}`}
            >
              {!editMode ? (
                <Descriptions column={2} bordered>
                  <Descriptions.Item label={t('profile.fullName')} span={2}>
                    <Text strong>{profile?.fullName}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profile.username')} span={1}>
                    <Text strong>@{profile?.username}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profile.employeeCode')} span={1}>
                    <Tag color={theme.tagColor}>{profile?.employeeCode}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profile.role')} span={2}>
                    <Tag color={theme.primary} icon={theme.icon}>
                      {t(`profile.${theme.roleLabel}`)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profile.email')} span={2}>
                    <Space>
                      <MailOutlined />
                      {profile?.email}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profile.phone')} span={2}>
                    <Space>
                      <PhoneOutlined />
                      {profile?.phone || <Text type="secondary">{t('profile.notProvided')}</Text>}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profile.address')} span={2}>
                    <Space>
                      <HomeOutlined />
                      {profile?.address || <Text type="secondary">{t('profile.notProvided')}</Text>}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profile.department')} span={2}>
                    {profile?.department 
                      ? (typeof profile.department === 'string' 
                          ? profile.department 
                          : (profile.department as any).departmentName || 'N/A')
                      : <Text type="secondary">{t('profile.notAssigned')}</Text>}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profile.position')} span={2}>
                    {profile?.position || <Text type="secondary">{t('profile.notSpecified')}</Text>}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profile.memberSince')} span={2}>
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
                        label={t('profile.fullName')}
                        rules={[{ required: true, message: t('profile.enterFullName') }]}
                      >
                        <Input prefix={<UserOutlined />} placeholder={t('profile.fullNamePlaceholder')} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="username"
                        label={t('profile.username')}
                        rules={[{ required: true, message: t('profile.enterUsername') }]}
                      >
                        <Input prefix={<UserOutlined />} placeholder="johndoe" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="phone" label={t('profile.phoneNumber')}>
                        <Input prefix={<PhoneOutlined />} placeholder="+1234567890" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="address" label={t('profile.address')}>
                        <Input prefix={<HomeOutlined />} placeholder="123 Main St, City" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Space>
                    <Button onClick={handleEditToggle}>{t('profile.cancel')}</Button>
                  </Space>
                </Form>
              )}
            </EnhancedCard>

            {/* Salary Information Card - Light/Dark Mode (Always Green for Money) */}
            {profile?.salary && (
              <EnhancedCard
                title={
                  <div className="flex items-center space-x-2">
                    <DollarOutlined className="text-green-500 dark:text-green-400" />
                    <span>{t('profile.salaryInformation')}</span>
                  </div>
                }
                className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400"
              >
                <Alert
                  message={t('profile.salaryInfoReadonly')}
                  type="info"
                  showIcon
                  className="mb-4"
                />
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label={t('profile.baseSalary')} span={2}>
                    <div className="flex flex-col">
                      <Text strong className="text-3xl text-green-600 dark:text-green-400">
                        {profile.salary.currency} {profile.salary.baseSalary.toLocaleString()}
                      </Text>
                      <Text type="secondary" className="text-xs mt-1">{t('profile.perMonth')}</Text>
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profile.currency')} span={1}>
                    <Tag color="green" className="text-sm">{profile.salary.currency}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profile.status')} span={1}>
                    <Tag color="success" icon={<CheckCircleOutlined />}>{t('profile.active')}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profile.lastUpdated')} span={2}>
                    <Space direction="vertical" size="small">
                      <Space>
                        <CalendarOutlined className="text-blue-500 dark:text-blue-400" />
                        <Text strong className="dark:text-gray-300">{dayjs(profile.salary.lastUpdated).format('MMMM DD, YYYY [at] HH:mm')}</Text>
                      </Space>
                      <Text type="secondary" className="text-xs dark:text-gray-500">
                        {dayjs(profile.salary.lastUpdated).fromNow()}
                      </Text>
                    </Space>
                  </Descriptions.Item>
                  {profile.salary.updatedBy && (
                    <Descriptions.Item label={t('profile.updatedBy')} span={2}>
                      <Space>
                        <UserOutlined className="text-purple-500 dark:text-purple-400" />
                        <Text className="dark:text-gray-300">{profile.salary.updatedBy}</Text>
                      </Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </EnhancedCard>
            )}

            {/* Account Activity Card with Role Color - Light/Dark Mode */}
            <EnhancedCard
              title={
                <div className="flex items-center space-x-2">
                  <ClockCircleOutlined className={theme.iconColor} />
                  <span>{t('profile.accountActivity')}</span>
                </div>
              }
              className={`border-l-4 ${theme.borderColor}`}
            >
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label={t('profile.accountCreated')} span={2}>
                  <Space direction="vertical" size="small">
                    <Space>
                      <CalendarOutlined className={theme.iconColor} />
                      <Text strong className="dark:text-gray-300">{dayjs(profile?.createdAt).format('MMMM DD, YYYY [at] HH:mm')}</Text>
                    </Space>
                    <Text type="secondary" className="text-xs dark:text-gray-500">
                      {dayjs(profile?.createdAt).fromNow()}
                    </Text>
                  </Space>
                </Descriptions.Item>
                {profile?.createdBy && (
                  <Descriptions.Item label={t('profile.createdBy')} span={2}>
                    <Space>
                      <UserOutlined className={theme.iconColor} />
                      <Text className="dark:text-gray-300">{profile.createdBy}</Text>
                    </Space>
                  </Descriptions.Item>
                )}
                {profile?.updatedAt && (
                  <Descriptions.Item label={t('profile.lastProfileUpdate')} span={2}>
                    <Space direction="vertical" size="small">
                      <Space>
                        <ClockCircleOutlined className="text-orange-500 dark:text-orange-400" />
                        <Text strong className="dark:text-gray-300">{dayjs(profile.updatedAt).format('MMMM DD, YYYY [at] HH:mm')}</Text>
                      </Space>
                      <Text type="secondary" className="text-xs dark:text-gray-500">
                        {dayjs(profile.updatedAt).fromNow()}
                      </Text>
                    </Space>
                  </Descriptions.Item>
                )}
                {profile?.updatedBy && (
                  <Descriptions.Item label={t('profile.lastUpdatedBy')} span={2}>
                    <Space>
                      <UserOutlined className={theme.iconColor} />
                      <Text className="dark:text-gray-300">{profile.updatedBy}</Text>
                    </Space>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label={t('profile.accountStatus')} span={2}>
                  <Tag 
                    color={profile?.active ? 'success' : 'error'} 
                    icon={<CheckCircleOutlined />}
                    className="text-sm"
                  >
                    {profile?.active ? t('profile.active') : t('profile.inactive')}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </EnhancedCard>
          </Space>
        </Col>
      </Row>

      {/* Change Password Modal with Role Color - Light/Dark Mode */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <LockOutlined className={theme.iconColor} />
            <span>{t('profile.changePassword')}</span>
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
            message={t('profile.passwordRequirements')}
            description={
              <ul className="list-disc list-inside text-sm mt-2">
                <li>{t('profile.requirement1')}</li>
                <li>{t('profile.requirement2')}</li>
                <li>{t('profile.requirement3')}</li>
                <li>{t('profile.requirement4')}</li>
              </ul>
            }
            type="info"
            showIcon
            className={`mb-4 border-l-4 ${theme.borderColor}`}
          />

          <Form.Item
            name="currentPassword"
            label={t('profile.currentPassword')}
            rules={[{ required: true, message: t('profile.enterCurrentPassword') }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('profile.currentPasswordPlaceholder')}
              iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label={t('profile.newPassword')}
            rules={[
              { required: true, message: t('profile.enterNewPassword') },
              { min: 8, message: t('profile.passwordMinLengthError') },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('profile.newPasswordPlaceholder')}
              iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={t('profile.confirmNewPassword')}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('profile.enterConfirmPassword') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('profile.passwordsDoNotMatch')));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('profile.confirmPasswordPlaceholder')}
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
              {t('profile.cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<LockOutlined />}
              loading={changePasswordMutation.isPending}
              className={`bg-gradient-to-r ${theme.gradient} ${theme.darkGradient} border-0 shadow-lg`}
            >
              {t('profile.changePassword')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
