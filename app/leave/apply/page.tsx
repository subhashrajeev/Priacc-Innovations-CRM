'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { LeaveBalanceCard } from '@/components/leave/leave-balance-card'

interface LeavePolicy {
  leaveType: string
  totalDays: number
  requiresDocument: boolean
  carryForward: boolean
  maxCarryForward: number | null
}

interface LeaveBalance {
  leaveType: string
  allocated: number
  used: number
  available: number
  pending: number
  approved: number
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

export default function ApplyLeavePage() {
  const router = useRouter()
  const [policies, setPolicies] = useState<LeavePolicy[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    halfDay: false,
    reason: '',
    documentUrl: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [policiesRes, balanceRes] = await Promise.all([
        fetch('/api/leave/policies'),
        fetch('/api/leave/balance'),
      ])

      if (policiesRes.ok) {
        const data = await policiesRes.json()
        setPolicies(data)
      }

      if (balanceRes.ok) {
        const data = await balanceRes.json()
        setBalances(data.balances || [])
      }
    } catch (error) {
      toast.error('Failed to fetch leave data')
    }
  }

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
        router.push('/leave')
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Apply for Leave</h1>
          <p className="text-muted-foreground">
            Submit a new leave application
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Leave Application Form</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Available: {selectedBalance.available} days
                      </span>
                    </div>
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
                      min={new Date().toISOString().split('T')[0]}
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
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900">
                      Total Leave Duration: {days} {days === 1 ? 'day' : 'days'}
                    </p>
                    {selectedBalance && days > selectedBalance.available && formData.leaveType !== 'LOSS_OF_PAY' && (
                      <p className="text-sm text-red-600 mt-1">
                        Warning: Exceeds available balance by {days - selectedBalance.available} days
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <textarea
                    id="reason"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter detailed reason for leave"
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
                      Supporting Document URL {selectedPolicy.requiresDocument && '*'}
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
                      Upload your supporting document (e.g., medical certificate) and paste the URL here
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leave Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {balances.slice(0, 4).map((balance) => (
                <div
                  key={balance.leaveType}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {leaveTypeNames[balance.leaveType]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {balance.available} / {balance.allocated} available
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{balance.available}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {selectedPolicy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leave Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Annual Quota:</span>
                  <span className="font-medium">{selectedPolicy.totalDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carry Forward:</span>
                  <span className="font-medium">
                    {selectedPolicy.carryForward ? 'Yes' : 'No'}
                  </span>
                </div>
                {selectedPolicy.carryForward && selectedPolicy.maxCarryForward && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Carry Forward:</span>
                    <span className="font-medium">
                      {selectedPolicy.maxCarryForward} days
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Document Required:</span>
                  <span className="font-medium">
                    {selectedPolicy.requiresDocument ? 'Yes' : 'No'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
