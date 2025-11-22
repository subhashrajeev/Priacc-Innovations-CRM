'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeaveApprovalCard } from '@/components/leave/leave-approval-card'
import { toast } from 'sonner'
import { Search, Filter, CheckCircle, Clock, XCircle } from 'lucide-react'

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

export default function LeaveApprovalsPage() {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    fetchLeaves()
  }, [])

  const fetchLeaves = async () => {
    setLoading(true)
    try {
      // In production, this would fetch team leaves only
      const response = await fetch('/api/leave')
      if (response.ok) {
        const data = await response.json()
        setLeaves(data)
      }
    } catch (error) {
      toast.error('Failed to fetch leave requests')
    } finally {
      setLoading(false)
    }
  }

  const filterLeaves = (status?: string) => {
    return leaves.filter((leave) => {
      const matchesStatus = !status || leave.status === status
      const matchesType = typeFilter === 'all' || leave.leaveType === typeFilter
      const matchesSearch =
        searchQuery === '' ||
        `${leave.employee.firstName} ${leave.employee.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        leave.employee.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesStatus && matchesType && matchesSearch
    })
  }

  const pendingLeaves = filterLeaves('PENDING')
  const approvedLeaves = filterLeaves('APPROVED')
  const rejectedLeaves = filterLeaves('REJECTED')

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve leave requests from your team
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeaves.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedLeaves.length}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedLeaves.length}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by employee name or code..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
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
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                Pending ({pendingLeaves.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedLeaves.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedLeaves.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 mt-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : pendingLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending leave requests
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingLeaves.map((leave) => (
                    <LeaveApprovalCard
                      key={leave.id}
                      leave={leave}
                      onUpdate={fetchLeaves}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4 mt-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : approvedLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No approved leaves
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {approvedLeaves.map((leave) => (
                    <LeaveApprovalCard
                      key={leave.id}
                      leave={leave}
                      onUpdate={fetchLeaves}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4 mt-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : rejectedLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No rejected leaves
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rejectedLeaves.map((leave) => (
                    <LeaveApprovalCard
                      key={leave.id}
                      leave={leave}
                      onUpdate={fetchLeaves}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
