'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { FileText, Mail, Phone, MapPin, Briefcase, Calendar, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function CandidateProfilePage() {
  const params = useParams()
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchApplicationDetails()
    }
  }, [params.id])

  const fetchApplicationDetails = async () => {
    try {
      const response = await fetch(`/api/recruitment/applications/${params.id}`)
      const data = await response.json()
      if (data.success) {
        setApplication(data.data)
      }
    } catch (error) {
      console.error('Error fetching application details:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (status: string) => {
    try {
      const response = await fetch(`/api/recruitment/applications/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Application status updated')
        fetchApplicationDetails()
      } else {
        toast.error(data.error || 'Failed to update status')
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: any = {
      APPLIED: 'secondary',
      SCREENING: 'secondary',
      SHORTLISTED: 'default',
      INTERVIEW_SCHEDULED: 'default',
      INTERVIEWED: 'default',
      OFFERED: 'default',
      ACCEPTED: 'default',
      REJECTED: 'destructive',
      WITHDRAWN: 'destructive',
    }
    return <Badge variant={variants[status] || 'secondary'}>{status.replace(/_/g, ' ')}</Badge>
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!application) {
    return <div className="text-center py-12">Application not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {application.firstName} {application.lastName}
          </h1>
          <p className="text-muted-foreground">
            Applied for: {application.job.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(application.status)}
          <Button variant="outline" asChild>
            <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download Resume
            </a>
          </Button>
        </div>
      </div>

      {/* Candidate Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">{application.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Phone</p>
            <p className="text-sm text-muted-foreground">{application.phone}</p>
          </CardContent>
        </Card>

        {application.currentLocation && (
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">{application.currentLocation}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Applied On</p>
            <p className="text-sm text-muted-foreground">{formatDate(application.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="interviews">Interviews ({application.interviews?.length || 0})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {application.totalExperience && (
                    <div>
                      <p className="text-sm font-medium">Total Experience</p>
                      <p className="text-sm text-muted-foreground">{application.totalExperience} years</p>
                    </div>
                  )}
                  {application.currentCompany && (
                    <div>
                      <p className="text-sm font-medium">Current Company</p>
                      <p className="text-sm text-muted-foreground">{application.currentCompany}</p>
                    </div>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {application.currentCTC && (
                      <div>
                        <p className="text-sm font-medium">Current CTC</p>
                        <p className="text-sm text-muted-foreground">{application.currentCTC} LPA</p>
                      </div>
                    )}
                    {application.expectedCTC && (
                      <div>
                        <p className="text-sm font-medium">Expected CTC</p>
                        <p className="text-sm text-muted-foreground">{application.expectedCTC} LPA</p>
                      </div>
                    )}
                  </div>
                  {application.noticePeriod && (
                    <div>
                      <p className="text-sm font-medium">Notice Period</p>
                      <p className="text-sm text-muted-foreground">{application.noticePeriod} days</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {application.coverLetter && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cover Letter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{application.coverLetter}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Position</p>
                    <p className="text-sm text-muted-foreground">{application.job.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{application.job.location}</p>
                  </div>
                  {application.job.salaryRange && (
                    <div>
                      <p className="text-sm font-medium">Salary Range</p>
                      <p className="text-sm text-muted-foreground">{application.job.salaryRange}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interviews" className="space-y-4">
              {application.interviews && application.interviews.length > 0 ? (
                application.interviews.map((interview: any) => (
                  <Card key={interview.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Round {interview.round}: {interview.type.replace(/_/g, ' ')}
                          </CardTitle>
                          <CardDescription>
                            {formatDate(interview.scheduledDate)} at {interview.scheduledTime}
                          </CardDescription>
                        </div>
                        <Badge>{interview.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {interview.meetingLink && (
                        <div>
                          <p className="text-sm font-medium">Meeting Link</p>
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {interview.meetingLink}
                          </a>
                        </div>
                      )}
                      {interview.location && (
                        <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">{interview.location}</p>
                        </div>
                      )}
                      {interview.feedback && (
                        <div>
                          <p className="text-sm font-medium">Feedback</p>
                          <p className="text-sm text-muted-foreground">{interview.feedback}</p>
                        </div>
                      )}
                      {interview.rating && (
                        <div>
                          <p className="text-sm font-medium">Rating</p>
                          <p className="text-sm text-muted-foreground">{interview.rating}/5</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No interviews scheduled</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Schedule an interview to move forward
                    </p>
                    <Button>Schedule Interview</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Application Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <div className="w-px h-full bg-border" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">Application Submitted</p>
                        <p className="text-xs text-muted-foreground">{formatDate(application.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <div className="w-px h-full bg-border" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">Status: {application.status}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(application.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Move to Stage</p>
                <Select
                  value={application.status}
                  onValueChange={updateApplicationStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCREENING">Screening</SelectItem>
                    <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                    <SelectItem value="INTERVIEW_SCHEDULED">Interview Scheduled</SelectItem>
                    <SelectItem value="INTERVIEWED">Interviewed</SelectItem>
                    <SelectItem value="OFFERED">Offered</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <Button className="w-full">Schedule Interview</Button>
              <Button variant="outline" className="w-full">
                Send Email
              </Button>
              <Button variant="outline" className="w-full">
                Generate Offer Letter
              </Button>
            </CardContent>
          </Card>

          {application.source && (
            <Card>
              <CardHeader>
                <CardTitle>Source</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{application.source}</p>
                {application.referredBy && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Referred by: {application.referredBy}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
