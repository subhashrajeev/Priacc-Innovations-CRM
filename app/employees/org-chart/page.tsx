'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Search, Users, Download, Loader2 } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'

interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  profilePhoto?: string | null
  designation?: {
    title: string
    level: number
  } | null
  department?: {
    name: string
  } | null
  reportees?: Employee[]
}

export default function OrgChartPage() {
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [topLevelEmployees, setTopLevelEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch all employees with their reportees
      const empResponse = await fetch('/api/employees?limit=500&status=ACTIVE')
      const empResult = await empResponse.json()

      if (empResult.success) {
        const allEmployees = empResult.data

        // Build hierarchy
        const employeeMap = new Map<string, Employee>()
        allEmployees.forEach((emp: any) => {
          employeeMap.set(emp.id, { ...emp, reportees: [] })
        })

        // Link reportees to managers
        allEmployees.forEach((emp: any) => {
          if (emp.reportingManagerId) {
            const manager = employeeMap.get(emp.reportingManagerId)
            if (manager) {
              manager.reportees = manager.reportees || []
              manager.reportees.push(employeeMap.get(emp.id)!)
            }
          }
        })

        // Find top-level employees (no reporting manager or reporting manager not in active list)
        const topLevel = allEmployees.filter(
          (emp: any) => !emp.reportingManagerId || !employeeMap.has(emp.reportingManagerId)
        ).map((emp: any) => employeeMap.get(emp.id)!)

        setEmployees(Array.from(employeeMap.values()))
        setTopLevelEmployees(topLevel)
      }

      // Fetch departments
      const deptResponse = await fetch('/api/departments')
      const deptResult = await deptResponse.json()
      if (deptResult.success) {
        setDepartments(deptResult.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load organization chart')
    } finally {
      setIsLoading(false)
    }
  }

  const filterEmployees = (employee: Employee): boolean => {
    if (departmentFilter !== 'all' && employee.department?.name !== departmentFilter) {
      return false
    }

    if (searchQuery) {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase()
      const query = searchQuery.toLowerCase()
      return fullName.includes(query) || employee.employeeCode.toLowerCase().includes(query)
    }

    return true
  }

  const renderEmployeeNode = (employee: Employee, level: number = 0) => {
    if (!filterEmployees(employee) && (!employee.reportees || employee.reportees.length === 0)) {
      return null
    }

    const fullName = `${employee.firstName} ${employee.lastName}`
    const hasReportees = employee.reportees && employee.reportees.length > 0

    return (
      <div key={employee.id} className="flex flex-col items-center">
        <Link href={`/employees/${employee.id}`}>
          <Card className="w-64 hover:shadow-lg transition-shadow cursor-pointer mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={employee.profilePhoto || undefined} alt={fullName} />
                  <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <h3 className="font-semibold">{fullName}</h3>
                  <p className="text-sm text-muted-foreground">{employee.employeeCode}</p>
                </div>

                {employee.designation && (
                  <Badge variant="secondary" className="text-xs">
                    {employee.designation.title}
                  </Badge>
                )}

                {employee.department && (
                  <p className="text-xs text-muted-foreground">{employee.department.name}</p>
                )}

                {hasReportees && (
                  <p className="text-xs text-muted-foreground">
                    {employee.reportees.length} {employee.reportees.length === 1 ? 'report' : 'reports'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {hasReportees && (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-1/2 top-0 w-0.5 h-8 bg-border -translate-x-1/2" />

            {/* Horizontal line */}
            {employee.reportees.length > 1 && (
              <div className="absolute left-0 right-0 top-8 h-0.5 bg-border" />
            )}

            {/* Reportees */}
            <div className="flex gap-12 pt-8 mt-8">
              {employee.reportees.map((reportee, index) => (
                <div key={reportee.id} className="relative flex flex-col items-center">
                  {/* Vertical line to child */}
                  {employee.reportees && employee.reportees.length > 1 && (
                    <div className="absolute bottom-full left-1/2 w-0.5 h-8 bg-border -translate-x-1/2" />
                  )}
                  {renderEmployeeNode(reportee, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/employees">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Chart</h1>
            <p className="text-muted-foreground">
              Hierarchical view of reporting structure
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organization Chart */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : topLevelEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Employees Found</h3>
              <p className="text-muted-foreground">
                There are no employees matching your criteria
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-8">
              <div className="inline-flex gap-12 min-w-full justify-center">
                {topLevelEmployees.map((employee) => renderEmployeeNode(employee))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top-Level Leaders</CardTitle>
            <div className="h-2 w-2 rounded-full bg-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topLevelEmployees.length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
