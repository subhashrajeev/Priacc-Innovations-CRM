'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Star } from 'lucide-react'
import { toast } from 'sonner'

interface ReviewFormProps {
  employeeId: string
  employeeName: string
  onSubmit?: (data: any) => void
  onCancel?: () => void
  initialData?: any
}

export function ReviewForm({
  employeeId,
  employeeName,
  onSubmit,
  onCancel,
  initialData
}: ReviewFormProps) {
  const [formData, setFormData] = useState({
    employeeId,
    reviewCycle: initialData?.reviewCycle || 'QUARTERLY',
    reviewPeriod: initialData?.reviewPeriod || '',
    overallRating: initialData?.overallRating || '',
    technicalSkills: initialData?.technicalSkills || 0,
    communication: initialData?.communication || 0,
    teamwork: initialData?.teamwork || 0,
    leadership: initialData?.leadership || 0,
    initiative: initialData?.initiative || 0,
    problemSolving: initialData?.problemSolving || 0,
    strengths: initialData?.strengths || '',
    areasOfImprovement: initialData?.areasOfImprovement || '',
    reviewerComments: initialData?.reviewerComments || '',
    goalsAchieved: initialData?.goalsAchieved || 0,
    totalGoals: initialData?.totalGoals || 0,
    isCompleted: initialData?.isCompleted || false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (onSubmit) {
      onSubmit(formData)
    } else {
      try {
        const response = await fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (data.success) {
          toast.success('Performance review created successfully')
        } else {
          toast.error(data.error || 'Failed to create performance review')
        }
      } catch (error) {
        toast.error('Failed to create performance review')
      }
    }
  }

  const RatingInput = ({
    label,
    value,
    onChange
  }: {
    label: string
    value: number
    onChange: (value: number) => void
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 cursor-pointer transition-colors ${
                rating <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Review</CardTitle>
          <CardDescription>Review for {employeeName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reviewCycle">Review Cycle *</Label>
              <Select
                value={formData.reviewCycle}
                onValueChange={(value) => setFormData({ ...formData, reviewCycle: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="HALF_YEARLY">Half Yearly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewPeriod">Review Period *</Label>
              <Input
                id="reviewPeriod"
                value={formData.reviewPeriod}
                onChange={(e) => setFormData({ ...formData, reviewPeriod: e.target.value })}
                placeholder="e.g., Q1 2025"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="overallRating">Overall Rating *</Label>
            <Select
              value={formData.overallRating}
              onValueChange={(value) => setFormData({ ...formData, overallRating: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OUTSTANDING">Outstanding</SelectItem>
                <SelectItem value="EXCEEDS_EXPECTATIONS">Exceeds Expectations</SelectItem>
                <SelectItem value="MEETS_EXPECTATIONS">Meets Expectations</SelectItem>
                <SelectItem value="NEEDS_IMPROVEMENT">Needs Improvement</SelectItem>
                <SelectItem value="UNSATISFACTORY">Unsatisfactory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Competency Ratings */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Competency Ratings</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <RatingInput
                label="Technical Skills"
                value={formData.technicalSkills}
                onChange={(value) => setFormData({ ...formData, technicalSkills: value })}
              />
              <RatingInput
                label="Communication"
                value={formData.communication}
                onChange={(value) => setFormData({ ...formData, communication: value })}
              />
              <RatingInput
                label="Teamwork"
                value={formData.teamwork}
                onChange={(value) => setFormData({ ...formData, teamwork: value })}
              />
              <RatingInput
                label="Leadership"
                value={formData.leadership}
                onChange={(value) => setFormData({ ...formData, leadership: value })}
              />
              <RatingInput
                label="Initiative"
                value={formData.initiative}
                onChange={(value) => setFormData({ ...formData, initiative: value })}
              />
              <RatingInput
                label="Problem Solving"
                value={formData.problemSolving}
                onChange={(value) => setFormData({ ...formData, problemSolving: value })}
              />
            </div>
          </div>

          <Separator />

          {/* Goals */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="goalsAchieved">Goals Achieved</Label>
              <Input
                id="goalsAchieved"
                type="number"
                min="0"
                value={formData.goalsAchieved}
                onChange={(e) => setFormData({ ...formData, goalsAchieved: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalGoals">Total Goals</Label>
              <Input
                id="totalGoals"
                type="number"
                min="0"
                value={formData.totalGoals}
                onChange={(e) => setFormData({ ...formData, totalGoals: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <Separator />

          {/* Feedback */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="strengths">Strengths</Label>
              <Textarea
                id="strengths"
                value={formData.strengths}
                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                rows={4}
                placeholder="What are the employee's key strengths?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="areasOfImprovement">Areas of Improvement</Label>
              <Textarea
                id="areasOfImprovement"
                value={formData.areasOfImprovement}
                onChange={(e) => setFormData({ ...formData, areasOfImprovement: e.target.value })}
                rows={4}
                placeholder="What areas need improvement?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewerComments">Reviewer Comments</Label>
              <Textarea
                id="reviewerComments"
                value={formData.reviewerComments}
                onChange={(e) => setFormData({ ...formData, reviewerComments: e.target.value })}
                rows={4}
                placeholder="Additional comments and recommendations"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCompleted"
              checked={formData.isCompleted}
              onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="isCompleted" className="cursor-pointer">
              Mark as completed
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">
          {initialData ? 'Update Review' : 'Create Review'}
        </Button>
      </div>
    </form>
  )
}
