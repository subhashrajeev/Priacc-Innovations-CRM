'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { EmployeeForm } from '@/components/employees/employee-form'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  FileText,
  CreditCard,
  AlertCircle,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import { isHR } from '@/lib/auth'
import { UserStatus } from '@prisma/client'

const statusColors: Record<UserStatus, string> = {
  ACTIVE: 'bg-green-500/10 text-green-700 dark:text-green-400',
  INACTIVE: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  SUSPENDED: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  TERMINATED: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

export default function EmployeeProfilePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [employee, setEmployee] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(searchParams.get('edit') === 'true')
  const [departments, setDepartments] = useState<any[]>([])
  const [designations, setDesignations] = useState<any[]>([])
  const [reportingManagers, setReportingManagers] = useState<any[]>([])

  const employeeId = params.id as string
  const canEdit = session?.user?.role ? isHR(session.user.role) || session.user.employeeId === employeeId : false

  useEffect(() => {
    fetchEmployee()
    if (isEditMode) {
      fetchFormData()
    }
  }, [employeeId])

  const fetchEmployee = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/employees/${employeeId}`)
      const result = await response.json()

      if (result.success) {
        setEmployee(result.data)
      } else {
        toast.error('Failed to fetch employee details')
        router.push('/employees')
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
      toast.error('An error occurred while fetching employee details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFormData = async () => {
    try {
      const [deptRes, desigRes, empRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/designations'),
        fetch('/api/employees?status=ACTIVE&limit=100'),
      ])

      const [deptData, desigData, empData] = await Promise.all([
        deptRes.json(),
        desigRes.json(),
        empRes.json(),
      ])

      if (deptData.success) setDepartments(deptData.data)
      if (desigData.success) setDesignations(desigData.data)
      if (empData.success) {
        const managers = empData.data.filter((emp: any) => {
          const role = emp.user?.role
          return ['MANAGER', 'TEAM_LEAD', 'HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(role) && emp.id !== employeeId
        })
        setReportingManagers(managers)
      }
    } catch (error) {
      console.error('Error fetching form data:', error)
    }
  }

  const handleUpdate = async (data: any) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Employee updated successfully')
        setIsEditMode(false)
        fetchEmployee()
      } else {
        toast.error(result.error || 'Failed to update employee')
      }
    } catch (error) {
      console.error('Error updating employee:', error)
      toast.error('An error occurred while updating employee')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to terminate this employee? This action will mark them as terminated.')) {
      return
    }

    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Employee terminated successfully')
        router.push('/employees')
      } else {
        toast.error(result.error || 'Failed to terminate employee')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error('An error occurred while terminating employee')
    }
  }

  if (isLoading || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const fullName = `${employee.firstName} ${employee.lastName}`
  const initials = getInitials(fullName)

  if (isEditMode && canEdit) {
    return (
      <div className="container mx-auto p-6 max-w-5xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsEditMode(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Employee</h1>
            <p className="text-muted-foreground">Update employee information</p>
          </div>
        </div>

        <EmployeeForm
          initialData={{
            ...employee,
            email: employee.user?.email,
            role: employee.user?.role,
          }}
          onSubmit={handleUpdate}
          isEditing
          departments={departments}
          designations={designations}
          reportingManagers={reportingManagers}
        />
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
            <h1 className="text-3xl font-bold tracking-tight">Employee Profile</h1>
            <p className="text-muted-foreground">View and manage employee details</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditMode(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {isHR(session?.user?.role || 'EMPLOYEE') && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Terminate
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={employee.profilePhoto || undefined} alt={fullName} />
              <AvatarFallback className="text-4xl">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold">{fullName}</h2>
                  <Badge className={statusColors[employee.employmentStatus]}>
                    {employee.employmentStatus}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-lg">{employee.employeeCode}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employee.designation && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{employee.designation.title}</span>
                  </div>
                )}

                {employee.department && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.department.name}</span>
                  </div>
                )}

                {employee.user?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${employee.user.email}`} className="hover:underline">
                      {employee.user.email}
                    </a>
                  </div>
                )}

                {employee.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${employee.phoneNumber}`} className="hover:underline">
                      {employee.phoneNumber}
                    </a>
                  </div>
                )}

                {employee.workLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.workLocation}</span>
                  </div>
                )}

                {employee.dateOfJoining && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {formatDate(employee.dateOfJoining, 'long')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Full Name" value={fullName} />
                <InfoField label="Employee Code" value={employee.employeeCode} />
                <InfoField label="Date of Birth" value={employee.dateOfBirth ? formatDate(employee.dateOfBirth, 'long') : '-'} />
                <InfoField label="Gender" value={employee.gender || '-'} />
                <InfoField label="Marital Status" value={employee.maritalStatus || '-'} />
                <InfoField label="Blood Group" value={employee.bloodGroup || '-'} />
                <InfoField label="Nationality" value={employee.nationality || '-'} />
                <InfoField label="Personal Email" value={employee.personalEmail || '-'} />
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold">Current Address</h3>
                <p className="text-sm text-muted-foreground">
                  {employee.currentAddress || '-'}
                  {employee.city && `, ${employee.city}`}
                  {employee.state && `, ${employee.state}`}
                  {employee.pincode && ` - ${employee.pincode}`}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Permanent Address</h3>
                <p className="text-sm text-muted-foreground">
                  {employee.permanentAddress || '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employment Tab */}
        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Employee Type" value={employee.employeeType} />
                <InfoField label="Date of Joining" value={formatDate(employee.dateOfJoining, 'long')} />
                <InfoField label="Confirmation Date" value={employee.confirmationDate ? formatDate(employee.confirmationDate, 'long') : 'Pending'} />
                <InfoField label="Probation Period" value={employee.probationPeriod ? `${employee.probationPeriod} months` : '-'} />
                <InfoField label="Notice Period" value={employee.noticePeriod ? `${employee.noticePeriod} days` : '-'} />
                <InfoField label="Work Location" value={employee.workLocation || '-'} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Department" value={employee.department?.name || '-'} />
                <InfoField label="Designation" value={employee.designation?.title || '-'} />
                <InfoField label="User Role" value={employee.user?.role || '-'} />
                {employee.reportingManager && (
                  <InfoField
                    label="Reporting Manager"
                    value={`${employee.reportingManager.firstName} ${employee.reportingManager.lastName} (${employee.reportingManager.employeeCode})`}
                  />
                )}
              </div>

              {employee.reportees && employee.reportees.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Team Members ({employee.reportees.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {employee.reportees.map((reportee: any) => (
                        <Link
                          key={reportee.id}
                          href={`/employees/${reportee.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={reportee.profilePhoto || undefined} />
                            <AvatarFallback>
                              {getInitials(`${reportee.firstName} ${reportee.lastName}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{reportee.firstName} {reportee.lastName}</p>
                            <p className="text-sm text-muted-foreground">
                              {reportee.designation?.title || 'No designation'}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents & IDs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Aadhar Number" value={employee.aadharNumber ? `XXXX XXXX ${employee.aadharNumber.slice(-4)}` : '-'} />
                <InfoField label="PAN Number" value={employee.panNumber || '-'} />
                <InfoField label="Passport Number" value={employee.passportNumber || '-'} />
                <InfoField label="Driving License" value={employee.drivingLicense || '-'} />
              </div>

              {employee.resumeUrl && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Resume</h3>
                    <Button variant="outline" asChild>
                      <a href={employee.resumeUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        View Resume
                      </a>
                    </Button>
                  </div>
                </>
              )}

              {employee.documents && employee.documents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Uploaded Documents</h3>
                    <div className="space-y-2">
                      {employee.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className="text-sm text-muted-foreground">{doc.type}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Details Tab */}
        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Bank Name" value={employee.bankName || '-'} />
                <InfoField label="Account Number" value={employee.accountNumber ? `XXXXXX${employee.accountNumber.slice(-4)}` : '-'} />
                <InfoField label="IFSC Code" value={employee.ifscCode || '-'} />
                <InfoField label="UPI ID" value={employee.upiId || '-'} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Contact Tab */}
        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Contact Name" value={employee.emergencyContactName || '-'} />
                <InfoField label="Contact Phone" value={employee.emergencyContactPhone || '-'} />
                <InfoField label="Relationship" value={employee.emergencyContactRelation || '-'} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
