'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCard } from '@/components/analytics/stat-card'
import { ChartContainer } from '@/components/analytics/chart-container'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  RefreshCw,
  Download,
  AlertCircle,
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
import { toast } from 'sonner'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d']

export default function HRAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [months, setMonths] = useState('12')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      // Check if user has HR access
      const hasHRAccess = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'].includes(
        session?.user?.role || ''
      )

      if (!hasHRAccess) {
        toast.error('Access denied - HR/Admin privileges required')
        router.push('/analytics')
        return
      }

      fetchHRAnalytics()
    }
  }, [status, months, router, session])

  const fetchHRAnalytics = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/analytics/hr?months=${months}`)
      if (res.ok) {
        const result = await res.json()
        setData(result.data)
      } else if (res.status === 403) {
        toast.error('Access denied - HR/Admin privileges required')
        router.push('/analytics')
      } else {
        toast.error('Failed to fetch HR analytics')
      }
    } catch (error) {
      console.error('Error fetching HR analytics:', error)
      toast.error('An error occurred while fetching analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchHRAnalytics()
  }

  const handleExport = () => {
    toast.info('Export functionality coming soon')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Loading HR Analytics...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">HR Analytics</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">HR Analytics</h1>
          <p className="text-muted-foreground">
            Detailed human resources insights and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={months} onValueChange={setMonths}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Headcount"
          value={data?.headcount.current || 0}
          icon={Users}
          trend={{
            value: data?.headcount.growth || 0,
            label: `vs ${months} months ago`,
            isPositive: true,
          }}
          loading={loading}
        />
        <StatCard
          title="Attrition Rate"
          value={`${(data?.attrition.rate || 0).toFixed(1)}%`}
          icon={TrendingDown}
          description="Employees who left"
          loading={loading}
        />
        <StatCard
          title="Average Tenure"
          value={`${(data?.tenure.average || 0).toFixed(1)} yrs`}
          icon={Award}
          description="Company average"
          loading={loading}
        />
        <StatCard
          title="Cost Per Hire"
          value={`₹${((data?.recruitment.costPerHire || 0) / 1000).toFixed(0)}K`}
          icon={DollarSign}
          description={`${data?.recruitment.totalHires || 0} hires in period`}
          loading={loading}
        />
      </div>

      <Tabs defaultValue="headcount" className="space-y-4">
        <TabsList>
          <TabsTrigger value="headcount">Headcount</TabsTrigger>
          <TabsTrigger value="diversity">Diversity</TabsTrigger>
          <TabsTrigger value="attrition">Attrition</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        {/* Headcount Tab */}
        <TabsContent value="headcount" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChartContainer
              title="Headcount Trends"
              description="Monthly active employees"
              loading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.headcount.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="active" stroke="#8884d8" name="Active" />
                  <Line type="monotone" dataKey="joined" stroke="#82ca9d" name="Joined" />
                  <Line type="monotone" dataKey="left" stroke="#ff8042" name="Left" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="Department Distribution"
              description="Employees and average salary"
              loading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.department.distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="employees" fill="#8884d8" name="Employees" />
                  <Bar
                    yAxisId="right"
                    dataKey="avgSalary"
                    fill="#82ca9d"
                    name="Avg Salary (₹)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </TabsContent>

        {/* Diversity Tab */}
        <TabsContent value="diversity" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ChartContainer
              title="Age Distribution"
              description="Employees by age group"
              loading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.diversity.age || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ageGroup" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="Gender Distribution"
              description="Workplace diversity"
              loading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.diversity.gender || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ gender, percent }) =>
                      `${gender}: ${(percent * 100).toFixed(1)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="gender"
                  >
                    {(data?.diversity.gender || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="Tenure Distribution"
              description="Employee retention by tenure"
              loading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.tenure.distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tenureGroup" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </TabsContent>

        {/* Attrition Tab */}
        <TabsContent value="attrition" className="space-y-6">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                Attrition Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Rate</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {(data?.attrition.rate || 0).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Tenure of Exits</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {(data?.attrition.avgTenure || 0).toFixed(1)} years
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Exits</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {data?.attrition.byMonth?.reduce(
                      (sum: number, m: any) => sum + m.count,
                      0
                    ) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <ChartContainer
              title="Attrition by Month"
              description="Employee exits over time"
              loading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data?.attrition.byMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#ff8042"
                    fill="#ff8042"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="Exit Reasons"
              description="Why employees leave"
              loading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.attrition.byReason || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ reason, percent }) =>
                      `${reason}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="reason"
                  >
                    {(data?.attrition.byReason || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="Attrition by Department"
              description="Department-wise exits"
              loading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.attrition.byDepartment || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ff8042" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Training Cost"
              value={`₹${((data?.training.roi.totalCost || 0) / 1000).toFixed(0)}K`}
              icon={DollarSign}
              description="Total investment"
              loading={loading}
            />
            <StatCard
              title="Employees Trained"
              value={data?.training.roi.employeesTrained || 0}
              icon={Users}
              description="In selected period"
              loading={loading}
            />
            <StatCard
              title="Completion Rate"
              value={`${(data?.training.roi.completionRate || 0).toFixed(0)}%`}
              icon={Award}
              description="Training completion"
              loading={loading}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ChartContainer
              title="Training Status"
              description="Enrollment status breakdown"
              loading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.training.byStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percent }) =>
                      `${status}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                  >
                    {(data?.training.byStatus || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="Employee Satisfaction Trends"
              description="Based on performance ratings"
              loading={loading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.satisfaction.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="avgRating"
                    stroke="#82ca9d"
                    name="Avg Rating"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
