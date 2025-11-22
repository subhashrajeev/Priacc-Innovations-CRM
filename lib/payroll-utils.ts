/**
 * Payroll Utility Functions
 * Handles salary calculations, deductions, and tax computations
 */

export interface SalaryComponents {
  basic: number
  hra: number
  specialAllowance: number
  conveyance: number
  medicalAllowance: number
  otherAllowances: number
}

export interface Deductions {
  pf: number
  esi: number
  professionalTax: number
  tds: number
  lop: number
  otherDeductions: number
}

export interface PayslipCalculation {
  earnings: SalaryComponents & {
    bonus: number
    incentives: number
    overtime: number
  }
  grossEarnings: number
  deductions: Deductions
  totalDeductions: number
  netPay: number
}

/**
 * Calculate Gross Salary from components
 */
export function calculateGrossSalary(components: SalaryComponents): number {
  const { basic, hra, specialAllowance, conveyance, medicalAllowance, otherAllowances } = components
  return basic + hra + specialAllowance + conveyance + medicalAllowance + otherAllowances
}

/**
 * Calculate Provident Fund (PF) - 12% of Basic Salary
 * Maximum basic salary for PF calculation is ₹15,000
 */
export function calculatePF(basicSalary: number): number {
  const pfCap = 15000
  const pfRate = 0.12
  const pfBase = Math.min(basicSalary, pfCap)
  return Math.round(pfBase * pfRate)
}

/**
 * Calculate Employee State Insurance (ESI) - 0.75% of Gross Salary
 * Applicable only if gross salary is ≤ ₹21,000
 */
export function calculateESI(grossSalary: number): number {
  const esiLimit = 21000
  const esiRate = 0.0075 // Employee contribution

  if (grossSalary <= esiLimit) {
    return Math.round(grossSalary * esiRate)
  }
  return 0
}

/**
 * Calculate Professional Tax (PT) - State specific
 * This is for Maharashtra
 */
export function calculateProfessionalTax(grossSalary: number, month: number): number {
  // Maharashtra PT slab (monthly)
  if (grossSalary <= 7500) return 0
  if (grossSalary <= 10000) return 175

  // February has higher PT
  if (month === 2) {
    return 300
  }

  return 200
}

/**
 * Calculate Tax Deducted at Source (TDS)
 * Based on annual income and tax regime
 */
export function calculateTDS(
  annualIncome: number,
  deductions: {
    section80C?: number
    section80D?: number
    hraExemption?: number
    nps?: number
    homeLoanInterest?: number
  } = {},
  useOldRegime: boolean = false
): number {
  let taxableIncome = annualIncome

  if (useOldRegime) {
    // Old regime with deductions
    const totalDeductions = (deductions.section80C || 0) +
                           (deductions.section80D || 0) +
                           (deductions.hraExemption || 0) +
                           (deductions.nps || 0) +
                           (deductions.homeLoanInterest || 0)

    // Cap section 80C at 1.5L
    const section80CDeduction = Math.min(deductions.section80C || 0, 150000)
    taxableIncome = annualIncome - section80CDeduction -
                   (totalDeductions - (deductions.section80C || 0))
  }

  // Calculate tax based on new regime (FY 2024-25)
  let tax = 0

  if (taxableIncome <= 300000) {
    tax = 0
  } else if (taxableIncome <= 700000) {
    tax = (taxableIncome - 300000) * 0.05
  } else if (taxableIncome <= 1000000) {
    tax = 20000 + (taxableIncome - 700000) * 0.10
  } else if (taxableIncome <= 1200000) {
    tax = 50000 + (taxableIncome - 1000000) * 0.15
  } else if (taxableIncome <= 1500000) {
    tax = 80000 + (taxableIncome - 1200000) * 0.20
  } else {
    tax = 140000 + (taxableIncome - 1500000) * 0.30
  }

  // Add 4% cess
  tax = tax * 1.04

  // Apply rebate under section 87A (if applicable)
  if (taxableIncome <= 700000) {
    tax = Math.max(0, tax - 25000)
  }

  return Math.round(tax)
}

/**
 * Calculate monthly TDS
 */
export function calculateMonthlyTDS(
  annualIncome: number,
  deductions: Parameters<typeof calculateTDS>[1] = {},
  useOldRegime: boolean = false
): number {
  const annualTDS = calculateTDS(annualIncome, deductions, useOldRegime)
  return Math.round(annualTDS / 12)
}

/**
 * Calculate Loss of Pay (LOP)
 * Based on days absent
 */
export function calculateLOP(
  monthlySalary: number,
  totalWorkingDays: number,
  daysAbsent: number
): number {
  if (daysAbsent === 0) return 0
  const perDaySalary = monthlySalary / totalWorkingDays
  return Math.round(perDaySalary * daysAbsent)
}

/**
 * Calculate HRA Exemption
 * Minimum of:
 * 1. Actual HRA received
 * 2. 50% of basic salary (metro) or 40% (non-metro)
 * 3. Rent paid - 10% of basic salary
 */
export function calculateHRAExemption(
  basicSalary: number,
  hraReceived: number,
  rentPaid: number,
  isMetro: boolean = true
): number {
  const actualHRA = hraReceived
  const percentOfBasic = isMetro ? basicSalary * 0.5 : basicSalary * 0.4
  const rentMinusTenPercent = Math.max(0, rentPaid - (basicSalary * 0.1))

  const exemption = Math.min(actualHRA, percentOfBasic, rentMinusTenPercent)
  return Math.round(Math.max(0, exemption))
}

/**
 * Calculate total deductions
 */
export function calculateDeductions(
  grossSalary: number,
  basicSalary: number,
  month: number,
  additionalDeductions: Partial<Deductions> = {}
): Deductions {
  return {
    pf: additionalDeductions.pf ?? calculatePF(basicSalary),
    esi: additionalDeductions.esi ?? calculateESI(grossSalary),
    professionalTax: additionalDeductions.professionalTax ?? calculateProfessionalTax(grossSalary, month),
    tds: additionalDeductions.tds ?? 0,
    lop: additionalDeductions.lop ?? 0,
    otherDeductions: additionalDeductions.otherDeductions ?? 0,
  }
}

/**
 * Calculate Net Pay
 */
export function calculateNetPay(grossSalary: number, deductions: Deductions): number {
  const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0)
  return Math.round(grossSalary - totalDeductions)
}

/**
 * Complete payslip calculation
 */
export function calculatePayslip(
  salaryComponents: SalaryComponents,
  month: number,
  year: number,
  attendance: {
    totalWorkingDays: number
    daysPresent: number
    daysAbsent: number
    paidLeaves: number
    unpaidLeaves: number
  },
  additionalEarnings: {
    bonus?: number
    incentives?: number
    overtime?: number
  } = {},
  annualIncome?: number,
  taxDeductions?: Parameters<typeof calculateTDS>[1]
): PayslipCalculation {
  // Calculate gross from components
  const baseGross = calculateGrossSalary(salaryComponents)

  // Add additional earnings
  const bonus = additionalEarnings.bonus || 0
  const incentives = additionalEarnings.incentives || 0
  const overtime = additionalEarnings.overtime || 0

  const grossEarnings = baseGross + bonus + incentives + overtime

  // Calculate LOP if there are unpaid leaves
  const lop = calculateLOP(
    baseGross,
    attendance.totalWorkingDays,
    attendance.unpaidLeaves
  )

  // Calculate deductions
  const monthlyTDS = annualIncome
    ? calculateMonthlyTDS(annualIncome, taxDeductions, false)
    : 0

  const deductions = calculateDeductions(
    baseGross,
    salaryComponents.basic,
    month,
    {
      tds: monthlyTDS,
      lop: lop,
    }
  )

  const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0)
  const netPay = grossEarnings - totalDeductions

  return {
    earnings: {
      ...salaryComponents,
      bonus,
      incentives,
      overtime,
    },
    grossEarnings,
    deductions,
    totalDeductions,
    netPay,
  }
}

/**
 * Get working days in a month (excluding Sundays)
 */
export function getWorkingDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  let workingDays = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay()

    // Exclude Sundays (0 = Sunday)
    if (dayOfWeek !== 0) {
      workingDays++
    }
  }

  return workingDays
}

/**
 * Format month name
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[month - 1] || 'Unknown'
}

/**
 * Get financial year from month and year
 */
export function getFinancialYearFromDate(month: number, year: number): string {
  if (month < 4) {
    // Jan, Feb, Mar - previous FY
    return `${year - 1}-${year.toString().slice(-2)}`
  } else {
    // Apr onwards - current FY
    return `${year}-${(year + 1).toString().slice(-2)}`
  }
}

/**
 * Calculate CTC breakdown from annual CTC
 * Standard breakdown:
 * - Basic: 40% of CTC
 * - HRA: 50% of Basic
 * - Special Allowance: Remaining
 * - Conveyance: Fixed ₹1,600/month
 * - Medical: Fixed ₹1,250/month
 */
export function calculateCTCBreakdown(annualCTC: number): {
  annual: SalaryComponents
  monthly: SalaryComponents
} {
  // Fixed components (annual)
  const conveyance = 1600 * 12 // ₹19,200
  const medicalAllowance = 1250 * 12 // ₹15,000

  // Basic salary - 40% of CTC
  const basic = Math.round((annualCTC * 0.40))

  // HRA - 50% of basic
  const hra = Math.round(basic * 0.50)

  // Special allowance - remaining amount
  const specialAllowance = annualCTC - basic - hra - conveyance - medicalAllowance

  const annual = {
    basic,
    hra,
    specialAllowance,
    conveyance,
    medicalAllowance,
    otherAllowances: 0,
  }

  const monthly = {
    basic: Math.round(basic / 12),
    hra: Math.round(hra / 12),
    specialAllowance: Math.round(specialAllowance / 12),
    conveyance: 1600,
    medicalAllowance: 1250,
    otherAllowances: 0,
  }

  return { annual, monthly }
}

/**
 * Validate salary structure
 */
export function validateSalaryStructure(components: SalaryComponents): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (components.basic <= 0) {
    errors.push('Basic salary must be greater than 0')
  }

  if (components.hra < 0) {
    errors.push('HRA cannot be negative')
  }

  const grossSalary = calculateGrossSalary(components)
  if (grossSalary <= 0) {
    errors.push('Gross salary must be greater than 0')
  }

  // Basic should typically be 40-50% of gross
  const basicPercentage = (components.basic / grossSalary) * 100
  if (basicPercentage < 30 || basicPercentage > 60) {
    errors.push(`Basic salary should be 30-60% of gross salary (currently ${basicPercentage.toFixed(1)}%)`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Generate payslip number
 */
export function generatePayslipNumber(
  employeeCode: string,
  month: number,
  year: number
): string {
  const monthStr = month.toString().padStart(2, '0')
  const yearStr = year.toString()
  return `PAY-${employeeCode}-${yearStr}${monthStr}`
}

/**
 * Calculate year-to-date (YTD) totals
 */
export function calculateYTD(payslips: Array<{
  grossEarnings: number
  totalDeductions: number
  netPay: number
}>): {
  totalEarnings: number
  totalDeductions: number
  totalNetPay: number
} {
  const totalEarnings = payslips.reduce((sum, p) => sum + p.grossEarnings, 0)
  const totalDeductions = payslips.reduce((sum, p) => sum + p.totalDeductions, 0)
  const totalNetPay = payslips.reduce((sum, p) => sum + p.netPay, 0)

  return {
    totalEarnings: Math.round(totalEarnings),
    totalDeductions: Math.round(totalDeductions),
    totalNetPay: Math.round(totalNetPay),
  }
}
