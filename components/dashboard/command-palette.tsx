'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  Wallet,
  Target,
  Briefcase,
  FolderKanban,
  GraduationCap,
  Package,
  Receipt,
  Megaphone,
  BarChart3,
  Send,
  FileText,
  User,
  Settings,
  CreditCard,
  Building2,
} from 'lucide-react'
import { UserRole } from '@prisma/client'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface QuickAction {
  title: string
  href?: string
  action?: () => void
  icon: React.ElementType
  shortcut?: string
  roles?: UserRole[]
  group: string
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [search, setSearch] = useState('')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const hasAccess = (roles?: UserRole[]) => {
    if (!roles || roles.length === 0) return true
    if (!session?.user?.role) return false
    return roles.includes(session.user.role)
  }

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false)
    command()
  }, [onOpenChange])

  const quickActions: QuickAction[] = [
    // Navigation
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      shortcut: 'D',
      group: 'Navigation',
    },
    {
      title: 'Employees',
      href: '/employees',
      icon: Users,
      group: 'Navigation',
    },
    {
      title: 'My Attendance',
      href: '/attendance',
      icon: Clock,
      group: 'Navigation',
    },
    {
      title: 'Leave Management',
      href: '/leave',
      icon: Calendar,
      group: 'Navigation',
    },
    {
      title: 'Payroll',
      href: '/payroll',
      icon: Wallet,
      group: 'Navigation',
    },
    {
      title: 'Performance',
      href: '/performance',
      icon: Target,
      group: 'Navigation',
    },
    {
      title: 'Projects',
      href: '/projects',
      icon: FolderKanban,
      group: 'Navigation',
    },
    {
      title: 'Training',
      href: '/training',
      icon: GraduationCap,
      group: 'Navigation',
    },
    {
      title: 'Assets',
      href: '/assets',
      icon: Package,
      group: 'Navigation',
    },
    {
      title: 'Expenses',
      href: '/expenses',
      icon: Receipt,
      group: 'Navigation',
    },
    {
      title: 'Announcements',
      href: '/announcements',
      icon: Megaphone,
      group: 'Navigation',
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      group: 'Navigation',
    },

    // Quick Actions
    {
      title: 'Apply for Leave',
      href: '/leave/apply',
      icon: Send,
      shortcut: 'L',
      group: 'Quick Actions',
    },
    {
      title: 'Submit Expense',
      href: '/expenses/submit',
      icon: CreditCard,
      shortcut: 'E',
      group: 'Quick Actions',
    },
    {
      title: 'Mark Attendance',
      href: '/attendance',
      icon: Clock,
      shortcut: 'A',
      group: 'Quick Actions',
    },
    {
      title: 'View Payslip',
      href: '/payroll',
      icon: FileText,
      shortcut: 'P',
      group: 'Quick Actions',
    },
    {
      title: 'Recruitment - Post Job',
      href: '/recruitment/create',
      icon: Briefcase,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE],
      group: 'Quick Actions',
    },
    {
      title: 'Add New Employee',
      href: '/employees/create',
      icon: Users,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE],
      group: 'Quick Actions',
    },

    // Settings
    {
      title: 'My Profile',
      href: '/profile',
      icon: User,
      group: 'Settings',
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: Settings,
      group: 'Settings',
    },
    {
      title: 'Organization Settings',
      href: '/settings/organization',
      icon: Building2,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      group: 'Settings',
    },
  ]

  const filteredActions = quickActions.filter((action) => hasAccess(action.roles))

  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.group]) {
      acc[action.group] = []
    }
    acc[action.group].push(action)
    return acc
  }, {} as Record<string, QuickAction[]>)

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {Object.entries(groupedActions).map(([group, actions], index) => (
          <div key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {actions.map((action) => {
                const Icon = action.icon
                return (
                  <CommandItem
                    key={action.title}
                    value={action.title}
                    onSelect={() => {
                      if (action.href) {
                        runCommand(() => router.push(action.href!))
                      } else if (action.action) {
                        runCommand(action.action)
                      }
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{action.title}</span>
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </div>
        ))}

        {/* Employee Search Section */}
        {search && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Employees">
              <CommandItem>
                <Users className="mr-2 h-4 w-4" />
                <span>Search employees for "{search}"</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {/* Keyboard Shortcuts Help */}
        <CommandSeparator />
        <CommandGroup heading="Keyboard Shortcuts">
          <CommandItem disabled>
            <span className="text-xs text-muted-foreground">
              Press <kbd className="rounded border px-1">⌘K</kbd> or{' '}
              <kbd className="rounded border px-1">Ctrl+K</kbd> to open this menu
            </span>
          </CommandItem>
          <CommandItem disabled>
            <span className="text-xs text-muted-foreground">
              Use <kbd className="rounded border px-1">↑</kbd>{' '}
              <kbd className="rounded border px-1">↓</kbd> to navigate
            </span>
          </CommandItem>
          <CommandItem disabled>
            <span className="text-xs text-muted-foreground">
              Press <kbd className="rounded border px-1">Enter</kbd> to select
            </span>
          </CommandItem>
          <CommandItem disabled>
            <span className="text-xs text-muted-foreground">
              Press <kbd className="rounded border px-1">Esc</kbd> to close
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  return {
    open,
    setOpen,
    toggle: () => setOpen((prev) => !prev),
  }
}
