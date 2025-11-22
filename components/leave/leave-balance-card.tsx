'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface LeaveBalance {
  leaveType: string
  allocated: number
  used: number
  available: number
  pending: number
  approved: number
}

interface LeaveBalanceCardProps {
  balance: LeaveBalance
  onClick?: () => void
}

const leaveTypeColors: Record<string, string> = {
  CASUAL: 'text-blue-600 bg-blue-50 border-blue-200',
  SICK: 'text-red-600 bg-red-50 border-red-200',
  PRIVILEGE: 'text-purple-600 bg-purple-50 border-purple-200',
  EARNED: 'text-green-600 bg-green-50 border-green-200',
  MATERNITY: 'text-pink-600 bg-pink-50 border-pink-200',
  PATERNITY: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  COMPENSATORY: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  LOSS_OF_PAY: 'text-gray-600 bg-gray-50 border-gray-200',
  BEREAVEMENT: 'text-slate-600 bg-slate-50 border-slate-200',
  MARRIAGE: 'text-orange-600 bg-orange-50 border-orange-200',
  SABBATICAL: 'text-teal-600 bg-teal-50 border-teal-200',
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

export function LeaveBalanceCard({ balance, onClick }: LeaveBalanceCardProps) {
  const colorClass = leaveTypeColors[balance.leaveType] || 'text-gray-600 bg-gray-50 border-gray-200'
  const displayName = leaveTypeNames[balance.leaveType] || balance.leaveType
  const usedPercentage = balance.allocated > 0 ? (balance.used / balance.allocated) * 100 : 0

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md border-2',
        colorClass
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{displayName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-3xl font-bold">{balance.available}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm font-medium">
              {balance.used} / {balance.allocated}
            </p>
            <p className="text-xs text-muted-foreground">Used / Total</p>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={usedPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{balance.approved} Approved</span>
            {balance.pending > 0 && (
              <span className="text-yellow-600 font-medium">{balance.pending} Pending</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
