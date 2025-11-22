import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isHR } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getMonthName } from '@/lib/payroll-utils'

/**
 * GET /api/payroll/payslip/[id]/pdf
 * Generate and download payslip as PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payslip = await prisma.payslip.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        salary: true,
      },
    })

    if (!payslip) {
      return NextResponse.json(
        { error: 'Payslip not found' },
        { status: 404 }
      )
    }

    // Employees can only download their own payslips
    if (!isHR(session.user.role) && payslip.employeeId !== session.user.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate HTML for PDF
    const html = generatePayslipHTML(payslip)

    // For now, return HTML that can be used with browser print or PDF library
    // In production, use a library like puppeteer or pdfkit
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="payslip-${payslip.employee.employeeCode}-${payslip.year}-${payslip.month.toString().padStart(2, '0')}.html"`,
      },
    })
  } catch (error) {
    console.error('Error generating payslip PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate payslip PDF' },
      { status: 500 }
    )
  }
}

function generatePayslipHTML(payslip: any): string {
  const monthName = getMonthName(payslip.month)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - ${payslip.employee.employeeCode} - ${monthName} ${payslip.year}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', sans-serif;
      padding: 40px;
      background-color: #f5f5f5;
    }

    .payslip-container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border: 1px solid #ddd;
    }

    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 5px;
    }

    .company-tagline {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }

    .document-title {
      font-size: 18px;
      font-weight: bold;
      margin-top: 15px;
      color: #333;
    }

    .period {
      font-size: 16px;
      color: #666;
      margin-top: 5px;
    }

    .section {
      margin-bottom: 25px;
    }

    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 12px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e5e7eb;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .info-item {
      display: flex;
      padding: 8px 0;
    }

    .info-label {
      font-weight: 600;
      color: #555;
      width: 150px;
    }

    .info-value {
      color: #333;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      background-color: #f9fafb;
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }

    td {
      color: #4b5563;
    }

    .amount {
      text-align: right;
      font-family: 'Courier New', monospace;
    }

    .total-row {
      font-weight: bold;
      background-color: #f3f4f6;
      border-top: 2px solid #d1d5db;
    }

    .net-pay-section {
      margin-top: 30px;
      padding: 20px;
      background-color: #eff6ff;
      border: 2px solid #2563eb;
      border-radius: 8px;
    }

    .net-pay-label {
      font-size: 18px;
      color: #1e40af;
      font-weight: 600;
    }

    .net-pay-amount {
      font-size: 28px;
      color: #1e40af;
      font-weight: bold;
      margin-top: 5px;
      font-family: 'Courier New', monospace;
    }

    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }

    @media print {
      body {
        padding: 0;
        background-color: white;
      }

      .payslip-container {
        border: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="payslip-container">
    <!-- Header -->
    <div class="header">
      <div class="company-name">Priacc Innovations</div>
      <div class="company-tagline">Innovating Tomorrow, Today</div>
      <div class="document-title">SALARY SLIP</div>
      <div class="period">For the month of ${monthName} ${payslip.year}</div>
    </div>

    <!-- Employee Information -->
    <div class="section">
      <div class="section-title">Employee Information</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Employee Code:</span>
          <span class="info-value">${payslip.employee.employeeCode}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Employee Name:</span>
          <span class="info-value">${payslip.employee.firstName} ${payslip.employee.lastName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Department:</span>
          <span class="info-value">${payslip.employee.department?.name || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Designation:</span>
          <span class="info-value">${payslip.employee.designation?.title || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">PAN Number:</span>
          <span class="info-value">${payslip.employee.panNumber || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Bank Account:</span>
          <span class="info-value">${payslip.employee.accountNumber || 'N/A'}</span>
        </div>
      </div>
    </div>

    <!-- Attendance Summary -->
    <div class="section">
      <div class="section-title">Attendance Summary</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Total Working Days:</span>
          <span class="info-value">${payslip.totalWorkingDays}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Days Present:</span>
          <span class="info-value">${payslip.daysPresent}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Paid Leaves:</span>
          <span class="info-value">${payslip.paidLeaves}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Unpaid Leaves:</span>
          <span class="info-value">${payslip.unpaidLeaves}</span>
        </div>
      </div>
    </div>

    <!-- Earnings and Deductions -->
    <div class="section">
      <div class="section-title">Earnings & Deductions</div>
      <table>
        <thead>
          <tr>
            <th>Earnings</th>
            <th class="amount">Amount</th>
            <th>Deductions</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic Salary</td>
            <td class="amount">${formatCurrency(payslip.basicSalary)}</td>
            <td>Provident Fund (PF)</td>
            <td class="amount">${formatCurrency(payslip.pf)}</td>
          </tr>
          <tr>
            <td>House Rent Allowance (HRA)</td>
            <td class="amount">${formatCurrency(payslip.hra)}</td>
            <td>Employee State Insurance (ESI)</td>
            <td class="amount">${formatCurrency(payslip.esi)}</td>
          </tr>
          <tr>
            <td>Special Allowance</td>
            <td class="amount">${formatCurrency(payslip.specialAllowance)}</td>
            <td>Professional Tax</td>
            <td class="amount">${formatCurrency(payslip.professionalTax)}</td>
          </tr>
          <tr>
            <td>Conveyance Allowance</td>
            <td class="amount">${formatCurrency(payslip.conveyance)}</td>
            <td>Tax Deducted at Source (TDS)</td>
            <td class="amount">${formatCurrency(payslip.tds)}</td>
          </tr>
          <tr>
            <td>Medical Allowance</td>
            <td class="amount">${formatCurrency(payslip.medicalAllowance)}</td>
            <td>Loss of Pay (LOP)</td>
            <td class="amount">${formatCurrency(payslip.lop)}</td>
          </tr>
          ${payslip.bonus > 0 ? `
          <tr>
            <td>Bonus</td>
            <td class="amount">${formatCurrency(payslip.bonus)}</td>
            <td>Other Deductions</td>
            <td class="amount">${formatCurrency(payslip.otherDeductions)}</td>
          </tr>
          ` : ''}
          ${payslip.incentives > 0 ? `
          <tr>
            <td>Incentives</td>
            <td class="amount">${formatCurrency(payslip.incentives)}</td>
            <td></td>
            <td></td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td>Gross Earnings</td>
            <td class="amount">${formatCurrency(payslip.grossEarnings)}</td>
            <td>Total Deductions</td>
            <td class="amount">${formatCurrency(payslip.totalDeductions)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Net Pay -->
    <div class="net-pay-section">
      <div class="net-pay-label">Net Pay (Take Home)</div>
      <div class="net-pay-amount">${formatCurrency(payslip.netPay)}</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This is a computer-generated payslip and does not require a signature.</p>
      <p>For any queries, please contact the HR department.</p>
      <p style="margin-top: 10px;">© ${payslip.year} Priacc Innovations. All rights reserved.</p>
    </div>
  </div>

  <script>
    // Auto-print when opened
    window.onload = function() {
      // Uncomment to enable auto-print
      // window.print();
    }
  </script>
</body>
</html>
  `.trim()
}
