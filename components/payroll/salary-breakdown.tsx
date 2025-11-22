'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface SalaryBreakdownProps {
  salary: {
    ctc: number
    basicSalary: number
    hra: number
    specialAllowance: number
    conveyance: number
    medicalAllowance: number
    otherAllowances: number
    pf: number
    esi: number
    professionalTax: number
    grossSalary: number
    netSalary: number
  }
  showChart?: boolean
}

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#e0e7ff']

export default function SalaryBreakdown({ salary, showChart = true }: SalaryBreakdownProps) {
  const earningsData = [
    { name: 'Basic Salary', value: salary.basicSalary, color: '#2563eb' },
    { name: 'HRA', value: salary.hra, color: '#3b82f6' },
    { name: 'Special Allowance', value: salary.specialAllowance, color: '#60a5fa' },
    { name: 'Conveyance', value: salary.conveyance, color: '#93c5fd' },
    { name: 'Medical', value: salary.medicalAllowance, color: '#dbeafe' },
  ]

  if (salary.otherAllowances > 0) {
    earningsData.push({
      name: 'Other Allowances',
      value: salary.otherAllowances,
      color: '#e0e7ff'
    })
  }

  const deductionsData = [
    { name: 'PF', value: salary.pf, color: '#ef4444' },
    { name: 'ESI', value: salary.esi, color: '#f87171' },
    { name: 'Professional Tax', value: salary.professionalTax, color: '#fca5a5' },
  ]

  return (
    <div className="space-y-6">
      {/* CTC Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Cost to Company (CTC)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700 mb-1">Annual CTC</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(salary.ctc)}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-sm text-green-700 mb-1">Monthly Gross</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(salary.grossSalary)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-700 mb-1">Monthly Net</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(salary.netSalary)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Earnings Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Basic Salary</span>
                <span className="font-semibold">{formatCurrency(salary.basicSalary)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">House Rent Allowance (HRA)</span>
                <span className="font-semibold">{formatCurrency(salary.hra)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Special Allowance</span>
                <span className="font-semibold">{formatCurrency(salary.specialAllowance)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Conveyance</span>
                <span className="font-semibold">{formatCurrency(salary.conveyance)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Medical Allowance</span>
                <span className="font-semibold">{formatCurrency(salary.medicalAllowance)}</span>
              </div>
              {salary.otherAllowances > 0 && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium text-gray-700">Other Allowances</span>
                  <span className="font-semibold">{formatCurrency(salary.otherAllowances)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-3 bg-blue-50 px-3 rounded-lg mt-2">
                <span className="font-semibold text-blue-900">Gross Salary</span>
                <span className="font-bold text-blue-900">{formatCurrency(salary.grossSalary)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deductions Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Provident Fund (PF)</span>
                <span className="font-semibold text-red-600">{formatCurrency(salary.pf)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Employee State Insurance (ESI)</span>
                <span className="font-semibold text-red-600">{formatCurrency(salary.esi)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-gray-700">Professional Tax</span>
                <span className="font-semibold text-red-600">{formatCurrency(salary.professionalTax)}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-red-50 px-3 rounded-lg mt-2">
                <span className="font-semibold text-red-900">Total Deductions</span>
                <span className="font-bold text-red-900">
                  {formatCurrency(salary.pf + salary.esi + salary.professionalTax)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-green-50 px-3 rounded-lg border-2 border-green-200">
                <span className="font-semibold text-green-900">Net Salary (Take Home)</span>
                <span className="font-bold text-green-900">{formatCurrency(salary.netSalary)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {showChart && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={earningsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {earningsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deductions Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deductionsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deductionsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
