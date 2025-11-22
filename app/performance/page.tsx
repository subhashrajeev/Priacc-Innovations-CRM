'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Target, TrendingUp, Award, Clock, ArrowRight, Star } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function PerformancePage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformanceStats()
  }, [])

  const fetchPerformanceStats = async () => {
    try {
      const response = await fetch('/api/performance/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching performance stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRatingBadge = (rating: string) => {
    const variants: any = {
      OUTSTANDING: 'default',
      EXCEEDS_EXPECTATIONS: 'default',
      MEETS_EXPECTATIONS: 'secondary',
      NEEDS_IMPROVEMENT: 'destructive',
      UNSATISFACTORY: 'destructive',
    }
    return (
      <Badge variant={variants[rating] || 'secondary'}>
        {rating?.replace(/_/g, ' ')}
      </Badge>
    )
  }

  const radarData = stats ? [
    { subject: 'Technical Skills', value: stats.performance.averageRatings.technicalSkills },
    { subject: 'Communication', value: stats.performance.averageRatings.communication },
    { subject: 'Teamwork', value: stats.performance.averageRatings.teamwork },
    { subject: 'Leadership', value: stats.performance.averageRatings.leadership },
    { subject: 'Initiative', value: stats.performance.averageRatings.initiative },
    { subject: 'Problem Solving', value: stats.performance.averageRatings.problemSolving },
  ] : []

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
          <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
          <p className="text-muted-foreground">Track your goals, reviews, and growth</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.performance.latestRating ? (
                getRatingBadge(stats.performance.latestRating)
              ) : (
                'N/A'
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Latest performance review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.goals.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats?.goals.completed || 0}</span> completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.goals.inProgress || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active goals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.goals.overdue || 0}</div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Skills Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Assessment</CardTitle>
            <CardDescription>Average ratings across competencies</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis domain={[0, 5]} />
                <Radar name="Skills" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Recent review scores</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.performance.performanceTrend && stats.performance.performanceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.performance.performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="technicalSkills" fill="#8884d8" name="Technical" />
                  <Bar dataKey="communication" fill="#82ca9d" name="Communication" />
                  <Bar dataKey="teamwork" fill="#ffc658" name="Teamwork" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No performance data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/performance/goals">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                My Goals
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage and track your personal and team goals
              </p>
              <div className="mt-4">
                <div className="text-2xl font-bold">{stats?.goals.completionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">Completion rate</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/performance/reviews">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                My Reviews
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View your performance reviews and feedback
              </p>
              <div className="mt-4">
                <div className="text-2xl font-bold">{stats?.performance.totalReviews || 0}</div>
                <p className="text-xs text-muted-foreground">Total reviews</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/performance/feedback">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Feedback
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Give and receive 360-degree feedback
              </p>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  Give Feedback
                </Button>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}
