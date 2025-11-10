import React from 'react'
import { Skeleton, Card } from 'antd'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 10,
  columns = 5,
  showHeader = true
}) => {
  return (
    <div className="w-full">
      {showHeader && (
        <div className="mb-4 flex gap-4">
          <Skeleton.Input active style={{ width: 200 }} />
          <Skeleton.Input active style={{ width: 150 }} />
          <Skeleton.Input active style={{ width: 120 }} />
          <div className="ml-auto">
            <Skeleton.Button active size="small" />
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="border-b bg-gray-50 px-4 py-3 flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton.Input
              key={`header-${index}`}
              active
              size="small"
              style={{ width: 120 + (index * 20) }}
            />
          ))}
        </div>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="border-b px-4 py-3 flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton.Input
                key={`cell-${rowIndex}-${colIndex}`}
                active
                size="small"
                style={{ width: 100 + (colIndex * 15) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface CardSkeletonProps {
  count?: number
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={`card-${index}`}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
      ))}
    </div>
  )
}

interface PageSkeletonProps {
  showCards?: boolean
  showTable?: boolean
  cardCount?: number
  tableRows?: number
  tableColumns?: number
}

export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  showCards = true,
  showTable = true,
  cardCount = 4,
  tableRows = 10,
  tableColumns = 5
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton.Input active style={{ width: 250 }} size="large" />
        <Skeleton.Button active size="large" />
      </div>

      {/* Cards */}
      {showCards && <CardSkeleton count={cardCount} />}

      {/* Table */}
      {showTable && <TableSkeleton rows={tableRows} columns={tableColumns} />}
    </div>
  )
}

interface FilterSkeletonProps {
  filterCount?: number
}

export const FilterSkeleton: React.FC<FilterSkeletonProps> = ({ filterCount = 3 }) => {
  return (
    <div className="flex gap-3 mb-6">
      {Array.from({ length: filterCount }).map((_, index) => (
        <Skeleton.Input
          key={`filter-${index}`}
          active
          size="small"
          style={{ width: 150 }}
        />
      ))}
    </div>
  )
}