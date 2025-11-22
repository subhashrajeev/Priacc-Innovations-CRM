'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Download, FileText, BarChart3, TrendingUp } from 'lucide-react'

export default function AttendanceReportsPage() {
  const [reportType, setReportType] = useState('monthly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select date range')
      return
    }

    setLoading(true)
    try {
      // In production, this would generate the actual report
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('Report generated successfully')
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format: 'excel' | 'pdf') => {
    toast.success(`Export to ${format.toUpperCase()} functionality would be implemented here`)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Reports</h1>
          <p className="text-muted-foreground">
            Generate and download attendance reports
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="reportType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Summary</SelectItem>
                  <SelectItem value="daily">Daily Report</SelectItem>
                  <SelectItem value="overtime">Overtime Report</SelectItem>
                  <SelectItem value="late">Late Coming Report</SelectItem>
                  <SelectItem value="absent">Absenteeism Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee (Optional)</Label>
              <Input
                id="employeeId"
                placeholder="Enter employee code or leave empty for all"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>Generating...</>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 space-y-4">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">No Report Generated</p>
                <p className="text-sm text-muted-foreground">
                  Configure the report settings and click Generate Report
                </p>
              </div>

              <div className="flex justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleExport('excel')}
                  disabled={!startDate || !endDate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('pdf')}
                  disabled={!startDate || !endDate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quick Reports
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  const now = new Date()
                  setStartDate(
                    new Date(now.getFullYear(), now.getMonth(), 1)
                      .toISOString()
                      .split('T')[0]
                  )
                  setEndDate(now.toISOString().split('T')[0])
                  setReportType('monthly')
                }}
              >
                Current Month
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  const now = new Date()
                  const lastMonth = new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    1
                  )
                  setStartDate(lastMonth.toISOString().split('T')[0])
                  setEndDate(
                    new Date(now.getFullYear(), now.getMonth(), 0)
                      .toISOString()
                      .split('T')[0]
                  )
                  setReportType('monthly')
                }}
              >
                Last Month
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  const now = new Date()
                  const quarterStart = new Date(
                    now.getFullYear(),
                    Math.floor(now.getMonth() / 3) * 3,
                    1
                  )
                  setStartDate(quarterStart.toISOString().split('T')[0])
                  setEndDate(now.toISOString().split('T')[0])
                  setReportType('monthly')
                }}
              >
                Current Quarter
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Report Types
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                • Monthly Summary - Overall attendance stats
              </p>
              <p className="text-muted-foreground">
                • Daily Report - Day-wise breakdown
              </p>
              <p className="text-muted-foreground">
                • Overtime Report - Extra hours worked
              </p>
              <p className="text-muted-foreground">
                • Late Coming - Delayed check-ins
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Export Formats
            </CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                • Excel (.xlsx) - For data analysis
              </p>
              <p className="text-muted-foreground">
                • PDF (.pdf) - For printing and sharing
              </p>
              <p className="text-muted-foreground">
                • CSV (.csv) - For custom processing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
