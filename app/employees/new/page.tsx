'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmployeeForm } from '@/components/employees/employee-form'
import { CreateEmployee } from '@/lib/validations/employee'
import { toast } from 'sonner'
import { isHR } from '@/lib/auth'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewEmployeePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [departments, setDepartments] = useState<any[]>([])
  const [designations, setDesignations] = useState<any[]>([])
  const [reportingManagers, setReportingManagers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has permission
    if (session && !isHR(session.user.role)) {
      toast.error('You do not have permission to add employees')
      router.push('/employees')
      return
    }

    fetchData()
  }, [session])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch departments
      const deptResponse = await fetch('/api/departments')
      const deptResult = await deptResponse.json()
      if (deptResult.success) {
        setDepartments(deptResult.data)
      }

      // Fetch designations
      const desigResponse = await fetch('/api/designations')
      const desigResult = await desigResponse.json()
      if (desigResult.success) {
        setDesignations(desigResult.data)
      }

      // Fetch potential reporting managers (active employees with manager roles)
      const empResponse = await fetch('/api/employees?status=ACTIVE&limit=100')
      const empResult = await empResponse.json()
      if (empResult.success) {
        // Filter employees who can be managers
        const managers = empResult.data.filter((emp: any) => {
          const role = emp.user?.role
          return ['MANAGER', 'TEAM_LEAD', 'HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(role)
        })
        setReportingManagers(managers)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load form data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (data: CreateEmployee) => {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Employee created successfully')
        router.push(`/employees/${result.data.id}`)
      } else {
        toast.error(result.error || 'Failed to create employee')
      }
    } catch (error) {
      console.error('Error creating employee:', error)
      toast.error('An error occurred while creating employee')
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (session && !isHR(session.user.role)) {
    return null
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/employees">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Employee</h1>
          <p className="text-muted-foreground">
            Create a new employee record in the system
          </p>
        </div>
      </div>

      {/* Form */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      ) : (
        <EmployeeForm
          onSubmit={handleSubmit}
          departments={departments}
          designations={designations}
          reportingManagers={reportingManagers}
        />
      )}
    </div>
  )
}
