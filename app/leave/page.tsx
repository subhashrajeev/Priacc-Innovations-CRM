'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LeaveBalanceCard } from '@/components/leave/leave-balance-card'
import { ApplyLeaveDialog } from '@/components/leave/apply-leave-dialog'
import { toast } from 'sonner'
import { Plus, Search, Filter } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface LeaveBalance {
  leaveType: string
  allocated: number
  used: number
  available: number
  pending: number
  approved: number
}

interface Leave {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  halfDay: boolean
  reason: string
  status: string
  createdAt: string
}

interface LeavePolicy {
  leaveType: string
  totalDays: number
  requiresDocument: boolean
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
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

export default function LeavePage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [policies, setPolicies] = useState<LeavePolicy[]>([])
  const [loading, setLoading] = useState(false)
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [balanceRes, leavesRes, policiesRes] = await Promise.all([
        fetch('/api/leave/balance'),
        fetch('/api/leave'),
        fetch('/api/leave/policies'),
      ])

      if (balanceRes.ok) {
        const data = await balanceRes.json()
        setBalances(data.balances || [])
      }

      if (leavesRes.ok) {
        const data = await leavesRes.json()
        setLeaves(data)
      }

      if (policiesRes.ok) {
        const data = await policiesRes.json()
        setPolicies(data)
      }
    } catch (error) {
      toast.error('Failed to fetch leave data')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelLeave = async (leaveId: string) => {
    try {
      const response = await fetch(`/api/leave/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })

      if (response.ok) {
        toast.success('Leave cancelled successfully')
        fetchData()
      } else {
        const data = await response.json()
        toast.error(data.message || 'Failed to cancel leave')
      }
    } catch (error) {
      toast.error('Failed to cancel leave')
    }
  }

  const filteredLeaves = leaves.filter((leave) => {
    const matchesStatus = statusFilter === 'all' || leave.status === statusFilter
    const matchesType = typeFilter === 'all' || leave.leaveType === typeFilter
    const matchesSearch =
      searchQuery === '' ||
      leave.reason.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesType && matchesSearch
  })

  const totalAllocated = balances.reduce((sum, b) => sum + b.allocated, 0)
  const totalUsed = balances.reduce((sum, b) => sum + b.used, 0)
  const totalAvailable = balances.reduce((sum, b) => sum + b.available, 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Leaves</h1>
          <p className="text-muted-foreground">
            Manage your leave applications and view balance
          </p>
        </div>
        <Button onClick={() => setShowApplyDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Apply Leave
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAllocated} days</div>
            <p className="text-xs text-muted-foreground">Annual leave quota</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsed} days</div>
            <p className="text-xs text-muted-foreground">
              {((totalUsed / totalAllocated) * 100).toFixed(0)}% utilized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAvailable} days</div>
            <p className="text-xs text-muted-foreground">Remaining balance</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Leave Balance by Type</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {balances.map((balance) => (
            <LeaveBalanceCard
              key={balance.leaveType}
              balance={balance}
              onClick={() => {
                setTypeFilter(balance.leaveType)
                setShowApplyDialog(true)
              }}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Leave History</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(leaveTypeNames).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No leave records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">
                      {leaveTypeNames[leave.leaveType] || leave.leaveType}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </TableCell>
                    <TableCell>
                      {leave.totalDays} {leave.halfDay && '(HD)'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {leave.reason}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[leave.status]}>
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(leave.createdAt)}
                    </TableCell>
                    <TableCell>
                      {leave.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelLeave(leave.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ApplyLeaveDialog
        open={showApplyDialog}
        onOpenChange={setShowApplyDialog}
        policies={policies}
        balances={balances}
        onSuccess={fetchData}
      />
    </div>
  )
}
