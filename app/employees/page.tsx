'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmployeeTable, EmployeeTableData } from '@/components/employees/employee-table'
import { EmployeeCard } from '@/components/employees/employee-card'
import {
  Users,
  UserPlus,
  Grid,
  List,
  Search,
  Filter,
  Download,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { isHR } from '@/lib/auth'

export default function EmployeesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [employees, setEmployees] = useState<EmployeeTableData[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeTableData[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [designations, setDesignations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [designationFilter, setDesignationFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const canManageEmployees = session?.user?.role ? isHR(session.user.role) : false

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
    fetchDesignations()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [employees, searchQuery, departmentFilter, designationFilter, statusFilter])

  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/employees?limit=100')
      const result = await response.json()

      if (result.success) {
        setEmployees(result.data)
        setFilteredEmployees(result.data)
      } else {
        toast.error('Failed to fetch employees')
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('An error occurred while fetching employees')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      const result = await response.json()
      if (result.success) {
        setDepartments(result.data)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchDesignations = async () => {
    try {
      const response = await fetch('/api/designations')
      const result = await response.json()
      if (result.success) {
        setDesignations(result.data)
      }
    } catch (error) {
      console.error('Error fetching designations:', error)
    }
  }

  const filterEmployees = () => {
    let filtered = [...employees]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((emp) => {
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase()
        const email = emp.user?.email?.toLowerCase() || ''
        const code = emp.employeeCode.toLowerCase()
        const query = searchQuery.toLowerCase()

        return fullName.includes(query) || email.includes(query) || code.includes(query)
      })
    }

    // Department filter
    if (departmentFilter && departmentFilter !== 'all') {
      filtered = filtered.filter((emp) => emp.department?.id === departmentFilter)
    }

    // Designation filter
    if (designationFilter && designationFilter !== 'all') {
      filtered = filtered.filter((emp) => emp.designation?.id === designationFilter)
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((emp) => emp.employmentStatus === statusFilter)
    }

    setFilteredEmployees(filtered)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to terminate this employee?')) {
      return
    }

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Employee terminated successfully')
        fetchEmployees()
      } else {
        toast.error(result.error || 'Failed to terminate employee')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error('An error occurred while terminating employee')
    }
  }

  const handleExportCSV = () => {
    // Convert data to CSV
    const headers = ['Employee Code', 'Name', 'Email', 'Department', 'Designation', 'Phone', 'Status']
    const rows = filteredEmployees.map((emp) => [
      emp.employeeCode,
      `${emp.firstName} ${emp.lastName}`,
      emp.user?.email || '',
      emp.department?.name || '',
      emp.designation?.title || '',
      emp.phoneNumber || '',
      emp.employmentStatus,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success('Employee data exported successfully')
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage your organization's workforce
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {canManageEmployees && (
            <Button asChild>
              <Link href="/employees/new">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter((e) => e.employmentStatus === 'ACTIVE').length}
            </div>
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
            <CardTitle className="text-sm font-medium">Designations</CardTitle>
            <div className="h-2 w-2 rounded-full bg-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{designations.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search employees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
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

            <Select value={designationFilter} onValueChange={setDesignationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Designation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                {designations.map((des) => (
                  <SelectItem key={des.id} value={des.id}>
                    {des.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle and Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {filteredEmployees.length} {filteredEmployees.length === 1 ? 'Employee' : 'Employees'}
              </CardTitle>
              <CardDescription>
                {filteredEmployees.length !== employees.length &&
                  `Filtered from ${employees.length} total employees`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : viewMode === 'table' ? (
            <EmployeeTable
              data={filteredEmployees}
              onDelete={canManageEmployees ? handleDelete : undefined}
              isHR={canManageEmployees}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
              {filteredEmployees.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No employees found matching your filters
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
