import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, Briefcase, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface ApplicationCardProps {
  application: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    currentLocation?: string
    totalExperience?: number
    currentCompany?: string
    currentCTC?: number
    expectedCTC?: number
    status: string
    createdAt: Date | string
    job: {
      title: string
      code: string
    }
    interviews?: any[]
  }
}

export function ApplicationCard({ application }: ApplicationCardProps) {
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
    const colors: any = {
      APPLIED: 'bg-gray-100 text-gray-700',
      SCREENING: 'bg-blue-100 text-blue-700',
      SHORTLISTED: 'bg-purple-100 text-purple-700',
      INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-700',
      INTERVIEWED: 'bg-cyan-100 text-cyan-700',
      OFFERED: 'bg-green-100 text-green-700',
      ACCEPTED: 'bg-emerald-100 text-emerald-700',
      REJECTED: 'bg-red-100 text-red-700',
      WITHDRAWN: 'bg-orange-100 text-orange-700',
    }
    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.replace(/_/g, ' ')}
      </Badge>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">
              {application.firstName} {application.lastName}
            </CardTitle>
            <CardDescription>{application.job.title}</CardDescription>
          </div>
          {getStatusBadge(application.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            {application.email}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            {application.phone}
          </div>
          {application.currentLocation && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {application.currentLocation}
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2 text-sm pt-2 border-t">
          {application.totalExperience && (
            <div>
              <p className="text-muted-foreground">Experience</p>
              <p className="font-medium">{application.totalExperience} years</p>
            </div>
          )}
          {application.currentCompany && (
            <div>
              <p className="text-muted-foreground">Current Company</p>
              <p className="font-medium">{application.currentCompany}</p>
            </div>
          )}
          {application.expectedCTC && (
            <div>
              <p className="text-muted-foreground">Expected CTC</p>
              <p className="font-medium">{application.expectedCTC} LPA</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Applied On</p>
            <p className="font-medium">{formatDate(application.createdAt)}</p>
          </div>
        </div>

        {application.interviews && application.interviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Calendar className="h-4 w-4" />
            {application.interviews.length} interview(s) scheduled
          </div>
        )}

        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/recruitment/applications/${application.id}`}>
              View Full Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
