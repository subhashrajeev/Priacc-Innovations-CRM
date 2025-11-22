'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { CommandPalette, useCommandPalette } from '@/components/dashboard/command-palette'
import { cn } from '@/lib/utils'
import { getGreeting } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useCommandPalette()

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login')
  }

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onCollapse={setIsSidebarCollapsed}
        />
      </div>

      {/* Mobile Sidebar - Sheet */}
      <div className="md:hidden">
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <div
              className="fixed left-0 top-0 h-full w-64"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                isCollapsed={false}
                onCollapse={() => {}}
                className="relative"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
        )}
      >
        {/* Header */}
        <Header
          onMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onSearchClick={() => setCommandPaletteOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Page Content */}
        <main className="container mx-auto p-4 md:p-6 lg:p-8">
          {/* Welcome Message */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {getGreeting()}, {session?.user?.name?.split(' ')[0] || 'User'}!
            </h1>
            {session?.user?.designation && (
              <p className="text-sm text-muted-foreground md:text-base">
                {session.user.designation}
                {session.user.department && ` - ${session.user.department}`}
              </p>
            )}
          </div>

          {/* Main Content Area */}
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </div>
  )
}
