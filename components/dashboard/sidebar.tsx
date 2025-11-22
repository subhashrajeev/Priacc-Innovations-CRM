'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronDown,
  ChevronRight,
  Building2,
  GitBranch,
  UserPlus,
  ClipboardList,
  FileText,
  CalendarDays,
  DollarSign,
  FileBarChart,
  Trophy,
  MessageSquare,
  UserCheck,
  Send,
  BookOpen,
  Award,
  Box,
  CheckSquare,
  CreditCard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { isAdmin } from '@/lib/auth'
import { UserRole } from '@prisma/client'

interface NavItem {
  title: string
  href?: string
  icon: React.ElementType
  badge?: string
  children?: NavItem[]
  roles?: UserRole[]
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Employees',
    icon: Users,
    children: [
      { title: 'Directory', href: '/employees', icon: Users },
      { title: 'Org Chart', href: '/employees/org-chart', icon: GitBranch },
      { title: 'Onboarding', href: '/employees/onboarding', icon: UserPlus, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE] },
    ],
  },
  {
    title: 'Attendance',
    icon: Clock,
    children: [
      { title: 'My Attendance', href: '/attendance', icon: Clock },
      { title: 'Team Attendance', href: '/attendance/team', icon: Users, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE, UserRole.MANAGER, UserRole.TEAM_LEAD] },
      { title: 'Reports', href: '/attendance/reports', icon: FileText, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE] },
    ],
  },
  {
    title: 'Leave',
    icon: Calendar,
    children: [
      { title: 'Apply Leave', href: '/leave/apply', icon: Send },
      { title: 'My Leaves', href: '/leave', icon: CalendarDays },
      { title: 'Approvals', href: '/leave/approvals', icon: CheckSquare, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE, UserRole.MANAGER, UserRole.TEAM_LEAD] },
      { title: 'Calendar', href: '/leave/calendar', icon: Calendar },
    ],
  },
  {
    title: 'Payroll',
    icon: Wallet,
    children: [
      { title: 'My Payslip', href: '/payroll', icon: FileText },
      { title: 'Salary Structure', href: '/payroll/structure', icon: DollarSign, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER] },
      { title: 'Tax Declaration', href: '/payroll/tax-declaration', icon: FileBarChart },
    ],
  },
  {
    title: 'Performance',
    icon: Target,
    children: [
      { title: 'My Goals', href: '/performance', icon: Target },
      { title: 'Reviews', href: '/performance/reviews', icon: ClipboardList },
      { title: 'Feedback', href: '/performance/feedback', icon: MessageSquare },
    ],
  },
  {
    title: 'Recruitment',
    icon: Briefcase,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.HR_EXECUTIVE],
    children: [
      { title: 'Jobs', href: '/recruitment', icon: Briefcase },
      { title: 'Applications', href: '/recruitment/applications', icon: FileText },
      { title: 'Interviews', href: '/recruitment/interviews', icon: UserCheck },
    ],
  },
  {
    title: 'Projects',
    icon: FolderKanban,
    children: [
      { title: 'All Projects', href: '/projects', icon: FolderKanban },
      { title: 'My Projects', href: '/projects/my-projects', icon: Box },
      { title: 'Clients', href: '/projects/clients', icon: Building2, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] },
      { title: 'Timesheets', href: '/projects/timesheets', icon: Clock },
    ],
  },
  {
    title: 'Training',
    icon: GraduationCap,
    children: [
      { title: 'Courses', href: '/training', icon: BookOpen },
      { title: 'My Trainings', href: '/training/my-trainings', icon: GraduationCap },
      { title: 'Certifications', href: '/training/certifications', icon: Award },
    ],
  },
  {
    title: 'Assets',
    icon: Package,
    children: [
      { title: 'My Assets', href: '/assets', icon: Package },
      { title: 'All Assets', href: '/assets/all', icon: Box, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER] },
      { title: 'Requests', href: '/assets/requests', icon: CheckSquare, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR_MANAGER] },
    ],
  },
  {
    title: 'Expenses',
    icon: Receipt,
    children: [
      { title: 'Submit Expense', href: '/expenses/submit', icon: Send },
      { title: 'My Expenses', href: '/expenses', icon: CreditCard },
      { title: 'Approvals', href: '/expenses/approvals', icon: CheckSquare, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD] },
    ],
  },
  {
    title: 'Announcements',
    href: '/announcements',
    icon: Megaphone,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
]

interface SidebarProps {
  isCollapsed: boolean
  onCollapse: (collapsed: boolean) => void
  className?: string
}

export function Sidebar({ isCollapsed, onCollapse, className }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  const hasAccess = (roles?: UserRole[]) => {
    if (!roles || roles.length === 0) return true
    if (!session?.user?.role) return false
    return roles.includes(session.user.role)
  }

  const isActive = (href?: string, children?: NavItem[]) => {
    if (href) {
      return pathname === href || pathname.startsWith(href + '/')
    }
    if (children) {
      return children.some((child) =>
        child.href && (pathname === child.href || pathname.startsWith(child.href + '/'))
      )
    }
    return false
  }

  const filteredNavigation = navigation.filter((item) => hasAccess(item.roles))

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <span className="font-semibold">Priacc CRM</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, item.children)
              const expanded = expandedItems.includes(item.title)
              const hasChildren = item.children && item.children.length > 0

              // Filter children based on roles
              const filteredChildren = item.children?.filter((child) =>
                hasAccess(child.roles)
              )

              if (hasChildren && filteredChildren && filteredChildren.length === 0) {
                return null
              }

              return (
                <div key={item.title}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleExpand(item.title)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                          isCollapsed && 'justify-center'
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 shrink-0" />
                          <AnimatePresence>
                            {!isCollapsed && (
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="overflow-hidden whitespace-nowrap"
                              >
                                {item.title}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                        {!isCollapsed && (
                          <motion.div
                            initial={false}
                            animate={{ rotate: expanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </motion.div>
                        )}
                      </button>

                      <AnimatePresence>
                        {expanded && !isCollapsed && filteredChildren && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-4 mt-1 space-y-1 overflow-hidden border-l pl-4"
                          >
                            {filteredChildren.map((child) => {
                              const ChildIcon = child.icon
                              const childActive = child.href && (pathname === child.href || pathname.startsWith(child.href + '/'))

                              return (
                                <Link
                                  key={child.title}
                                  href={child.href || '#'}
                                  className={cn(
                                    'flex items-center space-x-3 rounded-md px-3 py-2 text-sm transition-colors',
                                    childActive
                                      ? 'bg-primary/10 text-primary'
                                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                  )}
                                >
                                  <ChildIcon className="h-4 w-4 shrink-0" />
                                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                                    {child.title}
                                  </span>
                                  {child.badge && (
                                    <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                                      {child.badge}
                                    </span>
                                  )}
                                </Link>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className={cn(
                        'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        isCollapsed && 'justify-center'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="overflow-hidden whitespace-nowrap"
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!isCollapsed && item.badge && (
                        <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  )
}
