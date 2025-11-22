'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Clock, Plus, Loader2, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { isManager } from '@/lib/auth'

export default function TimesheetsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [timesheets, setTimesheets] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(getWeekRange(new Date()))

  const canManage = session?.user?.role ? isManager(session.user.role) : false

  const [formData, setFormData] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    taskType: '',
    billable: true,
  })

  useEffect(() => {
    fetchTimesheets()
    fetchProjects()
  }, [selectedWeek])

  function getWeekRange(date: Date) {
    const start = new Date(date)
    start.setDate(start.getDate() - start.getDay())
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }

  const fetchTimesheets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/timesheets?startDate=${selectedWeek.start.toISOString()}&endDate=${selectedWeek.end.toISOString()}&limit=100`
      )
      const result = await response.json()

      if (result.success) {
        setTimesheets(result.data)
      } else {
        toast.error('Failed to fetch timesheets')
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error)
      toast.error('An error occurred while fetching timesheets')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects?status=ACTIVE&limit=100')
      const result = await response.json()
      if (result.success) {
        setProjects(result.data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.projectId || !formData.date || !formData.hours) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          hours: parseFloat(formData.hours),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Timesheet entry created successfully')
        setIsDialogOpen(false)
        resetForm()
        fetchTimesheets()
      } else {
        toast.error(result.error || 'Failed to create timesheet entry')
      }
    } catch (error) {
      console.error('Error creating timesheet:', error)
      toast.error('An error occurred while creating timesheet entry')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      projectId: '',
      date: new Date().toISOString().split('T')[0],
      hours: '',
      description: '',
      taskType: '',
      billable: true,
    })
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const changeWeek = (direction: number) => {
    const newDate = new Date(selectedWeek.start)
    newDate.setDate(newDate.getDate() + direction * 7)
    setSelectedWeek(getWeekRange(newDate))
  }

  const totalHours = timesheets.reduce((sum, ts) => sum + ts.hours, 0)
  const billableHours = timesheets.filter((ts) => ts.billable).reduce((sum, ts) => sum + ts.hours, 0)
  const approvedHours = timesheets.filter((ts) => ts.approved).reduce((sum, ts) => sum + ts.hours, 0)

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
          <p className="text-muted-foreground">
            Track your time across projects
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Time
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Log Time Entry</DialogTitle>
                <DialogDescription>
                  Add a new timesheet entry for a project
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project">
                    Project <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.projectId} onValueChange={(value) => handleChange('projectId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} ({project.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours">
                    Hours <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.hours}
                    onChange={(e) => handleChange('hours', e.target.value)}
                    placeholder="8.0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskType">Task Type</Label>
                  <Select value={formData.taskType} onValueChange={(value) => handleChange('taskType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Testing">Testing</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Documentation">Documentation</SelectItem>
                      <SelectItem value="Review">Review</SelectItem>
                      <SelectItem value="Planning">Planning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="What did you work on?"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="billable"
                    checked={formData.billable}
                    onChange={(e) => handleChange('billable', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="billable" className="cursor-pointer">
                    Billable
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Entry'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billableHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {totalHours > 0 ? ((billableHours / totalHours) * 100).toFixed(0) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Hours</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {totalHours > 0 ? ((approvedHours / totalHours) * 100).toFixed(0) : 0}% approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entries</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timesheets.length}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {formatDate(selectedWeek.start)} - {formatDate(selectedWeek.end)}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => changeWeek(-1)}>
                Previous Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedWeek(getWeekRange(new Date()))}>
                This Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => changeWeek(1)}>
                Next Week
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : timesheets.length > 0 ? (
            <div className="space-y-2">
              {timesheets.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.project.name}</p>
                      {entry.billable && (
                        <Badge variant="outline" className="text-xs">
                          Billable
                        </Badge>
                      )}
                      {entry.approved ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(entry.date)} • {entry.taskType || 'General'}
                      {entry.description && ` • ${entry.description}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{entry.hours}h</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.approved ? 'Approved' : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No timesheet entries for this week
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
