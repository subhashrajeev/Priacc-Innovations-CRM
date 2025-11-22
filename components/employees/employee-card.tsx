'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, UserCheck } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { UserStatus } from '@prisma/client'

interface EmployeeCardProps {
  employee: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
    profilePhoto?: string | null
    personalEmail?: string | null
    phoneNumber?: string | null
    workLocation?: string | null
    employmentStatus: UserStatus
    user?: {
      email: string
      role: string
    }
    department?: {
      name: string
    } | null
    designation?: {
      title: string
    } | null
  }
}

const statusColors: Record<UserStatus, string> = {
  ACTIVE: 'bg-green-500/10 text-green-700 dark:text-green-400',
  INACTIVE: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  SUSPENDED: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  TERMINATED: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const fullName = `${employee.firstName} ${employee.lastName}`
  const initials = getInitials(fullName)

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              <AvatarImage src={employee.profilePhoto || undefined} alt={fullName} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{fullName}</h3>
              <p className="text-sm text-muted-foreground">{employee.employeeCode}</p>
            </div>
          </div>
          <Badge className={statusColors[employee.employmentStatus]}>
            {employee.employmentStatus}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {employee.designation && (
          <div className="flex items-center gap-2 text-sm">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{employee.designation.title}</span>
          </div>
        )}

        {employee.department && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span>{employee.department.name}</span>
          </div>
        )}

        {employee.user?.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <a
              href={`mailto:${employee.user.email}`}
              className="hover:text-primary transition-colors truncate"
            >
              {employee.user.email}
            </a>
          </div>
        )}

        {employee.phoneNumber && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <a
              href={`tel:${employee.phoneNumber}`}
              className="hover:text-primary transition-colors"
            >
              {employee.phoneNumber}
            </a>
          </div>
        )}

        {employee.workLocation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{employee.workLocation}</span>
          </div>
        )}

        <div className="pt-3 flex gap-2">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/employees/${employee.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
