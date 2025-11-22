'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckInWidget } from '@/components/attendance/check-in-widget'
import { AttendanceCalendar } from '@/components/attendance/attendance-calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  AlertCircle,
  FileEdit,
} from 'lucide-react'

interface AttendanceStats {
  totalDays: number
  workingDays: number
  present: number
  absent: number
  halfDays: number
  onLeave: number
  holidays: number
  weekends: number
  totalWorkHours: number
  totalOvertimeHours: number
  attendancePercentage: number
  avgCheckInTime: string | null
  avgCheckOutTime: string | null
}

export default function AttendancePage() {
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(false)
  const [showRegularizeDialog, setShowRegularizeDialog] = useState(false)
  const [regularizeForm, setRegularizeForm] = useState({
    date: '',
    checkInTime: '',
    checkOutTime: '',
    reason: '',
  })

  useEffect(() => {
    fetchStats()
  }, [selectedMonth])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/attendance/stats?month=${selectedMonth}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegularize = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!regularizeForm.date || !regularizeForm.reason) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const response = await fetch('/api/attendance/regularize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regularizeForm),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Regularization request submitted successfully')
        setShowRegularizeDialog(false)
        setRegularizeForm({
          date: '',
          checkInTime: '',
          checkOutTime: '',
          reason: '',
        })
        fetchStats()
      } else {
        toast.error(data.message || 'Failed to submit request')
      }
    } catch (error) {
      toast.error('Failed to submit regularization request')
    }
  }

  const generateMonthOptions = () => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      })
      options.push({ value, label })
    }
    return options
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground">
            Track your attendance and working hours
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {generateMonthOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowRegularizeDialog(true)}
          >
            <FileEdit className="mr-2 h-4 w-4" />
            Regularize
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.present || 0}</div>
            <p className="text-xs text-muted-foreground">
              Out of {stats?.workingDays || 0} working days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.absent || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.halfDays || 0} half days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalWorkHours.toFixed(1) || 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalOvertimeHours.toFixed(1) || 0}h overtime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Rate
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.attendancePercentage || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.onLeave || 0} days on leave
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CheckInWidget />

          {stats && (stats.avgCheckInTime || stats.avgCheckOutTime) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Average Timings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.avgCheckInTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg Check-in:</span>
                    <span className="font-medium">{stats.avgCheckInTime}</span>
                  </div>
                )}
                {stats.avgCheckOutTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg Check-out:</span>
                    <span className="font-medium">{stats.avgCheckOutTime}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <AttendanceCalendar />
        </div>
      </div>

      <Dialog open={showRegularizeDialog} onOpenChange={setShowRegularizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regularize Attendance</DialogTitle>
            <DialogDescription>
              Request to regularize your attendance for a specific date
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegularize} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={regularizeForm.date}
                onChange={(e) =>
                  setRegularizeForm({ ...regularizeForm, date: e.target.value })
                }
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInTime">Check-in Time</Label>
                <Input
                  id="checkInTime"
                  type="time"
                  value={regularizeForm.checkInTime}
                  onChange={(e) =>
                    setRegularizeForm({
                      ...regularizeForm,
                      checkInTime: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOutTime">Check-out Time</Label>
                <Input
                  id="checkOutTime"
                  type="time"
                  value={regularizeForm.checkOutTime}
                  onChange={(e) =>
                    setRegularizeForm({
                      ...regularizeForm,
                      checkOutTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <textarea
                id="reason"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Explain why you need to regularize this attendance"
                value={regularizeForm.reason}
                onChange={(e) =>
                  setRegularizeForm({ ...regularizeForm, reason: e.target.value })
                }
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegularizeDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Submit Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
