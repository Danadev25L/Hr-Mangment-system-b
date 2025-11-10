'use client'

import React, { useState } from 'react'
import { Card, Button, Space, Divider, Switch } from 'antd'
import {
  CustomSpinner,
  PageLoading,
  InlineLoading,
  FullPageLoading,
  TableSkeleton,
  CardSkeleton,
  DashboardSkeleton,
  ProfileSkeleton,
  FormSkeleton,
  SkeletonLoader,
  useGlobalLoader,
} from '@/components/ui'

export default function LoadingShowcase() {
  const [showFullPage, setShowFullPage] = useState(false)
  const [loading, setLoading] = useState(true)
  const { showLoader, hideLoader } = useGlobalLoader()

  const handleGlobalLoader = () => {
    showLoader('Processing your request...')
    setTimeout(() => hideLoader(), 3000)
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Global Loading System Showcase
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Beautiful loading states and skeleton components for the HR Management System
        </p>

        {/* Spinner Variants */}
        <Card title="🎨 Spinner Variants" className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <h3 className="font-semibold mb-4">Logo Spinner</h3>
              <CustomSpinner size="large" text="Loading..." variant="logo" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-4">Pulse Spinner</h3>
              <CustomSpinner size="large" text="Processing" variant="pulse" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-4">Dots Spinner</h3>
              <CustomSpinner size="large" text="Please wait" variant="dots" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-4">Default Spinner</h3>
              <CustomSpinner size="large" text="Loading" variant="default" />
            </div>
          </div>

          <Divider />

          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="font-semibold mb-4">Small</h3>
              <CustomSpinner size="small" variant="logo" />
            </div>
            <div>
              <h3 className="font-semibold mb-4">Default</h3>
              <CustomSpinner size="default" variant="logo" />
            </div>
            <div>
              <h3 className="font-semibold mb-4">Large</h3>
              <CustomSpinner size="large" variant="logo" />
            </div>
          </div>
        </Card>

        {/* Skeleton Loaders */}
        <Card title="💀 Skeleton Loaders" className="mb-8">
          <Space direction="vertical" size="large" className="w-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Table Skeleton</h3>
                <Switch checked={loading} onChange={setLoading} />
              </div>
              {loading && <TableSkeleton rows={5} />}
            </div>

            <Divider />

            <div>
              <h3 className="font-semibold mb-4">Card Skeleton</h3>
              <CardSkeleton count={2} />
            </div>

            <Divider />

            <div>
              <h3 className="font-semibold mb-4">Profile Skeleton</h3>
              <ProfileSkeleton />
            </div>

            <Divider />

            <div>
              <h3 className="font-semibold mb-4">Form Skeleton</h3>
              <FormSkeleton fields={4} />
            </div>

            <Divider />

            <div>
              <h3 className="font-semibold mb-4">Dashboard Skeleton</h3>
              <DashboardSkeleton />
            </div>
          </Space>
        </Card>

        {/* Global Loader */}
        <Card title="🌐 Global Loader" className="mb-8">
          <Space>
            <Button type="primary" onClick={handleGlobalLoader}>
              Show Global Loader (3s)
            </Button>
            <Button onClick={() => setShowFullPage(true)}>
              Show Full Page Loader
            </Button>
          </Space>
          <p className="text-sm text-gray-500 mt-4">
            Global loader can be triggered from anywhere in the app using the useGlobalLoader hook
          </p>
        </Card>

        {/* Inline Loading */}
        <Card title="📍 Inline Loading" className="mb-8">
          <InlineLoading text="Loading more content..." />
        </Card>

        {/* Code Examples */}
        <Card title="💻 Usage Examples" className="mb-8">
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <code className="text-sm">
                {`import { CustomSpinner } from '@/components/ui'

<CustomSpinner size="large" text="Loading..." variant="logo" />`}
              </code>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <code className="text-sm">
                {`import { TableSkeleton } from '@/components/ui'

{isLoading ? <TableSkeleton rows={10} /> : <YourTable />}`}
              </code>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <code className="text-sm">
                {`import { useGlobalLoader } from '@/components/ui'

const { showLoader, hideLoader } = useGlobalLoader()

showLoader('Saving...')
// ... async operation
hideLoader()`}
              </code>
            </div>
          </div>
        </Card>
      </div>

      {showFullPage && (
        <FullPageLoading text="Loading full page..." />
      )}
      
      {showFullPage && (
        <div className="fixed bottom-8 right-8 z-[10000]">
          <Button type="primary" onClick={() => setShowFullPage(false)}>
            Close Full Page Loader
          </Button>
        </div>
      )}
    </div>
  )
}
