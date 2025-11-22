'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PayslipCard from '@/components/payroll/payslip-card'
import { formatCurrency } from '@/lib/utils'
import { getMonthName } from '@/lib/payroll-utils'
import { Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export default function PayrollPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [payslips, setPayslips] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch stats
      const statsRes = await fetch('/api/payroll/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.data)
      }

      // Fetch payslips (last 12 months)
      const payslipsRes = await fetch('/api/payroll/payslip?limit=12')
      if (payslipsRes.ok) {
        const payslipsData = await payslipsRes.json()
        setPayslips(payslipsData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const currentMonthPayslip = stats?.currentMonth?.payslip
  const ytd = stats?.yearToDate || {}

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Payslips</h1>
        <p className="text-gray-600">
          View your salary slips, earnings, and tax declarations
        </p>
      </div>

      {/* Current Month Payslip */}
      {currentMonthPayslip ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Current Month - {getMonthName(stats.currentMonth.month)} {stats.currentMonth.year}
          </h2>
          <PayslipCard payslip={currentMonthPayslip} />
        </div>
      ) : (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardContent className="py-6">
            <p className="text-yellow-800 text-center">
              Your payslip for the current month has not been generated yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Year-to-Date Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Year-to-Date Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Earnings</CardDescription>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(ytd.totalEarnings || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                From {ytd.totalPayslips || 0} payslips
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Deductions</CardDescription>
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(ytd.totalDeductions || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Including PF, ESI, TDS
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Net Pay Received</CardDescription>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(ytd.totalNetPay || 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Take-home amount
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tax Summary</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">TDS Deducted (YTD)</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(ytd.totalTDS || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">PF Contribution (YTD)</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(ytd.totalPF || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslip History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Payslip History</h2>
        <Tabs defaultValue="recent" className="w-full">
          <TabsList>
            <TabsTrigger value="recent">Recent (12 Months)</TabsTrigger>
            <TabsTrigger value="all">All Payslips</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="mt-6">
            {payslips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {payslips.map((payslip) => (
                  <PayslipCard key={payslip.id} payslip={payslip} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No payslips available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="all" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">
                  Showing all payslips (feature under development)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
