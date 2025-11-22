'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Search, Download, Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDate, formatDateTime, getInitials } from '@/lib/utils'

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  employeeCode: string
  todayAttendance: {
    status: string
    checkInTime: string | null
    checkOutTime: string | null
    workHours: number | null
  } | null
}

export default function TeamAttendancePage() {
  const { data: session } = useSession()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    if (session?.user) {
      fetchTeamAttendance()
    }
  }, [session, selectedDate])

  const fetchTeamAttendance = async () => {
    setLoading(true)
    try {
      // Fetch all employees (in production, this would fetch only team members)
      const employeesResponse = await fetch('/api/employees')
      if (!employeesResponse.ok) {
        toast.error('Failed to fetch team members')
        return
      }

      const employees = await employeesResponse.json()

      // Fetch attendance for each employee
      const teamData = await Promise.all(
        employees.slice(0, 20).map(async (emp: any) => {
          try {
            const month = selectedDate.substring(0, 7) // YYYY-MM
            const response = await fetch(
              `/api/attendance?employeeId=${emp.id}&month=${month}`
            )

            if (response.ok) {
              const attendance = await response.json()
              const todayRecord = attendance.find((a: any) => {
                const aDate = new Date(a.date).toISOString().split('T')[0]
                return aDate === selectedDate
              })

              return {
                id: emp.id,
                firstName: emp.firstName,
                lastName: emp.lastName,
                employeeCode: emp.employeeCode,
                todayAttendance: todayRecord || null,
              }
            }

            return {
              id: emp.id,
              firstName: emp.firstName,
              lastName: emp.lastName,
              employeeCode: emp.employeeCode,
              todayAttendance: null,
            }
          } catch (error) {
            return {
              id: emp.id,
              firstName: emp.firstName,
              lastName: emp.lastName,
              employeeCode: emp.employeeCode,
              todayAttendance: null,
            }
          }
        })
      )

      setTeamMembers(teamData)
    } catch (error) {
      toast.error('Failed to fetch team attendance')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // In production, this would generate an Excel file
    toast.success('Export functionality would generate Excel file here')
  }

  const filteredMembers = teamMembers.filter((member) => {
    const name = `${member.firstName} ${member.lastName}`.toLowerCase()
    const code = member.employeeCode.toLowerCase()
    const query = searchQuery.toLowerCase()
    return name.includes(query) || code.includes(query)
  })

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) {
      return <Badge variant="outline">Not Marked</Badge>
    }

    const variants: Record<string, { variant: any; label: string }> = {
      PRESENT: { variant: 'default', label: 'Present' },
      WORK_FROM_HOME: { variant: 'default', label: 'WFH' },
      ABSENT: { variant: 'destructive', label: 'Absent' },
      HALF_DAY: { variant: 'secondary', label: 'Half Day' },
      ON_LEAVE: { variant: 'secondary', label: 'On Leave' },
      HOLIDAY: { variant: 'outline', label: 'Holiday' },
      WEEKEND: { variant: 'outline', label: 'Weekend' },
    }

    const config = variants[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  const presentCount = filteredMembers.filter(
    (m) =>
      m.todayAttendance?.status === 'PRESENT' ||
      m.todayAttendance?.status === 'WORK_FROM_HOME'
  ).length

  const absentCount = filteredMembers.filter(
    (m) => m.todayAttendance?.status === 'ABSENT'
  ).length

  const notMarkedCount = filteredMembers.filter(
    (m) => !m.todayAttendance
  ).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Attendance</h1>
          <p className="text-muted-foreground">
            Monitor your team&apos;s attendance and working hours
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{presentCount}</div>
            <p className="text-xs text-muted-foreground">
              Team members checked in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absentCount}</div>
            <p className="text-xs text-muted-foreground">
              Team members absent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Marked</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notMarkedCount}</div>
            <p className="text-xs text-muted-foreground">
              Attendance not marked
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or employee code..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[180px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No team members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback className="text-xs">
                              {getInitials(`${member.firstName} ${member.lastName}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.employeeCode}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(member.todayAttendance?.status)}
                      </TableCell>
                      <TableCell>
                        {member.todayAttendance?.checkInTime ? (
                          <span className="text-sm">
                            {new Date(
                              member.todayAttendance.checkInTime
                            ).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.todayAttendance?.checkOutTime ? (
                          <span className="text-sm">
                            {new Date(
                              member.todayAttendance.checkOutTime
                            ).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.todayAttendance?.workHours ? (
                          <span className="font-medium">
                            {member.todayAttendance.workHours.toFixed(1)}h
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
