'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Star, Calendar, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { isHR, isManager } from '@/lib/auth'

export default function ReviewsPage() {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<any>(null)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/performance')
      const data = await response.json()
      if (data.success) {
        setReviews(data.data)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRatingBadge = (rating: string) => {
    const variants: any = {
      OUTSTANDING: 'default',
      EXCEEDS_EXPECTATIONS: 'default',
      MEETS_EXPECTATIONS: 'secondary',
      NEEDS_IMPROVEMENT: 'destructive',
      UNSATISFACTORY: 'destructive',
    }
    return (
      <Badge variant={variants[rating] || 'secondary'}>
        {rating?.replace(/_/g, ' ')}
      </Badge>
    )
  }

  const myReviews = reviews.filter((r) => r.employee.id === session?.user?.employeeId)
  const teamReviews = reviews.filter((r) => r.employee.id !== session?.user?.employeeId)

  const ReviewCard = ({ review }: { review: any }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedReview(review)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {review.employee.firstName} {review.employee.lastName}
            </CardTitle>
            <CardDescription>
              {review.employee.designation?.title} • {review.employee.department?.name}
            </CardDescription>
          </div>
          {review.overallRating && getRatingBadge(review.overallRating)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {review.reviewPeriod}
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {review.reviewCycle}
          </div>
        </div>

        {review.isCompleted ? (
          <Badge variant="default" className="text-green-600">
            Completed
          </Badge>
        ) : (
          <Badge variant="secondary">
            Pending
          </Badge>
        )}

        {review.goalsAchieved !== null && review.totalGoals !== null && (
          <div className="text-sm">
            <span className="font-medium">Goals:</span> {review.goalsAchieved}/{review.totalGoals} achieved
          </div>
        )}
      </CardContent>
    </Card>
  )

  const ReviewDetails = ({ review }: { review: any }) => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {review.employee.firstName} {review.employee.lastName}
          </h2>
          <p className="text-muted-foreground">
            {review.employee.designation?.title} • {review.employee.department?.name}
          </p>
        </div>
        {review.overallRating && getRatingBadge(review.overallRating)}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Review Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{review.reviewPeriod}</p>
            <p className="text-sm text-muted-foreground">{review.reviewCycle}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Goals Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            {review.goalsAchieved !== null && review.totalGoals !== null ? (
              <>
                <p className="font-semibold">
                  {review.goalsAchieved}/{review.totalGoals}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Math.round((review.goalsAchieved / review.totalGoals) * 100)}% completed
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not specified</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={review.isCompleted ? 'default' : 'secondary'}>
              {review.isCompleted ? 'Completed' : 'In Progress'}
            </Badge>
            {review.completedAt && (
              <p className="text-sm text-muted-foreground mt-2">
                {formatDate(review.completedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Competency Ratings</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { label: 'Technical Skills', value: review.technicalSkills },
            { label: 'Communication', value: review.communication },
            { label: 'Teamwork', value: review.teamwork },
            { label: 'Leadership', value: review.leadership },
            { label: 'Initiative', value: review.initiative },
            { label: 'Problem Solving', value: review.problemSolving },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">{item.label}</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < (item.value || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {review.strengths && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Strengths</h3>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm">{review.strengths}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {review.areasOfImprovement && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Areas of Improvement</h3>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm">{review.areasOfImprovement}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {review.reviewerComments && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Reviewer Comments</h3>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm">{review.reviewerComments}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {review.employeeComments && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Employee Comments</h3>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm">{review.employeeComments}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Reviews</h1>
          <p className="text-muted-foreground">View and manage performance reviews</p>
        </div>
      </div>

      <Tabs defaultValue="my" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my">My Reviews ({myReviews.length})</TabsTrigger>
          {(session?.user?.role && (isHR(session.user.role) || isManager(session.user.role))) && (
            <TabsTrigger value="team">Team Reviews ({teamReviews.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my" className="space-y-4">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : myReviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your performance reviews will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </TabsContent>

        {(session?.user?.role && (isHR(session.user.role) || isManager(session.user.role))) && (
          <TabsContent value="team" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {selectedReview && (
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Performance Review Details</DialogTitle>
            </DialogHeader>
            <ReviewDetails review={selectedReview} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
