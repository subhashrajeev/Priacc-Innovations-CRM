import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface TrainingCardProps {
  training: {
    id: string
    title: string
    code: string
    description: string
    type: string
    status: string
    trainingMode: string
    startDate: string
    duration: number
    maxParticipants?: number
    _count?: {
      enrollments: number
    }
  }
  onEnroll?: () => void
  onClick?: () => void
}

const typeColors: Record<string, string> = {
  TECHNICAL: 'bg-blue-100 text-blue-800',
  SOFT_SKILLS: 'bg-purple-100 text-purple-800',
  COMPLIANCE: 'bg-orange-100 text-orange-800',
  LEADERSHIP: 'bg-green-100 text-green-800',
  DOMAIN: 'bg-pink-100 text-pink-800',
}

const statusColors: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-800',
  ONGOING: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export function TrainingCard({ training, onEnroll, onClick }: TrainingCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{training.title}</CardTitle>
            <CardDescription className="text-xs mt-1">{training.code}</CardDescription>
          </div>
          <Badge className={statusColors[training.status]}>{training.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {training.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge className={typeColors[training.type]} variant="secondary">
              {training.type.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">{training.trainingMode}</Badge>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(training.startDate)}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{training.duration} hours</span>
          </div>

          {training.maxParticipants && training._count && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {training._count.enrollments}/{training.maxParticipants} enrolled
              </span>
            </div>
          )}
        </div>

        {onEnroll && (
          <Button
            className="w-full mt-4"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEnroll()
            }}
          >
            Enroll Now
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
