'use client'

import React, { memo } from 'react'
import { Tooltip } from 'antd'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { DownOutlined } from '@ant-design/icons'

interface SidebarMenuProps {
  collapsed: boolean
  currentMenuItems: any[]
  selectedKeys: string[]
  openSubmenuKeys: string[]
  setOpenSubmenuKeys: (keys: string[]) => void
  pathname: string
  locale: string
}

export const SidebarMenu = memo<SidebarMenuProps>(({
  collapsed,
  currentMenuItems,
  selectedKeys,
  openSubmenuKeys,
  setOpenSubmenuKeys,
  pathname,
  locale
}) => {
  const activeColorClass = 'bg-white/20'
  const hoverColorClass = 'hover:bg-white/10 hover:text-white'

  return (
    <div className="flex-1 overflow-y-auto px-2 py-4">
      <div className="space-y-1.5">
        {currentMenuItems.map((item) => {
          if (!item || !('key' in item)) return null

          const itemKey = String(item.key)
          const isSelected = selectedKeys.includes(itemKey)
          const hasChildren = 'children' in item && item.children
          const isOpen = openSubmenuKeys.includes(itemKey)

          return (
            <div key={itemKey}>
              {collapsed ? (
                <Tooltip
                  title={'label' in item ? String(item.label) : ''}
                  placement="right"
                  mouseEnterDelay={0.4}
                  classNames={{ root: "dark" }}
                >
                  {!hasChildren && 'href' in item && item.href ? (
                    <Link
                      href={String(item.href)}
                      prefetch={false}
                      className={cn(
                        "w-full flex items-center justify-center py-3 rounded-lg transition-all duration-200 text-white",
                        isSelected 
                          ? `${activeColorClass} scale-105 shadow-lg` 
                          : `${hoverColorClass}`
                      )}
                    >
                      <span className="text-lg">
                        {'icon' in item ? item.icon : null}
                      </span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (hasChildren) {
                          setOpenSubmenuKeys(isOpen ? [] : [itemKey])
                        }
                      }}
                      className={cn(
                        "w-full flex items-center justify-center py-3 rounded-lg transition-all duration-200 text-white",
                        isSelected 
                          ? `${activeColorClass} scale-105 shadow-lg` 
                          : `${hoverColorClass}`
                      )}
                    >
                      <span className="text-lg">
                        {'icon' in item ? item.icon : null}
                      </span>
                    </button>
                  )}
                </Tooltip>
              ) : (
                <>
                  {!hasChildren && 'href' in item && item.href ? (
                    <Link
                      href={String(item.href)}
                      prefetch={false}
                      className={cn(
                        "w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-white",
                        isSelected
                          ? `${activeColorClass} shadow-md`
                          : `${hoverColorClass}`
                      )}
                    >
                      <span className="mr-3 rtl:mr-0 rtl:ml-3 text-lg">
                        {'icon' in item ? item.icon : null}
                      </span>
                      <span className="flex-1 text-left rtl:text-right">
                        {'label' in item ? item.label : ''}
                      </span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (hasChildren) {
                          setOpenSubmenuKeys(
                            isOpen ? openSubmenuKeys.filter(k => k !== itemKey) : [...openSubmenuKeys, itemKey]
                          )
                        }
                      }}
                      className={cn(
                        "w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-white",
                        isSelected
                          ? `${activeColorClass} shadow-md`
                          : `${hoverColorClass}`
                      )}
                    >
                      <span className="mr-3 rtl:mr-0 rtl:ml-3 text-lg">
                        {'icon' in item ? item.icon : null}
                      </span>
                      <span className="flex-1 text-left rtl:text-right">
                        {'label' in item ? item.label : ''}
                      </span>
                      {hasChildren && (
                        <DownOutlined
                          className={cn(
                            "text-xs transition-transform duration-200",
                            isOpen ? "rotate-180" : ""
                          )}
                        />
                      )}
                    </button>
                  )}

                  {/* Submenu */}
                  {hasChildren && isOpen && (
                    <div className="mt-1.5 ml-4 rtl:ml-0 rtl:mr-4 pl-5 rtl:pl-0 rtl:pr-5 border-l-2 rtl:border-l-0 rtl:border-r-2 border-white/20 space-y-1 py-1">
                      {item.children?.map((child: any) => {
                        if (!child || !('key' in child)) return null
                        const childKey = String(child.key)
                        const isChildSelected = selectedKeys.includes(childKey)

                        return 'href' in child && child.href ? (
                          <Link
                            key={childKey}
                            href={String(child.href)}
                            prefetch={false}
                            className={cn(
                              "w-full flex items-center px-4 py-2.5 rounded-lg text-sm transition-all duration-200 text-white",
                              isChildSelected
                                ? `font-semibold bg-white/10`
                                : `${hoverColorClass}`
                            )}
                          >
                            <span className="mr-3 rtl:mr-0 rtl:ml-3 text-base">
                              {'icon' in child ? child.icon : <span className="w-4 h-4 block"></span>}
                            </span>
                            <span className="flex-1 text-left rtl:text-right">
                              {'label' in child ? child.label : ''}
                            </span>
                          </Link>
                        ) : null
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

SidebarMenu.displayName = 'SidebarMenu'
