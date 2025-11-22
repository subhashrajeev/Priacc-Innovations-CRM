'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface LeavePolicy {
  leaveType: string
  totalDays: number
  requiresDocument: boolean
}

interface LeaveBalance {
  leaveType: string
  available: number
}

interface ApplyLeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  policies: LeavePolicy[]
  balances: LeaveBalance[]
  onSuccess?: () => void
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

export function ApplyLeaveDialog({
  open,
  onOpenChange,
  policies,
  balances,
  onSuccess,
}: ApplyLeaveDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    halfDay: false,
    reason: '',
    documentUrl: '',
  })

  const selectedBalance = balances.find((b) => b.leaveType === formData.leaveType)
  const selectedPolicy = policies.find((p) => p.leaveType === formData.leaveType)

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0
    if (formData.halfDay) return 0.5

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill all required fields')
      return
    }

    if (selectedPolicy?.requiresDocument && !formData.documentUrl) {
      toast.error('Document is required for this leave type')
      return
    }

    const days = calculateDays()
    if (
      selectedBalance &&
      days > selectedBalance.available &&
      formData.leaveType !== 'LOSS_OF_PAY'
    ) {
      toast.error(`Insufficient leave balance. Available: ${selectedBalance.available} days`)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Leave application submitted successfully')
        onOpenChange(false)
        setFormData({
          leaveType: '',
          startDate: '',
          endDate: '',
          halfDay: false,
          reason: '',
          documentUrl: '',
        })
        onSuccess?.()
      } else {
        toast.error(data.message || 'Failed to apply for leave')
      }
    } catch (error) {
      toast.error('Failed to apply for leave')
    } finally {
      setLoading(false)
    }
  }

  const days = calculateDays()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
          <DialogDescription>
            Fill in the details below to submit your leave request
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type *</Label>
            <Select
              value={formData.leaveType}
              onValueChange={(value) =>
                setFormData({ ...formData, leaveType: value })
              }
            >
              <SelectTrigger id="leaveType">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {policies.map((policy) => (
                  <SelectItem key={policy.leaveType} value={policy.leaveType}>
                    {leaveTypeNames[policy.leaveType] || policy.leaveType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBalance && (
              <p className="text-sm text-muted-foreground">
                Available: {selectedBalance.available} days
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                min={formData.startDate}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="halfDay"
              checked={formData.halfDay}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, halfDay: checked as boolean })
              }
            />
            <Label htmlFor="halfDay" className="cursor-pointer">
              Half Day Leave
            </Label>
          </div>

          {formData.startDate && formData.endDate && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium">
                Total Days: {days} {days === 1 ? 'day' : 'days'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <textarea
              id="reason"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter reason for leave"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              required
            />
          </div>

          {selectedPolicy?.requiresDocument && (
            <div className="space-y-2">
              <Label htmlFor="documentUrl">
                Document URL {selectedPolicy.requiresDocument && '*'}
              </Label>
              <Input
                id="documentUrl"
                type="url"
                placeholder="https://example.com/document.pdf"
                value={formData.documentUrl}
                onChange={(e) =>
                  setFormData({ ...formData, documentUrl: e.target.value })
                }
                required={selectedPolicy.requiresDocument}
              />
              <p className="text-xs text-muted-foreground">
                Upload your supporting document and paste the URL here
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
