'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TaskKanban } from '@/components/projects/task-kanban'
import { TimesheetGrid } from '@/components/projects/timesheet-grid'
import {
  ArrowLeft,
  Edit,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import { isManager } from '@/lib/auth'
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

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const canManageProjects = session?.user?.role ? isManager(session.user.role) : false

  useEffect(() => {
    if (params.id) {
      fetchProject()
    }
  }, [params.id])

  const fetchProject = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setProject(result.data)
      } else {
        toast.error('Failed to fetch project details')
        router.push('/projects')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('An error occurred while fetching project')
      router.push('/projects')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const daysRemaining = Math.ceil(
    (new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const budgetUsed = project.estimatedBudget
    ? ((project.actualCost / project.estimatedBudget) * 100).toFixed(1)
    : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant={priorityColors[project.priority]}>{project.priority}</Badge>
              <div className={`h-2 w-2 rounded-full ${statusColors[project.status]}`} />
            </div>
            <p className="text-muted-foreground">
              {project.code} • {project.client.name}
            </p>
          </div>
        </div>
        {canManageProjects && (
          <Button asChild>
            <Link href={`/projects/${project.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Link>
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress}%</div>
            <Progress value={project.progress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {project.taskStats.completed} of {project.taskStats.total} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {daysRemaining > 0 ? `${daysRemaining}d` : 'Overdue'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(project.startDate)} - {formatDate(project.endDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetUsed}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(project.actualCost || 0)} of{' '}
              {formatCurrency(project.estimatedBudget || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(project.totalHours)}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(project.billableHours)}h billable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks
            <Badge variant="secondary" className="ml-2">
              {project.taskStats.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {project.description || 'No description provided'}
                  </p>
                </div>
                {project.objectives && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Objectives</h4>
                    <p className="text-sm text-muted-foreground">{project.objectives}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Client</h4>
                    <p className="text-sm text-muted-foreground">{project.client.name}</p>
                  </div>
                  {project.department && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Department</h4>
                      <p className="text-sm text-muted-foreground">{project.department.name}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">To Do</span>
                  <Badge variant="secondary">{project.taskStats.todo}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">In Progress</span>
                  <Badge variant="default">{project.taskStats.inProgress}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Review</span>
                  <Badge variant="default">{project.taskStats.review}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed</span>
                  <Badge variant="default">{project.taskStats.completed}</Badge>
                </div>
                {project.taskStats.blocked > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-destructive">Blocked</span>
                    <Badge variant="destructive">{project.taskStats.blocked}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {project.projectManagerDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Project Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={project.projectManagerDetails.profilePhoto} />
                    <AvatarFallback>
                      {project.projectManagerDetails.firstName[0]}
                      {project.projectManagerDetails.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {project.projectManagerDetails.firstName}{' '}
                      {project.projectManagerDetails.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {project.projectManagerDetails.designation?.title}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <TaskKanban projectId={project.id} />
        </TabsContent>

        {/* Timesheets Tab */}
        <TabsContent value="timesheets">
          <TimesheetGrid projectId={project.id} />
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {project.teamMembers.length} member{project.teamMembers.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.teamMembers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {project.teamMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Avatar>
                        <AvatarImage src={member.profilePhoto} />
                        <AvatarFallback>
                          {member.firstName[0]}
                          {member.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {member.designation?.title || 'Team Member'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No team members assigned</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
