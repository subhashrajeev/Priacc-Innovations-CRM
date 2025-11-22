'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { getMonthName } from '@/lib/payroll-utils'
import { Loader2, Play, CheckCircle2, XCircle, Users } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export default function GeneratePayslipsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [results, setResults] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Check if user is HR
    if (session?.user?.role && !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'].includes(session.user.role)) {
      router.push('/payroll')
      return
    }

    fetchEmployees()
  }, [session])

  const fetchEmployees = async () => {
    try {
      setLoading(true)

      // Fetch active employees (you'll need to create this endpoint)
      // For now, using placeholder
      // const response = await fetch('/api/employees?status=ACTIVE')
      // if (response.ok) {
      //   const data = await response.json()
      //   setEmployees(data.data)
      // }

      // Placeholder data
      setEmployees([])
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(employees.map(emp => emp.id))
    } else {
      setSelectedEmployees([])
    }
  }

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId])
    } else {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId))
    }
  }

  const handleGenerate = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one employee',
        variant: 'destructive',
      })
      return
    }

    try {
      setGenerating(true)
      setProgress(0)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch('/api/payroll/payslip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeIds: selectedEmployees,
          month,
          year,
        }),
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error('Failed to generate payslips')
      }

      const data = await response.json()
      setResults(data.data)

      toast({
        title: 'Success',
        description: `Generated ${data.data.summary.success} payslips successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate payslips',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleReset = () => {
    setResults(null)
    setProgress(0)
    setSelectedEmployees([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Payslips</h1>
        <p className="text-gray-600">
          Generate payslips for employees for a specific month
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Select month and employees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {getMonthName(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Selected Employees</span>
                  <Badge variant="secondary">{selectedEmployees.length}</Badge>
                </div>
                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={generating || selectedEmployees.length === 0}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Generate Payslips
                    </>
                  )}
                </Button>
              </div>

              {generating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Employee Selection / Results */}
        <div className="lg:col-span-2">
          {!results ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Select Employees</CardTitle>
                    <CardDescription>
                      Choose employees to generate payslips for
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedEmployees.length === employees.length && employees.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label>Select All</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {employees.length > 0 ? (
                  <div className="space-y-2">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedEmployees.includes(employee.id)}
                            onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                          />
                          <div>
                            <p className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {employee.employeeCode} • {employee.designation?.title}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(employee.salary?.netSalary || 0)}
                          </p>
                          <p className="text-xs text-gray-500">Monthly</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No employees found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Generation Results</CardTitle>
                <CardDescription>
                  {getMonthName(month)} {year} - Payslip Generation Summary
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 mb-1">Total</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {results.summary.total}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700 mb-1">Success</p>
                    <p className="text-2xl font-bold text-green-900">
                      {results.summary.success}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700 mb-1">Failed</p>
                    <p className="text-2xl font-bold text-red-900">
                      {results.summary.failed}
                    </p>
                  </div>
                </div>

                {/* Generated Payslips */}
                {results.generated.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Successfully Generated</h3>
                    <div className="space-y-2">
                      {results.generated.map((payslip: any) => (
                        <div
                          key={payslip.id}
                          className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium">
                                {payslip.employee.firstName} {payslip.employee.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {payslip.employee.employeeCode}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold">{formatCurrency(payslip.netPay)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {results.errors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Failed</h3>
                    <div className="space-y-2">
                      {results.errors.map((error: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 border border-red-200 bg-red-50 rounded-lg"
                        >
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-900">{error.employeeId}</p>
                            <p className="text-sm text-red-700">{error.error}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleReset} className="flex-1">
                    Generate More
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/payroll')} className="flex-1">
                    View Payslips
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
