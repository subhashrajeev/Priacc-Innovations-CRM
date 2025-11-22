'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { getInitials, formatDate, cn } from '@/lib/utils'

interface Leave {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  status: string
  employee: {
    firstName: string
    lastName: string
    employeeCode: string
  }
}

interface Holiday {
  id: string
  name: string
  date: string
  isOptional: boolean
}

const leaveTypeColors: Record<string, string> = {
  CASUAL: 'bg-blue-500',
  SICK: 'bg-red-500',
  PRIVILEGE: 'bg-purple-500',
  EARNED: 'bg-green-500',
  MATERNITY: 'bg-pink-500',
  PATERNITY: 'bg-indigo-500',
  COMPENSATORY: 'bg-yellow-500',
  LOSS_OF_PAY: 'bg-gray-500',
  BEREAVEMENT: 'bg-slate-500',
  MARRIAGE: 'bg-orange-500',
  SABBATICAL: 'bg-teal-500',
}

const leaveTypeNames: Record<string, string> = {
  CASUAL: 'CL',
  SICK: 'SL',
  PRIVILEGE: 'PL',
  EARNED: 'EL',
  MATERNITY: 'ML',
  PATERNITY: 'PL',
  COMPENSATORY: 'CO',
  LOSS_OF_PAY: 'LOP',
  BEREAVEMENT: 'BL',
  MARRIAGE: 'MRL',
  SABBATICAL: 'SAB',
}

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCalendarData()
  }, [currentDate])

  const fetchCalendarData = async () => {
    setLoading(true)
    try {
      const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

      const [leavesRes, holidaysRes] = await Promise.all([
        fetch(`/api/leave/calendar?month=${month}`),
        fetch(`/api/holidays?year=${currentDate.getFullYear()}`),
      ])

      if (leavesRes.ok) {
        const data = await leavesRes.json()
        setLeaves(data.leaves || [])
      }

      if (holidaysRes.ok) {
        const data = await holidaysRes.json()
        setHolidays(data)
      }
    } catch (error) {
      toast.error('Failed to fetch calendar data')
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

  const getLeavesForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dateStr = date.toISOString().split('T')[0]

    return leaves.filter((leave) => {
      const start = new Date(leave.startDate).toISOString().split('T')[0]
      const end = new Date(leave.endDate).toISOString().split('T')[0]
      return dateStr >= start && dateStr <= end && leave.status === 'APPROVED'
    })
  }

  const getHolidayForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dateStr = date.toISOString().split('T')[0]

    return holidays.find((holiday) => {
      const holidayDate = new Date(holiday.date).toISOString().split('T')[0]
      return holidayDate === dateStr
    })
  }

  const isWeekend = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dayOfWeek = date.getDay()
    return dayOfWeek === 0 || dayOfWeek === 6
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Leave Calendar</h1>
          <p className="text-muted-foreground">
            View team members&apos; leaves and holidays
          </p>
        </div>
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

      <Card>
        <CardContent className="pt-6">
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
                  <div key={`blank-${blank}`} className="min-h-[120px]" />
                ))}

                {days.map((day) => {
                  const dayLeaves = getLeavesForDate(day)
                  const holiday = getHolidayForDate(day)
                  const weekend = isWeekend(day)
                  const today = isToday(day)

                  return (
                    <div
                      key={day}
                      className={cn(
                        'min-h-[120px] border rounded-lg p-2 transition-colors',
                        weekend && 'bg-gray-50',
                        holiday && 'bg-orange-50 border-orange-200',
                        today && 'ring-2 ring-primary'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={cn(
                            'text-sm font-medium',
                            today && 'bg-primary text-primary-foreground rounded-full px-2 py-0.5'
                          )}
                        >
                          {day}
                        </span>
                      </div>

                      {holiday && (
                        <div className="mb-2">
                          <Badge
                            variant="outline"
                            className="text-xs bg-orange-100 border-orange-300"
                          >
                            {holiday.name}
                          </Badge>
                        </div>
                      )}

                      <div className="space-y-1">
                        {dayLeaves.slice(0, 3).map((leave) => {
                          const employeeName = `${leave.employee.firstName} ${leave.employee.lastName}`
                          const color =
                            leaveTypeColors[leave.leaveType] || 'bg-gray-500'

                          return (
                            <div
                              key={leave.id}
                              className="flex items-center gap-1 text-xs"
                              title={`${employeeName} - ${leave.leaveType}`}
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarImage src="" />
                                <AvatarFallback className="text-[8px]">
                                  {getInitials(employeeName)}
                                </AvatarFallback>
                              </Avatar>
                              <Badge
                                className={cn('text-[10px] px-1.5 py-0', color)}
                              >
                                {leaveTypeNames[leave.leaveType]}
                              </Badge>
                            </div>
                          )
                        })}
                        {dayLeaves.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{dayLeaves.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300" />
                  <span>Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-50 border" />
                  <span>Weekend</span>
                </div>
                {Object.entries(leaveTypeColors).slice(0, 5).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={cn('w-4 h-4 rounded', color)} />
                    <span>{type}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
