'use client';

import React from 'react';
import { Descriptions, Tag, Space, Typography } from 'antd';
import {
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { EnhancedCard } from '@/components/ui/EnhancedCard';
import { RoleTheme } from '../utils/roleThemes';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface AccountActivityProps {
  profile: any;
  theme: RoleTheme;
}

export const AccountActivity: React.FC<AccountActivityProps> = ({ profile, theme }) => {
  const t = useTranslations('profile');

  return (
    <EnhancedCard
      title={
        <div className="flex items-center gap-2 rtl:gap-2">
          <ClockCircleOutlined className={theme.iconColor} />
          <span>{t('accountActivity')}</span>
        </div>
      }
      className={`ltr:border-l-4 rtl:border-r-4 ${theme.borderColor}`}
    >
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label={t('accountCreated')} span={2}>
          <Space direction="vertical" size="small">
            <Space>
              <CalendarOutlined className={theme.iconColor} />
              <Text strong className="dark:text-gray-300">
                {dayjs(profile?.createdAt).format('MMMM DD, YYYY [at] HH:mm')}
              </Text>
            </Space>
            <Text type="secondary" className="text-xs dark:text-gray-500">
              {dayjs(profile?.createdAt).fromNow()}
            </Text>
          </Space>
        </Descriptions.Item>
        {profile?.createdBy && (
          <Descriptions.Item label={t('createdBy')} span={2}>
            <Space>
              <UserOutlined className={theme.iconColor} />
              <Text className="dark:text-gray-300">{profile.createdBy}</Text>
            </Space>
          </Descriptions.Item>
        )}
        {profile?.updatedAt && (
          <Descriptions.Item label={t('lastProfileUpdate')} span={2}>
            <Space direction="vertical" size="small">
              <Space>
                <ClockCircleOutlined className="text-orange-500 dark:text-orange-400" />
                <Text strong className="dark:text-gray-300">
                  {dayjs(profile.updatedAt).format('MMMM DD, YYYY [at] HH:mm')}
                </Text>
              </Space>
              <Text type="secondary" className="text-xs dark:text-gray-500">
                {dayjs(profile.updatedAt).fromNow()}
              </Text>
            </Space>
          </Descriptions.Item>
        )}
        {profile?.updatedBy && (
          <Descriptions.Item label={t('lastUpdatedBy')} span={2}>
            <Space>
              <UserOutlined className={theme.iconColor} />
              <Text className="dark:text-gray-300">{profile.updatedBy}</Text>
            </Space>
          </Descriptions.Item>
        )}
        <Descriptions.Item label={t('accountStatus')} span={2}>
          <Tag
            color={profile?.active ? 'success' : 'error'}
            icon={<CheckCircleOutlined />}
            className="text-sm"
          >
            {profile?.active ? t('active') : t('inactive')}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </EnhancedCard>
  );
};
