'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ReportBuilder, ReportType } from '@/components/analytics/report-builder'
import { Download, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ReportConfig {
  reportType: ReportType
  dateFrom: Date | null
  dateTo: Date | null
  department?: string
  employee?: string
  format?: 'pdf' | 'excel' | 'csv'
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])

  useEffect(() => {
    fetchDepartments()
    fetchEmployees()
  }, [])

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments')
      if (res.ok) {
        const data = await res.json()
        setDepartments(
          (data.data || []).map((d: any) => ({ id: d.id, name: d.name }))
        )
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees')
      if (res.ok) {
        const data = await res.json()
        setEmployees(
          (data.data || []).map((e: any) => ({
            id: e.id,
            name: `${e.firstName} ${e.lastName}`,
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleGenerateReport = async (config: ReportConfig) => {
    if (!config.dateFrom || !config.dateTo) {
      toast.error('Please select date range')
      return
    }

    try {
      setLoading(true)
      setReportData(null)

      const params = new URLSearchParams({
        type: config.reportType,
        startDate: config.dateFrom.toISOString(),
        endDate: config.dateTo.toISOString(),
        ...(config.department && { departmentId: config.department }),
        ...(config.employee && { employeeId: config.employee }),
      })

      const res = await fetch(`/api/analytics/reports?${params}`)
      if (res.ok) {
        const result = await res.json()
        setReportData(result.data)
        toast.success('Report generated successfully')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('An error occurred while generating the report')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!reportData) {
      toast.error('No report data to export')
      return
    }

    if (format === 'csv') {
      exportToCSV()
    } else {
      toast.info(`Export to ${format.toUpperCase()} coming soon`)
    }
  }

  const exportToCSV = () => {
    if (!reportData || !reportData.records || reportData.records.length === 0) {
      toast.error('No data to export')
      return
    }

    // Convert records to CSV
    const headers = Object.keys(reportData.records[0])
    const csvContent = [
      headers.join(','),
      ...reportData.records.map((record: any) =>
        headers
          .map((header) => {
            const value = getNestedValue(record, header)
            return typeof value === 'object' ? JSON.stringify(value) : value
          })
          .join(',')
      ),
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportData.type}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success('Report exported successfully')
  }

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  const renderReportPreview = () => {
    if (!reportData) return null

    const { type, period, summary, records } = reportData

    return (
      <div className="space-y-6">
        {/* Report Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="capitalize">
                  {type.replace('-', ' ')} Report
                </CardTitle>
                <CardDescription>
                  Period: {format(new Date(period.startDate), 'MMM dd, yyyy')} -{' '}
                  {format(new Date(period.endDate), 'MMM dd, yyyy')}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExportReport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" onClick={() => handleExportReport('excel')}>
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" onClick={() => handleExportReport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Statistics */}
            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(summary).map(([key, value]) => {
                if (typeof value === 'object') return null
                return (
                  <div key={key} className="space-y-1">
                    <p className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-2xl font-bold">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Report Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>{records.length} records found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {type === 'attendance' && (
                      <>
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Hours</TableHead>
                      </>
                    )}
                    {type === 'leave' && (
                      <>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                      </>
                    )}
                    {type === 'payroll' && (
                      <>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                      </>
                    )}
                    {type === 'performance' && (
                      <>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Cycle</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Completed</TableHead>
                      </>
                    )}
                    {type === 'projects' && (
                      <>
                        <TableHead>Project</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Actual Cost</TableHead>
                        <TableHead>Tasks</TableHead>
                      </>
                    )}
                    {type === 'expenses' && (
                      <>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Billable</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.slice(0, 100).map((record: any, index: number) => (
                    <TableRow key={index}>
                      {type === 'attendance' && (
                        <>
                          <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{record.employee.name}</TableCell>
                          <TableCell>{record.employee.department}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'PRESENT' ? 'default' : 'secondary'}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '-'}
                          </TableCell>
                          <TableCell>
                            {record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '-'}
                          </TableCell>
                          <TableCell>{record.workHours?.toFixed(2) || '-'}</TableCell>
                        </>
                      )}
                      {type === 'leave' && (
                        <>
                          <TableCell>{record.employee.name}</TableCell>
                          <TableCell>{record.employee.department}</TableCell>
                          <TableCell>{record.leaveType}</TableCell>
                          <TableCell>{format(new Date(record.startDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{format(new Date(record.endDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{record.totalDays}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.status === 'APPROVED'
                                  ? 'default'
                                  : record.status === 'REJECTED'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      {type === 'payroll' && (
                        <>
                          <TableCell>{record.employee.name}</TableCell>
                          <TableCell>{record.employee.department}</TableCell>
                          <TableCell>{record.month}</TableCell>
                          <TableCell>{record.year}</TableCell>
                          <TableCell>₹{record.grossEarnings.toLocaleString()}</TableCell>
                          <TableCell>₹{record.totalDeductions.toLocaleString()}</TableCell>
                          <TableCell>₹{record.netPay.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === 'PAID' ? 'default' : 'secondary'}>
                              {record.status}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      {type === 'performance' && (
                        <>
                          <TableCell>{record.employee.name}</TableCell>
                          <TableCell>{record.employee.department}</TableCell>
                          <TableCell>{record.reviewCycle}</TableCell>
                          <TableCell>{record.reviewPeriod}</TableCell>
                          <TableCell>
                            <Badge>{record.overallRating || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>
                            {record.completedAt
                              ? format(new Date(record.completedAt), 'MMM dd, yyyy')
                              : '-'}
                          </TableCell>
                        </>
                      )}
                      {type === 'projects' && (
                        <>
                          <TableCell>{record.name}</TableCell>
                          <TableCell>{record.client}</TableCell>
                          <TableCell>
                            <Badge>{record.status}</Badge>
                          </TableCell>
                          <TableCell>₹{record.estimatedBudget?.toLocaleString() || 0}</TableCell>
                          <TableCell>₹{record.actualCost?.toLocaleString() || 0}</TableCell>
                          <TableCell>{record.taskCount}</TableCell>
                        </>
                      )}
                      {type === 'expenses' && (
                        <>
                          <TableCell>{record.employee.name}</TableCell>
                          <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{record.expenseType}</TableCell>
                          <TableCell>
                            {record.currency} {record.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.status === 'APPROVED'
                                  ? 'default'
                                  : record.status === 'REJECTED'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.billableToClient ? 'Yes' : 'No'}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {records.length > 100 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing first 100 of {records.length} records. Export to see all data.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Generation</h1>
        <p className="text-muted-foreground">
          Generate and export custom reports for various modules
        </p>
      </div>

      {/* Report Builder */}
      <ReportBuilder
        onGenerate={handleGenerateReport}
        loading={loading}
        departments={departments}
        employees={employees}
      />

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Generating report...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Preview */}
      {!loading && reportData && renderReportPreview()}

      {/* Empty State */}
      {!loading && !reportData && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No Report Generated</h3>
                <p className="text-sm text-muted-foreground">
                  Configure parameters above and click "Generate Report" to view data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
