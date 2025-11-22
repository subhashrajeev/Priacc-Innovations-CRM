'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { getMonthName } from '@/lib/payroll-utils'
import { Download, Eye, FileText } from 'lucide-react'
import Link from 'next/link'

interface PayslipCardProps {
  payslip: {
    id: string
    month: number
    year: number
    grossEarnings: number
    totalDeductions: number
    netPay: number
    status: string
    paidDate?: Date | null
  }
  showActions?: boolean
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  GENERATED: 'bg-blue-100 text-blue-800',
  SENT: 'bg-purple-100 text-purple-800',
  PAID: 'bg-green-100 text-green-800',
}

export default function PayslipCard({ payslip, showActions = true }: PayslipCardProps) {
  const monthName = getMonthName(payslip.month)

  const handleDownload = async () => {
    try {
      // Open PDF in new window
      window.open(`/api/payroll/payslip/${payslip.id}/pdf`, '_blank')
    } catch (error) {
      console.error('Error downloading payslip:', error)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {monthName} {payslip.year}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Payslip for the month
              </p>
            </div>
          </div>
          <Badge
            className={statusColors[payslip.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}
          >
            {payslip.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Net Pay - Prominent Display */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 font-medium mb-1">Net Pay</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(payslip.netPay)}
            </p>
          </div>

          {/* Earnings and Deductions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">Gross Earnings</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(payslip.grossEarnings)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Deductions</p>
              <p className="text-sm font-semibold text-red-600">
                {formatCurrency(payslip.totalDeductions)}
              </p>
            </div>
          </div>

          {/* Paid Date */}
          {payslip.paidDate && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                Paid on: {new Date(payslip.paidDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Link href={`/payroll/${payslip.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
