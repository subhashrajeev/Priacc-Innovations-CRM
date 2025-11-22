'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCard } from '@/components/analytics/stat-card'
import { ChartContainer } from '@/components/analytics/chart-container'
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  Target,
  Briefcase,
  FolderOpen,
  Receipt,
  RefreshCw,
  Download,
  TrendingUp,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, subMonths } from 'date-fns'
import { toast } from 'sonner'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658']

interface AnalyticsData {
  employees: any
  attendance: any
  leave: any
  payroll: any
  performance: any
  recruitment: any
  projects: any
  expenses: any
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [dateRange, setDateRange] = useState('30')
  const [departmentId, setDepartmentId] = useState<string>('all')
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    fetchDepartments()
    fetchAnalytics()
  }, [dateRange, departmentId])

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments')
      if (res.ok) {
        const data = await res.json()
        setDepartments(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const endDate = new Date()
      const startDate = subMonths(endDate, parseInt(dateRange) / 30)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(departmentId !== 'all' && { departmentId }),
      })

      const res = await fetch(`/api/analytics/dashboard?${params}`)
      if (res.ok) {
        const result = await res.json()
        setData(result.data)
      } else {
        toast.error('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('An error occurred while fetching analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchAnalytics()
  }

  const handleExport = () => {
    toast.info('Export functionality coming soon')
  }

  if (!data && !loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your organization's performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={data?.employees.active || 0}
          icon={Users}
          trend={{
            value: data?.employees.growth || 0,
            label: 'vs last period',
            isPositive: true,
          }}
          loading={loading}
        />
        <StatCard
          title="Active Projects"
          value={data?.projects.activeProjects || 0}
          icon={FolderOpen}
          description="Currently in progress"
          loading={loading}
        />
        <StatCard
          title="Attendance Rate"
          value={`${data?.attendance.monthlyAverage || 0}%`}
          icon={Calendar}
          description="Monthly average"
          loading={loading}
        />
        <StatCard
          title="Total Payroll"
          value={`₹${((data?.payroll.totalPayroll || 0) / 100000).toFixed(1)}L`}
          icon={DollarSign}
          description="This month"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Employee Distribution by Department */}
        <ChartContainer
          title="Employee Distribution"
          description="By department"
          loading={loading}
          onExport={() => toast.info('Export chart functionality coming soon')}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.employees.byDepartment || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="name"
              >
                {(data?.employees.byDepartment || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Attendance Breakdown */}
        <ChartContainer
          title="Today's Attendance"
          description="Status breakdown"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.attendance.breakdown || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Leave Utilization */}
        <ChartContainer
          title="Leave Utilization"
          description="By leave type"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.leave.byType || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalDays" fill="#82ca9d" name="Total Days" />
              <Bar dataKey="count" fill="#8884d8" name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Project Utilization */}
        <ChartContainer
          title="Project Metrics"
          description="Budget vs Actual Cost"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: 'Projects',
                  budget: data?.projects.totalRevenue || 0,
                  cost: data?.projects.totalCost || 0,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="budget" fill="#0088FE" name="Budget" />
              <Bar dataKey="cost" fill="#FF8042" name="Actual Cost" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Leaves"
          value={data?.leave.pendingApprovals || 0}
          icon={FileText}
          description="Awaiting approval"
          loading={loading}
        />
        <StatCard
          title="Open Positions"
          value={data?.recruitment.openPositions || 0}
          icon={Briefcase}
          description={`${data?.recruitment.applicationsThisMonth || 0} applications`}
          loading={loading}
        />
        <StatCard
          title="Avg Performance"
          value={`${(data?.performance.averageRating || 0).toFixed(1)}/5`}
          icon={Target}
          description={`${data?.performance.reviewsCompleted || 0} reviews`}
          loading={loading}
        />
        <StatCard
          title="Pending Expenses"
          value={data?.expenses.pending || 0}
          icon={Receipt}
          description={`₹${((data?.expenses.approvedThisMonth || 0) / 1000).toFixed(1)}K approved`}
          loading={loading}
        />
      </div>

      {/* Additional Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Designation Distribution */}
        <ChartContainer
          title="Employee Hierarchy"
          description="By designation level"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.employees.byDesignation || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Utilization Rate */}
        <ChartContainer
          title="Resource Utilization"
          description="Billable hours percentage"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Billable', value: data?.projects.utilization || 0 },
                  { name: 'Non-Billable', value: 100 - (data?.projects.utilization || 0) },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#00C49F" />
                <Cell fill="#FF8042" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Quick Stats Grid */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Key Metrics Summary</h3>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Attrition Rate</p>
            <p className="text-2xl font-bold">{(data?.employees.attritionRate || 0).toFixed(1)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Salary</p>
            <p className="text-2xl font-bold">₹{((data?.payroll.averageSalary || 0) / 1000).toFixed(0)}K</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Goals Completion</p>
            <p className="text-2xl font-bold">{(data?.performance.goalsCompletionRate || 0).toFixed(0)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Time to Hire</p>
            <p className="text-2xl font-bold">{(data?.recruitment.averageTimeToHire || 0).toFixed(0)} days</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">WFH Count</p>
            <p className="text-2xl font-bold">{data?.attendance.wfhCount || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
