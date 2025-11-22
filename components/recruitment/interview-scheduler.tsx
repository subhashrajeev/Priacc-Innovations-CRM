'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface InterviewSchedulerProps {
  applicationId: string
  candidateName: string
  jobTitle: string
  onScheduled?: () => void
  trigger?: React.ReactNode
}

export function InterviewScheduler({
  applicationId,
  candidateName,
  jobTitle,
  onScheduled,
  trigger
}: InterviewSchedulerProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: 'PHONE_SCREENING',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    location: '',
    meetingLink: '',
    interviewers: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/recruitment/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          ...formData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Interview scheduled successfully')
        setOpen(false)
        setFormData({
          type: 'PHONE_SCREENING',
          scheduledDate: '',
          scheduledTime: '',
          duration: 60,
          location: '',
          meetingLink: '',
          interviewers: '',
        })
        if (onScheduled) onScheduled()
      } else {
        toast.error(data.error || 'Failed to schedule interview')
      }
    } catch (error) {
      toast.error('Failed to schedule interview')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Interview
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Schedule an interview with {candidateName} for {jobTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Interview Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHONE_SCREENING">Phone Screening</SelectItem>
                  <SelectItem value="TECHNICAL">Technical Interview</SelectItem>
                  <SelectItem value="HR">HR Interview</SelectItem>
                  <SelectItem value="MANAGERIAL">Managerial Interview</SelectItem>
                  <SelectItem value="FINAL">Final Interview</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Time *</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Select
                value={formData.duration.toString()}
                onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Office address or 'Virtual'"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewers">Interviewer IDs *</Label>
              <Input
                id="interviewers"
                value={formData.interviewers}
                onChange={(e) => setFormData({ ...formData, interviewers: e.target.value })}
                placeholder="Comma-separated employee IDs"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter employee IDs separated by commas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Schedule Interview</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
