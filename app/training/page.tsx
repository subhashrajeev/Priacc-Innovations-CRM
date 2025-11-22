'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Search, Plus, Calendar, Clock, Users, BookOpen } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Training {
  id: string
  title: string
  code: string
  description: string
  type: string
  status: string
  trainer: string
  trainingMode: string
  location: string
  startDate: string
  endDate: string
  duration: number
  maxParticipants: number
  _count: {
    enrollments: number
  }
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

export default function TrainingPage() {
  const router = useRouter()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTrainings()
  }, [])

  const fetchTrainings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/training')
      if (response.ok) {
        const data = await response.json()
        setTrainings(data.data || [])
      } else {
        toast.error('Failed to fetch trainings')
      }
    } catch (error) {
      toast.error('Failed to fetch trainings')
    } finally {
      setLoading(false)
    }
  }

  const filteredTrainings = trainings.filter((training) => {
    const matchesType = typeFilter === 'all' || training.type === typeFilter
    const matchesStatus = statusFilter === 'all' || training.status === statusFilter
    const matchesSearch =
      searchQuery === '' ||
      training.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      training.code.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesType && matchesStatus && matchesSearch
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Catalog</h1>
          <p className="text-muted-foreground">
            Browse and enroll in available training programs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/training/my-trainings')}>
            <BookOpen className="mr-2 h-4 w-4" />
            My Trainings
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Available Trainings</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search trainings..."
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="TECHNICAL">Technical</SelectItem>
                  <SelectItem value="SOFT_SKILLS">Soft Skills</SelectItem>
                  <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                  <SelectItem value="LEADERSHIP">Leadership</SelectItem>
                  <SelectItem value="DOMAIN">Domain</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full text-center py-8">Loading...</div>
            ) : filteredTrainings.length === 0 ? (
              <div className="col-span-full text-center py-8">No trainings found</div>
            ) : (
              filteredTrainings.map((training) => (
                <Card
                  key={training.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/training/${training.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{training.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {training.code}
                        </CardDescription>
                      </div>
                      <Badge className={statusColors[training.status]}>
                        {training.status}
                      </Badge>
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

                      {training.maxParticipants && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {training._count.enrollments}/{training.maxParticipants} enrolled
                          </span>
                        </div>
                      )}
                    </div>

                    <Button className="w-full mt-4" size="sm">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
