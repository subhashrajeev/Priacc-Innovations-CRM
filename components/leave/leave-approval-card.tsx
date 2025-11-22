'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Calendar, Clock, FileText, User, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'

interface Leave {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  halfDay: boolean
  reason: string
  status: string
  documentUrl?: string
  employee: {
    firstName: string
    lastName: string
    employeeCode: string
  }
}

interface LeaveApprovalCardProps {
  leave: Leave
  onUpdate?: () => void
}

const leaveTypeNames: Record<string, string> = {
  CASUAL: 'Casual Leave',
  SICK: 'Sick Leave',
  PRIVILEGE: 'Privilege Leave',
  EARNED: 'Earned Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  COMPENSATORY: 'Compensatory Off',
  LOSS_OF_PAY: 'Loss of Pay',
  BEREAVEMENT: 'Bereavement Leave',
  MARRIAGE: 'Marriage Leave',
  SABBATICAL: 'Sabbatical Leave',
}

const leaveTypeColors: Record<string, string> = {
  CASUAL: 'bg-blue-100 text-blue-800',
  SICK: 'bg-red-100 text-red-800',
  PRIVILEGE: 'bg-purple-100 text-purple-800',
  EARNED: 'bg-green-100 text-green-800',
  MATERNITY: 'bg-pink-100 text-pink-800',
  PATERNITY: 'bg-indigo-100 text-indigo-800',
  COMPENSATORY: 'bg-yellow-100 text-yellow-800',
  LOSS_OF_PAY: 'bg-gray-100 text-gray-800',
  BEREAVEMENT: 'bg-slate-100 text-slate-800',
  MARRIAGE: 'bg-orange-100 text-orange-800',
  SABBATICAL: 'bg-teal-100 text-teal-800',
}

export function LeaveApprovalCard({ leave, onUpdate }: LeaveApprovalCardProps) {
  const [loading, setLoading] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leave/${leave.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Leave approved successfully')
        onUpdate?.()
      } else {
        toast.error(data.message || 'Failed to approve leave')
      }
    } catch (error) {
      toast.error('Failed to approve leave')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/leave/${leave.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectedReason: rejectionReason,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Leave rejected')
        setShowRejectDialog(false)
        setRejectionReason('')
        onUpdate?.()
      } else {
        toast.error(data.message || 'Failed to reject leave')
      }
    } catch (error) {
      toast.error('Failed to reject leave')
    } finally {
      setLoading(false)
    }
  }

  const employeeName = `${leave.employee.firstName} ${leave.employee.lastName}`
  const leaveTypeName = leaveTypeNames[leave.leaveType] || leave.leaveType
  const leaveTypeColor = leaveTypeColors[leave.leaveType] || 'bg-gray-100 text-gray-800'

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>{getInitials(employeeName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{employeeName}</p>
                <p className="text-sm text-muted-foreground">
                  {leave.employee.employeeCode}
                </p>
              </div>
            </div>
            <Badge className={leaveTypeColor}>{leaveTypeName}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Start Date</p>
                <p className="text-muted-foreground">{formatDate(leave.startDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">End Date</p>
                <p className="text-muted-foreground">{formatDate(leave.endDate)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Duration:</span>
            <span>
              {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
              {leave.halfDay && ' (Half Day)'}
            </span>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Reason:</p>
              <p className="text-muted-foreground">{leave.reason}</p>
            </div>
          </div>

          {leave.documentUrl && (
            <div className="pt-2">
              <a
                href={leave.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View Supporting Document →
              </a>
            </div>
          )}
        </CardContent>

        {leave.status === 'PENDING' && (
          <CardFooter className="flex gap-2">
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1"
              variant="default"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowRejectDialog(true)}
              disabled={loading}
              className="flex-1"
              variant="destructive"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </CardFooter>
        )}
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Rejection Reason</Label>
            <textarea
              id="rejectionReason"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Enter reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleReject} disabled={loading} variant="destructive">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
