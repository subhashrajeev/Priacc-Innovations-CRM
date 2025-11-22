'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Clock,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session } = useSession()

  // Mock data for dashboard cards
  const stats = [
    {
      title: 'Total Employees',
      value: '248',
      change: '+12%',
      icon: Users,
      description: 'from last month',
    },
    {
      title: 'Present Today',
      value: '234',
      change: '94.4%',
      icon: CheckCircle2,
      description: 'attendance rate',
    },
    {
      title: 'Pending Leaves',
      value: '8',
      change: '-2',
      icon: Calendar,
      description: 'awaiting approval',
    },
    {
      title: 'Active Projects',
      value: '42',
      change: '+5',
      icon: TrendingUp,
      description: 'from last quarter',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.change}</span> {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* My Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Tasks assigned to you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Complete Q4 Review</p>
                <p className="text-xs text-muted-foreground">Due in 2 days</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Submit Timesheet</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Update Project Status</p>
                <p className="text-xs text-muted-foreground">Due today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">3 Leave Requests</p>
                <p className="text-xs text-muted-foreground">Team members</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
                <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">2 Expense Claims</p>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">1 Document Review</p>
                <p className="text-xs text-muted-foreground">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full rounded-lg border bg-background p-3 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Apply for Leave
            </button>
            <button className="w-full rounded-lg border bg-background p-3 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Submit Expense
            </button>
            <button className="w-full rounded-lg border bg-background p-3 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              Mark Attendance
            </button>
            <button className="w-full rounded-lg border bg-background p-3 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
              View Payslip
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="mt-1 rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Checked in at 9:15 AM</p>
                <p className="text-xs text-muted-foreground">Today, 9:15 AM</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="mt-1 rounded-full bg-green-100 p-2 dark:bg-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Submitted timesheet for Week 47</p>
                <p className="text-xs text-muted-foreground">Yesterday, 5:30 PM</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="mt-1 rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Leave request approved</p>
                <p className="text-xs text-muted-foreground">2 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
