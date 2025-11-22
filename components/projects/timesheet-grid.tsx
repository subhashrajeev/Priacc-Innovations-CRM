'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface TimesheetGridProps {
  projectId: string
}

export function TimesheetGrid({ projectId }: TimesheetGridProps) {
  const [timesheets, setTimesheets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTimesheets()
  }, [projectId])

  const fetchTimesheets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/timesheets?projectId=${projectId}&limit=100`)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const totalHours = timesheets.reduce((sum, ts) => sum + ts.hours, 0)
  const billableHours = timesheets.filter((ts) => ts.billable).reduce((sum, ts) => sum + ts.hours, 0)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Hours</CardDescription>
            <CardTitle className="text-3xl">{totalHours.toFixed(1)}h</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Billable Hours</CardDescription>
            <CardTitle className="text-3xl">{billableHours.toFixed(1)}h</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Non-Billable Hours</CardDescription>
            <CardTitle className="text-3xl">{(totalHours - billableHours).toFixed(1)}h</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>
            {timesheets.length} entr{timesheets.length !== 1 ? 'ies' : 'y'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timesheets.length > 0 ? (
            <div className="space-y-2">
              {timesheets.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {entry.employee.firstName} {entry.employee.lastName}
                      </p>
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
                      {formatDate(entry.date)}
                      {entry.taskType && ` • ${entry.taskType}`}
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
            <p className="text-center py-8 text-muted-foreground">
              No timesheet entries for this project
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
