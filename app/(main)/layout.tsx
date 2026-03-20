'use client'

import { useState } from 'react'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { MobileHeader } from '@/components/layout/MobileHeader'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => !prev)
  }

  return (
    <div className="flex h-screen">
      {/* Mobile header - only visible on small screens */}
      <MobileHeader
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* Sidebar - hidden on mobile, controlled by collapse state */}
      <div className="hidden md:block">
        <AppSidebar collapsed={sidebarCollapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarCollapsed === false && (
        <>
          {/* Mobile sidebar - slides in from left */}
          <div className="md:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarCollapsed(true)}
            />
            <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
              <AppSidebar />
            </div>
          </div>
        </>
      )}

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
