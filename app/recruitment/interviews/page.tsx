'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar as CalendarIcon, Clock, Video, MapPin, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    fetchInterviews()
  }, [])

  const fetchInterviews = async () => {
    try {
      const response = await fetch('/api/recruitment/interviews')
      const data = await response.json()
      if (data.success) {
        setInterviews(data.data)
      }
    } catch (error) {
      console.error('Error fetching interviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTodayInterviews = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return interviews.filter((interview) => {
      const interviewDate = new Date(interview.scheduledDate)
      return interviewDate >= today && interviewDate < tomorrow
    })
  }

  const getUpcomingInterviews = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return interviews
      .filter((interview) => {
        const interviewDate = new Date(interview.scheduledDate)
        return interviewDate >= today
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  }

  const getInterviewsForDate = (date: Date) => {
    const searchDate = new Date(date)
    searchDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(searchDate)
    nextDay.setDate(nextDay.getDate() + 1)

    return interviews.filter((interview) => {
      const interviewDate = new Date(interview.scheduledDate)
      return interviewDate >= searchDate && interviewDate < nextDay
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: any = {
      SCHEDULED: 'default',
      COMPLETED: 'default',
      CANCELLED: 'destructive',
      NO_SHOW: 'destructive',
    }
    const colors: any = {
      SCHEDULED: 'text-blue-600',
      COMPLETED: 'text-green-600',
      CANCELLED: 'text-red-600',
      NO_SHOW: 'text-orange-600',
    }
    return <Badge variant={variants[status] || 'secondary'} className={colors[status]}>{status}</Badge>
  }

  const InterviewCard = ({ interview }: { interview: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {interview.application.firstName} {interview.application.lastName}
            </CardTitle>
            <CardDescription>
              {interview.application.job.title} • Round {interview.round}
            </CardDescription>
          </div>
          {getStatusBadge(interview.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4" />
            {formatDate(interview.scheduledDate)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {interview.scheduledTime}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {interview.duration} mins
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {interview.meetingLink ? (
            <>
              <Video className="h-4 w-4 text-muted-foreground" />
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Join Meeting
              </a>
            </>
          ) : interview.location ? (
            <>
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{interview.location}</span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">{interview.type.replace(/_/g, ' ')}</Badge>
        </div>

        {interview.status === 'SCHEDULED' && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1">
              Reschedule
            </Button>
            <Button size="sm" className="flex-1">
              Add Feedback
            </Button>
          </div>
        )}

        {interview.status === 'COMPLETED' && interview.feedback && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-1">Feedback</p>
            <p className="text-sm text-muted-foreground">{interview.feedback}</p>
            {interview.rating && (
              <p className="text-sm text-muted-foreground mt-1">Rating: {interview.rating}/5</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const todayInterviews = getTodayInterviews()
  const upcomingInterviews = getUpcomingInterviews()
  const selectedDateInterviews = selectedDate ? getInterviewsForDate(selectedDate) : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Schedule</h1>
          <p className="text-muted-foreground">Manage and track interview schedules</p>
        </div>
        <Button>Schedule Interview</Button>
      </div>

      {/* Today's Interviews */}
      {todayInterviews.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Today's Interviews ({todayInterviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Calendar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to view interviews</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        {/* Interview List */}
        <div className="md:col-span-2">
          <Tabs defaultValue="selected" className="space-y-4">
            <TabsList>
              <TabsTrigger value="selected">
                Selected Date ({selectedDateInterviews.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingInterviews.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({interviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="selected" className="space-y-4">
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : selectedDateInterviews.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No interviews scheduled</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate ? formatDate(selectedDate) : 'Select a date'} has no interviews
                    </p>
                  </CardContent>
                </Card>
              ) : (
                selectedDateInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingInterviews.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No upcoming interviews</h3>
                    <p className="text-sm text-muted-foreground">
                      Schedule interviews to see them here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                upcomingInterviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {interviews.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No interviews</h3>
                    <p className="text-sm text-muted-foreground">
                      Interviews will appear here once scheduled
                    </p>
                  </CardContent>
                </Card>
              ) : (
                interviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
