import {
  UserRole,
  UserStatus,
  EmployeeType,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
  ProjectStatus,
  TaskStatus,
  ExpenseStatus,
  PerformanceRating,
  GoalStatus,
  ApplicationStatus,
  ClientStatus
} from '@prisma/client'

export type {
  UserRole,
  UserStatus,
  EmployeeType,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
  ProjectStatus,
  TaskStatus,
  ExpenseStatus,
  PerformanceRating,
  GoalStatus,
  ApplicationStatus,
  ClientStatus
}

export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  onLeaveToday: number
  pendingLeaves: number
  totalProjects: number
  activeProjects: number
  totalClients: number
  monthlyRevenue: number
  pendingExpenses: number
  upcomingInterviews: number
}

export interface AttendanceSummary {
  present: number
  absent: number
  onLeave: number
  workFromHome: number
  total: number
}

export interface LeaveBalance {
  leaveType: LeaveType
  total: number
  used: number
  pending: number
  available: number
}

export interface EmployeeProfile {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  designation: string
  department: string
  dateOfJoining: Date
  profilePhoto?: string
  role: UserRole
  status: UserStatus
}

export interface PayrollSummary {
  month: number
  year: number
  totalEmployees: number
  totalGrossPay: number
  totalDeductions: number
  totalNetPay: number
  processed: number
  pending: number
}

export interface ProjectMetrics {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onHoldProjects: number
  totalRevenue: number
  utilizationRate: number
}

export interface RecruitmentMetrics {
  openPositions: number
  totalApplications: number
  shortlisted: number
  interviewsScheduled: number
  offersExtended: number
  avgTimeToHire: number
}

export interface NotificationData {
  type: string
  title: string
  message: string
  link?: string
  timestamp: Date
  read: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface FilterOptions {
  search?: string
  department?: string
  designation?: string
  status?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
