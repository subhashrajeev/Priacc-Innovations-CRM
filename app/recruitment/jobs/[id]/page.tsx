'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Briefcase, MapPin, Users, Eye, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { CandidatePipeline } from '@/components/recruitment/candidate-pipeline'

export default function JobDetailsPage() {
  const params = useParams()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchJobDetails()
    }
  }, [params.id])

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/recruitment/jobs/${params.id}`)
      const data = await response.json()
      if (data.success) {
        setJob(data.data)
      }
    } catch (error) {
      console.error('Error fetching job details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: any = {
      DRAFT: 'secondary',
      OPEN: 'default',
      CLOSED: 'destructive',
      ON_HOLD: 'secondary',
      FILLED: 'default',
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  const getApplicationStatusBadge = (status: string) => {
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

  if (!job) {
    return <div className="text-center py-12">Job not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
            {getStatusBadge(job.status)}
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              {job.jobType.replace(/_/g, ' ')}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
            {job.department && <span>{job.department.name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Edit Job</Button>
          <Button>Schedule Interview</Button>
        </div>
      </div>

      {/* Job Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.applications?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Openings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{job.openings}</div>
            <p className="text-xs text-muted-foreground">Positions available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{job.experience}</div>
            <p className="text-xs text-muted-foreground">Required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Salary Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{job.salaryRange || 'Not specified'}</div>
            <p className="text-xs text-muted-foreground">Annual CTC</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Job Details</TabsTrigger>
          <TabsTrigger value="applications">Applications ({job.applications?.length || 0})</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{job.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{job.requirements}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{job.responsibilities}</p>
            </CardContent>
          </Card>

          {job.publishedAt && (
            <Card>
              <CardHeader>
                <CardTitle>Publishing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published Date:</span>
                    <span className="font-medium">{formatDate(job.publishedAt)}</span>
                  </div>
                  {job.closedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Closed Date:</span>
                      <span className="font-medium">{formatDate(job.closedAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {job.applications && job.applications.length > 0 ? (
            <div className="space-y-3">
              {job.applications.map((app: any) => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {app.firstName} {app.lastName}
                        </CardTitle>
                        <CardDescription>
                          {app.email} • {app.phone}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getApplicationStatusBadge(app.status)}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/recruitment/applications/${app.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-4 text-sm">
                      {app.totalExperience && (
                        <div>
                          <p className="text-muted-foreground">Experience</p>
                          <p className="font-medium">{app.totalExperience} years</p>
                        </div>
                      )}
                      {app.currentCompany && (
                        <div>
                          <p className="text-muted-foreground">Current Company</p>
                          <p className="font-medium">{app.currentCompany}</p>
                        </div>
                      )}
                      {app.expectedCTC && (
                        <div>
                          <p className="text-muted-foreground">Expected CTC</p>
                          <p className="font-medium">{app.expectedCTC} LPA</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Applied On</p>
                        <p className="font-medium">{formatDate(app.createdAt)}</p>
                      </div>
                    </div>
                    {app.interviews && app.interviews.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {app.interviews.length} interview(s) scheduled
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                <p className="text-sm text-muted-foreground">
                  Applications for this job will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <CandidatePipeline applications={job.applications || []} jobId={job.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
