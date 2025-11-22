'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Trophy, BookOpen } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Enrollment {
  id: string
  status: string
  enrolledDate: string
  completedDate: string | null
  score: number | null
  feedback: string | null
  training: {
    id: string
    title: string
    code: string
    type: string
    status: string
    startDate: string
    endDate: string
    duration: number
  }
}

const enrollmentStatusColors: Record<string, string> = {
  ENROLLED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  DROPPED: 'bg-red-100 text-red-800',
  FAILED: 'bg-orange-100 text-orange-800',
}

export default function MyTrainingsPage() {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMyTrainings()
  }, [])

  const fetchMyTrainings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/training/my-trainings')
      if (response.ok) {
        const data = await response.json()
        setEnrollments(data.data || [])
      } else {
        toast.error('Failed to fetch trainings')
      }
    } catch (error) {
      toast.error('Failed to fetch trainings')
    } finally {
      setLoading(false)
    }
  }

  const completedCount = enrollments.filter((e) => e.status === 'COMPLETED').length
  const ongoingCount = enrollments.filter((e) => e.status === 'ENROLLED').length
  const averageScore =
    enrollments.filter((e) => e.score !== null).length > 0
      ? enrollments
          .filter((e) => e.score !== null)
          .reduce((sum, e) => sum + (e.score || 0), 0) /
        enrollments.filter((e) => e.score !== null).length
      : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/training')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">My Trainings</h1>
          <p className="text-muted-foreground">
            Track your enrolled trainings and progress
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trainings</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
            <p className="text-xs text-muted-foreground">
              {ongoingCount} ongoing, {completedCount} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {enrollments.length > 0
                ? Math.round((completedCount / enrollments.length) * 100)
                : 0}
              %
            </div>
            <Progress
              value={
                enrollments.length > 0 ? (completedCount / enrollments.length) * 100 : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Based on {enrollments.filter((e) => e.score !== null).length} assessments
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Training</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Enrolled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No trainings enrolled yet
                  </TableCell>
                </TableRow>
              ) : (
                enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{enrollment.training.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {enrollment.training.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {enrollment.training.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{enrollment.training.duration}h</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(enrollment.enrolledDate)}
                    </TableCell>
                    <TableCell>
                      <Badge className={enrollmentStatusColors[enrollment.status]}>
                        {enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {enrollment.score !== null ? `${enrollment.score}%` : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/training/${enrollment.training.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
