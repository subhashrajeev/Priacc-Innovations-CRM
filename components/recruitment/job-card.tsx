import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, MapPin, Users, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface JobCardProps {
  job: {
    id: string
    title: string
    code: string
    description: string
    jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'
    location: string
    experience: string
    salaryRange?: string
    openings: number
    status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'ON_HOLD' | 'FILLED'
    publishedAt?: Date | string | null
    department?: {
      name: string
    }
    _count?: {
      applications: number
    }
  }
  onClick?: () => void
}

export function JobCard({ job, onClick }: JobCardProps) {
  const getStatusBadge = (status: string) => {
    const variants: any = {
      DRAFT: 'secondary',
      OPEN: 'default',
      CLOSED: 'destructive',
      ON_HOLD: 'secondary',
      FILLED: 'default',
    }
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-700',
      OPEN: 'bg-green-100 text-green-700',
      CLOSED: 'bg-red-100 text-red-700',
      ON_HOLD: 'bg-yellow-100 text-yellow-700',
      FILLED: 'bg-blue-100 text-blue-700',
    }
    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.replace(/_/g, ' ')}
      </Badge>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-xl">{job.title}</CardTitle>
              {getStatusBadge(job.status)}
            </div>
            <CardDescription className="flex items-center gap-3 flex-wrap text-sm">
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {job.jobType.replace(/_/g, ' ')}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              {job.department && <span>{job.department.name}</span>}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {job.description}
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Experience</p>
            <p className="font-medium">{job.experience}</p>
          </div>
          {job.salaryRange && (
            <div>
              <p className="text-sm text-muted-foreground">Salary Range</p>
              <p className="font-medium">{job.salaryRange}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Openings</p>
            <p className="font-medium">{job.openings}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Applications</p>
            <p className="font-medium flex items-center gap-1">
              <Users className="h-4 w-4" />
              {job._count?.applications || 0}
            </p>
          </div>
        </div>

        {job.publishedAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Calendar className="h-4 w-4" />
            Published {formatDate(job.publishedAt)}
          </div>
        )}

        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/recruitment/jobs/${job.id}`}>
              View Details & Applications
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
