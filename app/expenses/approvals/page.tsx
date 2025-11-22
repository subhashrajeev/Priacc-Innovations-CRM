'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Expense {
  id: string
  expenseType: string
  amount: number
  currency: string
  date: string
  description: string
  status: string
  receiptUrl: string
  employee: {
    firstName: string
    lastName: string
    employeeCode: string
    department: {
      name: string
    }
  }
}

export default function ExpenseApprovalsPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchPendingExpenses()
  }, [])

  const fetchPendingExpenses = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/expenses/approve')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.data || [])
      } else {
        toast.error('Failed to fetch expenses')
      }
    } catch (error) {
      toast.error('Failed to fetch expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (expenseId: string) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/expenses/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId,
          action: 'approve',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Expense approved')
        fetchPendingExpenses()
      } else {
        toast.error(data.error || 'Failed to approve expense')
      }
    } catch (error) {
      toast.error('Failed to approve expense')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedExpense || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/expenses/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId: selectedExpense.id,
          action: 'reject',
          reason: rejectReason,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Expense rejected')
        setShowRejectDialog(false)
        setRejectReason('')
        setSelectedExpense(null)
        fetchPendingExpenses()
      } else {
        toast.error(data.error || 'Failed to reject expense')
      }
    } catch (error) {
      toast.error('Failed to reject expense')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/expenses')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Expense Approvals</h1>
          <p className="text-muted-foreground">Review and approve expense claims</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            {expenses.length} expense(s) waiting for your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No pending approvals
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {expense.employee.firstName} {expense.employee.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {expense.employee.employeeCode} •{' '}
                          {expense.employee.department.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(expense.date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {expense.expenseType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {expense.description}
                    </TableCell>
                    <TableCell className="font-medium">
                      {expense.currency} {expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {expense.receiptUrl ? (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(expense.id)}
                          disabled={processing}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedExpense(expense)
                            setShowRejectDialog(true)
                          }}
                          disabled={processing}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this expense claim.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                placeholder="Enter reason for rejection..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectReason('')
                setSelectedExpense(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
            >
              {processing ? 'Rejecting...' : 'Reject Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
