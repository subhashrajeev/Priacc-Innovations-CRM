'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Upload, Save, Send } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface TaxDeclarationFormProps {
  declaration?: {
    ppf: number
    elss: number
    lifInsurance: number
    homeLoanPrincipal: number
    tuitionFees: number
    nsc: number
    healthInsurance: number
    hraExemption: number
    nps: number
    homeLoanInterest: number
    proofsUrl?: string | null
  }
  financialYear: string
  onSave?: () => void
}

export default function TaxDeclarationForm({
  declaration,
  financialYear,
  onSave,
}: TaxDeclarationFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    ppf: declaration?.ppf || 0,
    elss: declaration?.elss || 0,
    lifInsurance: declaration?.lifInsurance || 0,
    homeLoanPrincipal: declaration?.homeLoanPrincipal || 0,
    tuitionFees: declaration?.tuitionFees || 0,
    nsc: declaration?.nsc || 0,
    healthInsurance: declaration?.healthInsurance || 0,
    hraExemption: declaration?.hraExemption || 0,
    nps: declaration?.nps || 0,
    homeLoanInterest: declaration?.homeLoanInterest || 0,
    proofsUrl: declaration?.proofsUrl || '',
  })

  // Calculate totals
  const section80CTotal = formData.ppf + formData.elss + formData.lifInsurance +
                          formData.homeLoanPrincipal + formData.tuitionFees + formData.nsc
  const section80CLimit = 150000
  const section80CRemaining = Math.max(0, section80CLimit - section80CTotal)

  const totalDeductions = section80CTotal + formData.healthInsurance + formData.nps +
                          formData.homeLoanInterest + formData.hraExemption

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }))
  }

  const handleSubmit = async (submit: boolean = false) => {
    setLoading(true)
    try {
      const response = await fetch('/api/payroll/tax-declaration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          financialYear,
          ...formData,
          submit,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save tax declaration')
      }

      toast({
        title: 'Success',
        description: submit
          ? 'Tax declaration submitted successfully'
          : 'Tax declaration saved as draft',
      })

      if (onSave) onSave()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save tax declaration',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Tax Saving Summary</CardTitle>
          <CardDescription className="text-blue-700">
            Financial Year: {financialYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-blue-700 mb-1">Section 80C Used</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency(section80CTotal)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Remaining: {formatCurrency(section80CRemaining)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700 mb-1">Other Deductions</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency(totalDeductions - section80CTotal)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700 mb-1">Total Tax Savings</p>
              <p className="text-xl font-bold text-blue-900">
                {formatCurrency(totalDeductions)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 80C */}
      <Card>
        <CardHeader>
          <CardTitle>Section 80C Deductions</CardTitle>
          <CardDescription>
            Maximum limit: {formatCurrency(section80CLimit)}
            {section80CTotal > section80CLimit && (
              <span className="text-red-600 ml-2">
                (Exceeds limit by {formatCurrency(section80CTotal - section80CLimit)})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ppf">Public Provident Fund (PPF)</Label>
              <Input
                id="ppf"
                type="number"
                value={formData.ppf}
                onChange={(e) => handleChange('ppf', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="elss">ELSS (Equity Linked Savings Scheme)</Label>
              <Input
                id="elss"
                type="number"
                value={formData.elss}
                onChange={(e) => handleChange('elss', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lifInsurance">Life Insurance Premium</Label>
              <Input
                id="lifInsurance"
                type="number"
                value={formData.lifInsurance}
                onChange={(e) => handleChange('lifInsurance', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homeLoanPrincipal">Home Loan Principal</Label>
              <Input
                id="homeLoanPrincipal"
                type="number"
                value={formData.homeLoanPrincipal}
                onChange={(e) => handleChange('homeLoanPrincipal', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tuitionFees">Tuition Fees (Children)</Label>
              <Input
                id="tuitionFees"
                type="number"
                value={formData.tuitionFees}
                onChange={(e) => handleChange('tuitionFees', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nsc">National Savings Certificate (NSC)</Label>
              <Input
                id="nsc"
                type="number"
                value={formData.nsc}
                onChange={(e) => handleChange('nsc', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Deductions */}
      <Card>
        <CardHeader>
          <CardTitle>Other Deductions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="healthInsurance">Health Insurance (80D)</Label>
              <Input
                id="healthInsurance"
                type="number"
                value={formData.healthInsurance}
                onChange={(e) => handleChange('healthInsurance', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hraExemption">HRA Exemption</Label>
              <Input
                id="hraExemption"
                type="number"
                value={formData.hraExemption}
                onChange={(e) => handleChange('hraExemption', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nps">National Pension Scheme (80CCD)</Label>
              <Input
                id="nps"
                type="number"
                value={formData.nps}
                onChange={(e) => handleChange('nps', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homeLoanInterest">Home Loan Interest (24b)</Label>
              <Input
                id="homeLoanInterest"
                type="number"
                value={formData.homeLoanInterest}
                onChange={(e) => handleChange('homeLoanInterest', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Proofs */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Supporting Documents</CardTitle>
          <CardDescription>
            Upload investment proofs, receipts, and certificates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PDF, JPG, PNG up to 10MB
              </p>
            </div>
            {formData.proofsUrl && (
              <p className="text-sm text-green-600">
                ✓ Documents uploaded
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={loading || section80CTotal > section80CLimit}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Submit Declaration
        </Button>
      </div>
    </div>
  )
}
