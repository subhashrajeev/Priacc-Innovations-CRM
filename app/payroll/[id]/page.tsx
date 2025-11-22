'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import PayslipTemplate from '@/components/payroll/payslip-template'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function PayslipDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [payslip, setPayslip] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchPayslip()
    }
  }, [params.id])

  const fetchPayslip = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payroll/payslip/${params.id}`)

      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have permission to view this payslip')
        } else if (response.status === 404) {
          setError('Payslip not found')
        } else {
          setError('Failed to load payslip')
        }
        return
      }

      const data = await response.json()
      setPayslip(data.data)
    } catch (error) {
      console.error('Error fetching payslip:', error)
      setError('An error occurred while loading the payslip')
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

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-12 text-center">
            <p className="text-red-800 text-lg mb-4">{error}</p>
            <Button onClick={() => router.push('/payroll')}>
              Go to Payroll
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!payslip) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Payslip not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="print:hidden mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payroll
        </Button>
      </div>

      <PayslipTemplate payslip={payslip} />
    </div>
  )
}
