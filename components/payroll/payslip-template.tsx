'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import { getMonthName } from '@/lib/payroll-utils'
import { Button } from '@/components/ui/button'
import { Printer, Download } from 'lucide-react'

interface PayslipTemplateProps {
  payslip: {
    id: string
    month: number
    year: number
    basicSalary: number
    hra: number
    specialAllowance: number
    conveyance: number
    medicalAllowance: number
    otherAllowances: number
    bonus: number
    incentives: number
    overtime: number
    grossEarnings: number
    pf: number
    esi: number
    professionalTax: number
    tds: number
    lop: number
    otherDeductions: number
    totalDeductions: number
    netPay: number
    totalWorkingDays: number
    daysPresent: number
    daysAbsent: number
    paidLeaves: number
    unpaidLeaves: number
    employee: {
      employeeCode: string
      firstName: string
      lastName: string
      panNumber?: string | null
      accountNumber?: string | null
      department?: {
        name: string
      } | null
      designation?: {
        title: string
      } | null
    }
  }
}

export default function PayslipTemplate({ payslip }: PayslipTemplateProps) {
  const monthName = getMonthName(payslip.month)

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    window.open(`/api/payroll/payslip/${payslip.id}/pdf`, '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Print/Download Actions (hidden in print) */}
      <div className="mb-4 flex gap-2 justify-end print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Payslip Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm print:shadow-none print:border-0">
        {/* Header */}
        <div className="border-b-4 border-blue-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-1">
            Priacc Innovations
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Innovating Tomorrow, Today
          </p>
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            SALARY SLIP
          </h2>
          <p className="text-gray-600">
            For the month of {monthName} {payslip.year}
          </p>
        </div>

        <div className="p-8">
          {/* Employee Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
              Employee Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex py-2">
                <span className="font-semibold text-gray-700 w-40">Employee Code:</span>
                <span className="text-gray-900">{payslip.employee.employeeCode}</span>
              </div>
              <div className="flex py-2">
                <span className="font-semibold text-gray-700 w-40">Employee Name:</span>
                <span className="text-gray-900">
                  {payslip.employee.firstName} {payslip.employee.lastName}
                </span>
              </div>
              <div className="flex py-2">
                <span className="font-semibold text-gray-700 w-40">Department:</span>
                <span className="text-gray-900">
                  {payslip.employee.department?.name || 'N/A'}
                </span>
              </div>
              <div className="flex py-2">
                <span className="font-semibold text-gray-700 w-40">Designation:</span>
                <span className="text-gray-900">
                  {payslip.employee.designation?.title || 'N/A'}
                </span>
              </div>
              <div className="flex py-2">
                <span className="font-semibold text-gray-700 w-40">PAN Number:</span>
                <span className="text-gray-900">
                  {payslip.employee.panNumber || 'N/A'}
                </span>
              </div>
              <div className="flex py-2">
                <span className="font-semibold text-gray-700 w-40">Bank Account:</span>
                <span className="text-gray-900">
                  {payslip.employee.accountNumber || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
              Attendance Summary
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="flex py-2">
                <span className="font-semibold text-gray-700 w-40">Total Days:</span>
                <span className="text-gray-900">{payslip.totalWorkingDays}</span>
              </div>
              <div className="flex py-2">
                <span className="font-semibold text-gray-700 w-40">Present:</span>
                <span className="text-gray-900">{payslip.daysPresent}</span>
              </div>
              <div className="flex py-2">
                <span className="font-semibold text-gray-700 w-40">Paid Leaves:</span>
                <span className="text-gray-900">{payslip.paidLeaves}</span>
              </div>
              <div className="flex py-2">
                <span className="font-semibold text-gray-700 w-40">LOP Days:</span>
                <span className="text-gray-900">{payslip.unpaidLeaves}</span>
              </div>
            </div>
          </div>

          {/* Earnings and Deductions Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
              Earnings & Deductions
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Earnings
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Deductions
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-sm">Basic Salary</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(payslip.basicSalary)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">Provident Fund (PF)</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(payslip.pf)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-sm">House Rent Allowance</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(payslip.hra)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">ESI</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(payslip.esi)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-sm">Special Allowance</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(payslip.specialAllowance)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">Professional Tax</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(payslip.professionalTax)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-sm">Conveyance</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(payslip.conveyance)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">TDS</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(payslip.tds)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 text-sm">Medical Allowance</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(payslip.medicalAllowance)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">Loss of Pay</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-right font-mono">
                    {formatCurrency(payslip.lop)}
                  </td>
                </tr>
                {(payslip.bonus > 0 || payslip.incentives > 0) && (
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-sm">
                      {payslip.bonus > 0 ? 'Bonus' : payslip.incentives > 0 ? 'Incentives' : ''}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right font-mono">
                      {formatCurrency(payslip.bonus + payslip.incentives)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">Other Deductions</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm text-right font-mono">
                      {formatCurrency(payslip.otherDeductions)}
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-50 font-semibold">
                  <td className="border border-gray-300 px-4 py-3 text-sm">Gross Earnings</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-right font-mono">
                    {formatCurrency(payslip.grossEarnings)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm">Total Deductions</td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-right font-mono">
                    {formatCurrency(payslip.totalDeductions)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Pay */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-blue-900">
                Net Pay (Take Home)
              </span>
              <span className="text-3xl font-bold text-blue-900 font-mono">
                {formatCurrency(payslip.netPay)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 pt-6 border-t border-gray-200">
            <p className="mb-2">
              This is a computer-generated payslip and does not require a signature.
            </p>
            <p className="mb-2">
              For any queries, please contact the HR department.
            </p>
            <p className="text-xs text-gray-500 mt-4">
              © {payslip.year} Priacc Innovations. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
