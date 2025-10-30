'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  Descriptions, 
  Tag, 
  Button, 
  Spin, 
  message, 
  Avatar,
  Row,
  Col,
  Statistic,
  Timeline,
  Badge,
  Space
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  MailOutlined,
  HomeOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

interface PersonalInformation {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  country: string;
  dateOfBirth: string | null;
  gender: string;
  maritalStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: number;
  departmentName: string;
  isActive: boolean;
}

interface Job {
  id: number;
  jobTitle: string;
  startDate: string;
  endDate: string | null;
  userId: number;
  description: string;
  requirements: string;
  location: string;
  employmentType: string;
  isActive: boolean;
  salary: number;
  createdAt: string;
  updatedAt: string;
}

interface Employee {
  id: number;
  username: string;
  employeeCode: string;
  fullName: string;
  jobTitle: string;
  role: string;
  active: boolean;
  departmentId: number | null;
  baseSalary: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: number | null;
  personalInformation: PersonalInformation | null;
  department: Department | null;
  jobs: Job[];
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [updaterName, setUpdaterName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/admin/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch employee details');
        }

        const result = await response.json();
        setEmployee(result.data);
        
        // Fetch updater's name if exists
        if (result.data.updatedBy) {
          const updaterResponse = await fetch(`/api/admin/users/${result.data.updatedBy}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (updaterResponse.ok) {
            const updaterData = await updaterResponse.json();
            setUpdaterName(updaterData.data.fullName);
          }
        }
      } catch (error) {
        console.error('Error fetching employee details:', error);
        message.error('Failed to load employee details');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDetails();
  }, [id]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN': return 'red';
      case 'ROLE_MANAGER': return 'blue';
      case 'ROLE_EMPLOYEE': return 'green';
      default: return 'default';
    }
  };

  const getStatusColor = (active: boolean) => {
    return active ? 'success' : 'error';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <InfoCircleOutlined className="text-6xl text-gray-400 mb-4" />
            <h3 className="text-xl text-gray-600">Employee not found</h3>
            <Button 
              type="primary" 
              onClick={() => router.push('/admin/users')}
              className="mt-4"
            >
              Back to Users
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const personalInfo = employee.personalInformation;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/admin/users')}
          className="mb-4"
        >
          Back to Users
        </Button>
        
        <Card className="shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Avatar 
                size={100} 
                icon={<UserOutlined />}
                className="bg-linear-to-br from-blue-500 to-purple-500"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {personalInfo?.firstName && personalInfo?.lastName 
                    ? `${personalInfo.firstName} ${personalInfo.lastName}`
                    : employee.fullName}
                </h1>
                <Space size="middle">
                  <Tag color={getRoleColor(employee.role)} className="text-sm px-3 py-1">
                    {employee.role.replace('ROLE_', '')}
                  </Tag>
                  <Tag 
                    color={getStatusColor(employee.active)} 
                    icon={employee.active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    className="text-sm px-3 py-1"
                  >
                    {employee.active ? 'Active' : 'Inactive'}
                  </Tag>
                  {employee.jobTitle && (
                    <Tag color="blue" icon={<TrophyOutlined />} className="text-sm px-3 py-1">
                      {employee.jobTitle}
                    </Tag>
                  )}
                </Space>
              </div>
            </div>
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              size="large"
              onClick={() => router.push(`/admin/users/edit/${id}`)}
            >
              Edit Employee
            </Button>
          </div>
        </Card>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow">
            <Statistic
              title="Base Salary"
              value={employee.baseSalary}
              prefix={<DollarOutlined />}
              suffix="/ month"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow">
            <Statistic
              title="Department"
              value={employee.department?.departmentName || 'Not Assigned'}
              prefix={<TeamOutlined />}
              valueStyle={{ fontSize: '18px', color: employee.department ? '#1890ff' : '#999' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow">
            <Statistic
              title="Total Jobs"
              value={employee.jobs?.length || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow">
            <Statistic
              title="Account Age"
              value={dayjs().diff(dayjs(employee.createdAt), 'days')}
              suffix="days"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          {/* Basic Information */}
          <Card title="Basic Information" className="shadow mb-6">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Employee Code">
                <Tag color="blue" className="text-base font-mono">
                  {employee.employeeCode}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Username">
                <strong>{employee.username}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Full Name">
                {employee.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="User ID">
                #{employee.id}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color={getRoleColor(employee.role)}>
                  {employee.role.replace('ROLE_', '')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge 
                  status={employee.active ? 'success' : 'error'} 
                  text={employee.active ? 'Active' : 'Inactive'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Account Created">
                {dayjs(employee.createdAt).format('MMMM D, YYYY h:mm A')}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {dayjs(employee.updatedAt).format('MMMM D, YYYY h:mm A')}
              </Descriptions.Item>
              {employee.updatedBy && (
                <Descriptions.Item label="Last Updated By">
                  <Space>
                    <UserOutlined />
                    <strong>{updaterName || `User #${employee.updatedBy}`}</strong>
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Personal Information */}
          <Card 
            title={
              <Space>
                <UserOutlined />
                Personal Information
              </Space>
            } 
            className="shadow mb-6"
          >
            {personalInfo ? (
              <Descriptions column={1} bordered>
                <Descriptions.Item label="First Name">
                  {personalInfo.firstName || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Last Name">
                  {personalInfo.lastName || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <Space>
                      <MailOutlined />
                      Email
                    </Space>
                  }
                >
                  {personalInfo.email || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Gender">
                  {personalInfo.gender || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Marital Status">
                  {personalInfo.maritalStatus || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <Space>
                      <CalendarOutlined />
                      Date of Birth
                    </Space>
                  }
                >
                  {personalInfo.dateOfBirth 
                    ? dayjs(personalInfo.dateOfBirth).format('MMMM D, YYYY')
                    : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={
                    <Space>
                      <HomeOutlined />
                      Address
                    </Space>
                  }
                >
                  {personalInfo.address || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="City">
                  {personalInfo.city || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Country">
                  {personalInfo.country || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <InfoCircleOutlined className="text-4xl mb-2" />
                <p>No personal information available</p>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          {/* Work Information */}
          <Card 
            title={
              <Space>
                <TeamOutlined />
                Work Information
              </Space>
            }
            className="shadow mb-6"
          >
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Job Title">
                {employee.jobTitle || <span className="text-gray-400">Not Assigned</span>}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {employee.department ? (
                  <Space>
                    <Tag color="blue">{employee.department.departmentName}</Tag>
                    <Badge 
                      status={employee.department.isActive ? 'success' : 'error'} 
                      text={employee.department.isActive ? 'Active' : 'Inactive'}
                    />
                  </Space>
                ) : (
                  <span className="text-gray-400">Not Assigned</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item 
                label={
                  <Space>
                    <DollarOutlined />
                    Base Salary
                  </Space>
                }
              >
                <span className="text-lg font-semibold text-green-600">
                  ${employee.baseSalary.toLocaleString()} / month
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Job History */}
          <Card 
            title={
              <Space>
                <TrophyOutlined />
                Job History ({employee.jobs?.length || 0})
              </Space>
            }
            className="shadow"
          >
            {employee.jobs && employee.jobs.length > 0 ? (
              <Timeline
                items={employee.jobs.map((job) => ({
                  color: job.isActive ? 'green' : 'gray',
                  children: (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <strong className="text-base">{job.jobTitle}</strong>
                        {job.isActive && (
                          <Badge status="success" text="Active" />
                        )}
                      </div>
                      <div className="text-gray-600 mb-1">
                        <strong>Location:</strong> {job.location}
                      </div>
                      <div className="text-gray-600 mb-1">
                        <strong>Type:</strong> {job.employmentType}
                      </div>
                      {job.salary && (
                        <div className="text-gray-600 mb-1">
                          <strong>Salary:</strong> ${job.salary.toLocaleString()}
                        </div>
                      )}
                      <div className="text-gray-500 text-sm mt-2">
                        {dayjs(job.startDate).format('MMM YYYY')} - 
                        {job.endDate 
                          ? ` ${dayjs(job.endDate).format('MMM YYYY')}`
                          : ' Present'}
                      </div>
                      {job.description && (
                        <div className="mt-2 text-gray-600 text-sm">
                          {job.description}
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrophyOutlined className="text-4xl mb-2" />
                <p>No job history available</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
