'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Attendance {
  id: string
  date: string
  status: string
  checkInTime: string | null
  checkOutTime: string | null
  workHours: number | null
}

interface AttendanceCalendarProps {
  employeeId?: string
}

export function AttendanceCalendar({ employeeId }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAttendance()
  }, [currentDate, employeeId])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      const url = employeeId
        ? `/api/attendance?month=${month}&employeeId=${employeeId}`
        : `/api/attendance?month=${month}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAttendance(data)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getAttendanceForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    date.setHours(0, 0, 0, 0)

    return attendance.find((a) => {
      const aDate = new Date(a.date)
      aDate.setHours(0, 0, 0, 0)
      return aDate.getTime() === date.getTime()
    })
  }

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 hover:bg-gray-200'

    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 hover:bg-green-200 border-green-300'
      case 'WORK_FROM_HOME':
        return 'bg-blue-100 hover:bg-blue-200 border-blue-300'
      case 'ABSENT':
        return 'bg-red-100 hover:bg-red-200 border-red-300'
      case 'HALF_DAY':
        return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300'
      case 'ON_LEAVE':
        return 'bg-purple-100 hover:bg-purple-200 border-purple-300'
      case 'HOLIDAY':
        return 'bg-orange-100 hover:bg-orange-200 border-orange-300'
      case 'WEEKEND':
        return 'bg-gray-200 hover:bg-gray-300 border-gray-400'
      default:
        return 'bg-gray-100 hover:bg-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PRESENT: 'P',
      WORK_FROM_HOME: 'WFH',
      ABSENT: 'A',
      HALF_DAY: 'HD',
      ON_LEAVE: 'L',
      HOLIDAY: 'H',
      WEEKEND: 'W',
    }
    return variants[status] || ''
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const isWeekend = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dayOfWeek = date.getDay()
    return dayOfWeek === 0 || dayOfWeek === 6
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDay }, (_, i) => i)

  const monthYear = currentDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Attendance Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[180px] text-center font-medium">{monthYear}</span>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {blanks.map((blank) => (
                <div key={`blank-${blank}`} className="aspect-square" />
              ))}

              {days.map((day) => {
                const record = getAttendanceForDate(day)
                const status = record?.status || (isWeekend(day) ? 'WEEKEND' : undefined)

                return (
                  <div
                    key={day}
                    className={cn(
                      'aspect-square border rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer transition-colors',
                      getStatusColor(status),
                      isToday(day) && 'ring-2 ring-primary'
                    )}
                    title={
                      record
                        ? `${status} - ${record.workHours ? `${record.workHours.toFixed(1)}h` : 'No hours'}`
                        : isWeekend(day)
                        ? 'Weekend'
                        : 'No record'
                    }
                  >
                    <span className="text-sm font-medium">{day}</span>
                    {status && (
                      <span className="text-xs font-semibold mt-1">
                        {getStatusBadge(status)}
                      </span>
                    )}
                    {record?.workHours && (
                      <span className="text-xs text-muted-foreground">
                        {record.workHours.toFixed(1)}h
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
                <span>WFH</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
                <span>Half Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300" />
                <span>Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
                <span>Holiday</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-200 border border-gray-400" />
                <span>Weekend</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
