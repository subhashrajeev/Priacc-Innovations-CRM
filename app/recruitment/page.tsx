'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, Users, Calendar, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function RecruitmentPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecruitmentStats()
  }, [])

  const fetchRecruitmentStats = async () => {
    try {
      const response = await fetch('/api/recruitment/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching recruitment stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  const pipelineData = stats
    ? [
        { name: 'Applied', value: stats.applications.pipeline.applied },
        { name: 'Screening', value: stats.applications.pipeline.screening },
        { name: 'Shortlisted', value: stats.applications.pipeline.shortlisted },
        { name: 'Interview', value: stats.applications.pipeline.interview },
        { name: 'Offered', value: stats.applications.pipeline.offered },
        { name: 'Accepted', value: stats.applications.pipeline.accepted },
      ]
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment Dashboard</h1>
          <p className="text-muted-foreground">Manage job postings and applicant tracking</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.jobs.open || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.jobs.total || 0} total jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.applications.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats?.applications.conversionRate}%</span> conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.interviews.today?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.interviews.scheduled || 0} scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.metrics.avgTimeToHire || 0}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Application Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Application Pipeline</CardTitle>
            <CardDescription>Candidates by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Top Sources</CardTitle>
            <CardDescription>Application sources</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.metrics.topSources && stats.metrics.topSources.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.metrics.topSources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.metrics.topSources.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Latest candidate applications</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/recruitment/jobs">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentApplications && stats.recentApplications.length > 0 ? (
              stats.recentApplications.map((app: any) => (
                <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {app.firstName} {app.lastName}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {app.job.title} • {formatDate(app.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{app.status.replace(/_/g, ' ')}</Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/recruitment/applications/${app.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent applications
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Interviews */}
      {stats?.interviews.today && stats.interviews.today.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Interviews</CardTitle>
            <CardDescription>Scheduled interviews for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.interviews.today.map((interview: any) => (
                <div key={interview.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                      <span className="text-lg font-bold">{interview.scheduledTime}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">
                        {interview.application.firstName} {interview.application.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {interview.application.job.title} • Round {interview.round} ({interview.type})
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/recruitment/jobs">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Job Postings
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and manage job openings
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/recruitment/interviews">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Interview Schedule
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage interview schedule
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Reports
              <ArrowRight className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View recruitment analytics and reports
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
