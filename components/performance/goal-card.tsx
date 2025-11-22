import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Flag } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface GoalCardProps {
  goal: {
    id: string
    title: string
    description?: string
    category?: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    progress: number
    startDate: Date | string
    dueDate: Date | string
    completedDate?: Date | string | null
  }
  onClick?: () => void
}

export function GoalCard({ goal, onClick }: GoalCardProps) {
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-orange-100 text-orange-700',
      CRITICAL: 'bg-red-100 text-red-700',
    }
    return colors[priority] || colors.MEDIUM
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NOT_STARTED: 'text-gray-600',
      IN_PROGRESS: 'text-blue-600',
      COMPLETED: 'text-green-600',
      CANCELLED: 'text-red-600',
    }
    return colors[status] || colors.NOT_STARTED
  }

  const isOverdue = new Date(goal.dueDate) < new Date() && goal.status !== 'COMPLETED'

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer h-full"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base line-clamp-2">{goal.title}</CardTitle>
            {goal.description && (
              <CardDescription className="text-sm line-clamp-2">
                {goal.description}
              </CardDescription>
            )}
          </div>
          <Badge className={getPriorityColor(goal.priority)}>
            {goal.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goal.category && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flag className="h-4 w-4" />
            {goal.category}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className={`font-medium ${getStatusColor(goal.status)}`}>
              {goal.progress}%
            </span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Due {formatDate(goal.dueDate)}
          </div>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>

        <div className="pt-2 border-t">
          <Badge variant="secondary" className={getStatusColor(goal.status)}>
            {goal.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
