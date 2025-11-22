'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import TaxDeclarationForm from '@/components/payroll/tax-declaration-form'
import { getFinancialYear, formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, FileText, CheckCircle2, Clock } from 'lucide-react'

export default function TaxDeclarationPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [financialYear, setFinancialYear] = useState(getFinancialYear())
  const [declaration, setDeclaration] = useState<any>(null)
  const [declarations, setDeclarations] = useState<any[]>([])

  useEffect(() => {
    fetchDeclarations()
  }, [financialYear])

  const fetchDeclarations = async () => {
    try {
      setLoading(true)

      // Fetch current declaration for selected FY
      const response = await fetch(`/api/payroll/tax-declaration?financialYear=${financialYear}`)
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          setDeclaration(data.data[0])
        } else {
          setDeclaration(null)
        }
      }

      // Fetch all declarations
      const allResponse = await fetch('/api/payroll/tax-declaration')
      if (allResponse.ok) {
        const allData = await allResponse.json()
        setDeclarations(allData.data || [])
      }
    } catch (error) {
      console.error('Error fetching tax declarations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    fetchDeclarations()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tax Declaration</h1>
        <p className="text-gray-600">
          Declare your investments and tax-saving instruments
        </p>
      </div>

      {/* Financial Year Selector */}
      <div className="mb-6">
        <Label htmlFor="fy">Financial Year</Label>
        <Select value={financialYear} onValueChange={setFinancialYear}>
          <SelectTrigger className="w-[200px] mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024-25">FY 2024-25</SelectItem>
            <SelectItem value="2023-24">FY 2023-24</SelectItem>
            <SelectItem value="2022-23">FY 2022-23</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Declaration Form */}
        <div className="lg:col-span-2">
          <TaxDeclarationForm
            declaration={declaration}
            financialYear={financialYear}
            onSave={handleSave}
          />
        </div>

        {/* Previous Declarations */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Previous Declarations</CardTitle>
              <CardDescription>Your tax declaration history</CardDescription>
            </CardHeader>
            <CardContent>
              {declarations.length > 0 ? (
                <div className="space-y-3">
                  {declarations.map((decl) => (
                    <div
                      key={decl.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        decl.financialYear === financialYear
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setFinancialYear(decl.financialYear)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">FY {decl.financialYear}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatDate(decl.createdAt, 'short')}
                          </p>
                        </div>
                        {decl.submittedAt ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Submitted
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm text-gray-700">
                          Total: <span className="font-semibold">
                            {formatCurrency(
                              decl.ppf +
                              decl.elss +
                              decl.lifInsurance +
                              decl.homeLoanPrincipal +
                              decl.tuitionFees +
                              decl.nsc +
                              decl.healthInsurance +
                              decl.hraExemption +
                              decl.nps +
                              decl.homeLoanInterest
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No previous declarations</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Section 80C:</strong> Maximum deduction of ₹1.5L including PPF, ELSS,
                Life Insurance, Home Loan Principal, etc.
              </p>
              <p>
                <strong>Section 80D:</strong> Health Insurance premium deduction up to ₹25,000
                (₹50,000 for senior citizens)
              </p>
              <p>
                <strong>HRA:</strong> House Rent Allowance exemption based on rent paid and salary
              </p>
              <p>
                <strong>NPS:</strong> Additional ₹50,000 deduction under 80CCD(1B)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
