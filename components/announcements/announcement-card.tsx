import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface AnnouncementCardProps {
  announcement: {
    id: string
    title: string
    content: string
    priority: string
    publishedAt: string
    expiresAt: string | null
    publisher: {
      firstName: string
      lastName: string
      employeeCode: string
    }
  }
  onClick?: () => void
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

const priorityIcons: Record<string, string> = {
  LOW: '📢',
  MEDIUM: '📣',
  HIGH: '⚠️',
  URGENT: '🚨',
}

export function AnnouncementCard({ announcement, onClick }: AnnouncementCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{priorityIcons[announcement.priority]}</span>
              <Badge className={priorityColors[announcement.priority]}>
                {announcement.priority}
              </Badge>
            </div>
            <CardTitle className="text-xl">{announcement.title}</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>
                    {announcement.publisher.firstName} {announcement.publisher.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(announcement.publishedAt)}</span>
                </div>
                {announcement.expiresAt && (
                  <div className="text-orange-600">
                    Expires: {formatDate(announcement.expiresAt)}
                  </div>
                )}
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-3">{announcement.content}</p>
      </CardContent>
    </Card>
  )
}
