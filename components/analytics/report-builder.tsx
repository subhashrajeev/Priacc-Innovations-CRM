'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type ReportType =
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'performance'
  | 'projects'
  | 'expenses'

interface ReportConfig {
  reportType: ReportType
  dateFrom: Date | null
  dateTo: Date | null
  department?: string
  employee?: string
  format?: 'pdf' | 'excel' | 'csv'
}

interface ReportBuilderProps {
  onGenerate: (config: ReportConfig) => void
  loading?: boolean
  departments?: Array<{ id: string; name: string }>
  employees?: Array<{ id: string; name: string }>
}

const reportTypes = [
  { value: 'attendance', label: 'Attendance Report' },
  { value: 'leave', label: 'Leave Report' },
  { value: 'payroll', label: 'Payroll Report' },
  { value: 'performance', label: 'Performance Report' },
  { value: 'projects', label: 'Project Report' },
  { value: 'expenses', label: 'Expense Report' },
]

export function ReportBuilder({
  onGenerate,
  loading = false,
  departments = [],
  employees = [],
}: ReportBuilderProps) {
  const [config, setConfig] = useState<ReportConfig>({
    reportType: 'attendance',
    dateFrom: null,
    dateTo: null,
    format: 'excel',
  })

  const handleGenerate = () => {
    onGenerate(config)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Builder</CardTitle>
        <CardDescription>Configure and generate custom reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Report Type */}
          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type</Label>
            <Select
              value={config.reportType}
              onValueChange={(value) =>
                setConfig({ ...config, reportType: value as ReportType })
              }
            >
              <SelectTrigger id="reportType">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={config.format}
              onValueChange={(value) =>
                setConfig({ ...config, format: value as 'pdf' | 'excel' | 'csv' })
              }
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label>From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !config.dateFrom && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {config.dateFrom ? (
                    format(config.dateFrom, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <input
                  type="date"
                  className="p-2 border rounded"
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dateFrom: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !config.dateTo && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {config.dateTo ? format(config.dateTo, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <input
                  type="date"
                  className="p-2 border rounded"
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dateTo: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Department Filter */}
          {departments.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Select
                value={config.department}
                onValueChange={(value) =>
                  setConfig({ ...config, department: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Employee Filter */}
          {employees.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="employee">Employee (Optional)</Label>
              <Select
                value={config.employee}
                onValueChange={(value) =>
                  setConfig({ ...config, employee: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={loading || !config.dateFrom || !config.dateTo}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
