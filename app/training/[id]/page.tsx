'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  BookOpen,
  Award,
  Download,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Training {
  id: string
  title: string
  code: string
  description: string
  type: string
  status: string
  trainer: string
  trainingMode: string
  location: string
  meetingLink: string
  startDate: string
  endDate: string
  duration: number
  maxParticipants: number
  cost: number
  materials: string
  enrollments: {
    id: string
    status: string
    employee: {
      id: string
      firstName: string
      lastName: string
      employeeCode: string
    }
  }[]
  _count: {
    enrollments: number
  }
}

export default function TrainingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [training, setTraining] = useState<Training | null>(null)
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)

  useEffect(() => {
    fetchTrainingDetails()
  }, [params.id])

  const fetchTrainingDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/training/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTraining(data.data)
        // Check if already enrolled (simplified check)
        setIsEnrolled(data.data.enrollments?.length > 0)
      } else {
        toast.error('Failed to fetch training details')
      }
    } catch (error) {
      toast.error('Failed to fetch training details')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      const response = await fetch(`/api/training/${params.id}/enroll`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Enrolled successfully')
        fetchTrainingDetails()
      } else {
        toast.error(data.error || 'Failed to enroll')
      }
    } catch (error) {
      toast.error('Failed to enroll in training')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    )
  }

  if (!training) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Training not found</div>
      </div>
    )
  }

  const isFull = training.maxParticipants && training._count.enrollments >= training.maxParticipants
  const canEnroll = training.status === 'UPCOMING' || training.status === 'ONGOING'

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{training.title}</h1>
            <Badge>{training.status}</Badge>
          </div>
          <p className="text-muted-foreground">{training.code}</p>
        </div>
        {!isEnrolled && canEnroll && !isFull && (
          <Button onClick={handleEnroll} disabled={enrolling} size="lg">
            {enrolling ? 'Enrolling...' : 'Enroll Now'}
          </Button>
        )}
        {isEnrolled && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            ✓ Enrolled
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About This Training</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{training.description}</p>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Type</p>
                    <p className="text-sm text-muted-foreground">
                      {training.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">{training.duration} hours</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(training.startDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(training.endDate)}
                    </p>
                  </div>
                </div>

                {training.trainer && (
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Trainer</p>
                      <p className="text-sm text-muted-foreground">{training.trainer}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Mode</p>
                    <p className="text-sm text-muted-foreground">{training.trainingMode}</p>
                  </div>
                </div>

                {training.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{training.location}</p>
                    </div>
                  </div>
                )}

                {training.meetingLink && (
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Meeting Link</p>
                      <a
                        href={training.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Join Meeting
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {training.materials && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Training Materials</p>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download Materials
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Participants</p>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{training._count.enrollments}</div>
                  {training.maxParticipants && (
                    <span className="text-muted-foreground">
                      / {training.maxParticipants}
                    </span>
                  )}
                </div>
                {training.maxParticipants && (
                  <div className="mt-2">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(
                            (training._count.enrollments / training.maxParticipants) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {isFull && (
                  <p className="text-sm text-red-600 mt-2">Training is full</p>
                )}
              </div>

              {training.cost && training.cost > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Cost</p>
                  <p className="text-2xl font-bold">₹{training.cost.toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {training.enrollments && training.enrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Participants</CardTitle>
                <CardDescription>
                  {training.enrollments.length} participant(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {training.enrollments.slice(0, 5).map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {enrollment.employee.firstName[0]}
                          {enrollment.employee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {enrollment.employee.firstName} {enrollment.employee.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {enrollment.employee.employeeCode}
                        </p>
                      </div>
                    </div>
                  ))}
                  {training.enrollments.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{training.enrollments.length - 5} more
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
