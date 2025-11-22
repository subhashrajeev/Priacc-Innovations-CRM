import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusColors: Record<string, string> = {
  PLANNING: 'bg-blue-500',
  ACTIVE: 'bg-green-500',
  ON_HOLD: 'bg-yellow-500',
  COMPLETED: 'bg-gray-500',
  CANCELLED: 'bg-red-500',
}

const priorityColors: Record<string, string> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'default',
  CRITICAL: 'destructive',
}

interface ProjectCardProps {
  project: any
}

export function ProjectCard({ project }: ProjectCardProps) {
  const daysRemaining = Math.ceil(
    (new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const isOverdue = daysRemaining < 0 && (project.status === 'ACTIVE' || project.status === 'PLANNING')

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
              <CardDescription className="line-clamp-1">{project.code}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={priorityColors[project.priority]} className="text-xs">
                {project.priority}
              </Badge>
              <div className={`h-2 w-2 rounded-full ${statusColors[project.status]}`} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{project.client?.name}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-bold">{project.progress || 0}%</span>
            </div>
            <Progress value={project.progress || 0} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {project._count?.tasks || 0} task{(project._count?.tasks || 0) !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatDate(project.startDate)} - {formatDate(project.endDate)}
            </span>
          </div>
          {isOverdue && (
            <p className="text-xs text-destructive font-medium">
              Overdue by {Math.abs(daysRemaining)} day{Math.abs(daysRemaining) !== 1 ? 's' : ''}
            </p>
          )}

          {/* Budget */}
          {project.estimatedBudget && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatCurrency(project.actualCost || 0)} / {formatCurrency(project.estimatedBudget)}
              </span>
            </div>
          )}

          {/* Team */}
          {project.teamSize > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {project.teamSize} team member{project.teamSize !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Hours */}
          {project.totalHours > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {Math.round(project.totalHours)}h logged
                {project.billableHours > 0 && (
                  <span className="text-green-600 ml-1">
                    ({Math.round(project.billableHours)}h billable)
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Department */}
          {project.department && (
            <Badge variant="outline" className="text-xs">
              {project.department.name}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
