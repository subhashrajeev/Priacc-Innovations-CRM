import { z } from 'zod'
import { EmployeeType, Gender, MaritalStatus, UserRole } from '@prisma/client'

// Phone number validation (Indian format)
const phoneRegex = /^[6-9]\d{9}$/

// PAN validation
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

// Aadhar validation
const aadharRegex = /^\d{12}$/

// IFSC Code validation
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const employeePersonalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  middleName: z.string().max(50).optional().nullable(),
  lastName: z.string().min(1, 'Last name is required').max(50),
  displayName: z.string().max(100).optional().nullable(),
  dateOfBirth: z.string().or(z.date()).optional().nullable(),
  gender: z.nativeEnum(Gender).optional().nullable(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional().nullable(),
  bloodGroup: z.string().max(5).optional().nullable(),
  nationality: z.string().max(50).default('Indian'),
})

export const employeeContactInfoSchema = z.object({
  email: z.string().email('Invalid email address'),
  personalEmail: z.string().email('Invalid email address').optional().nullable(),
  phoneNumber: z
    .string()
    .regex(phoneRegex, 'Invalid phone number. Must be 10 digits starting with 6-9')
    .optional()
    .nullable(),
  alternatePhone: z
    .string()
    .regex(phoneRegex, 'Invalid phone number. Must be 10 digits starting with 6-9')
    .optional()
    .nullable(),
  currentAddress: z.string().max(500).optional().nullable(),
  permanentAddress: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).default('India'),
  pincode: z.string().max(10).optional().nullable(),
})

export const employeeEmploymentInfoSchema = z.object({
  employeeCode: z.string().optional(),
  employeeType: z.nativeEnum(EmployeeType).default('FULL_TIME'),
  dateOfJoining: z.string().or(z.date()),
  confirmationDate: z.string().or(z.date()).optional().nullable(),
  probationPeriod: z.number().int().min(0).max(12).optional().nullable(),
  noticePeriod: z.number().int().min(0).max(365).optional().nullable(),
  departmentId: z.string().optional().nullable(),
  designationId: z.string().optional().nullable(),
  reportingManagerId: z.string().optional().nullable(),
  workLocation: z.string().max(200).optional().nullable(),
  role: z.nativeEnum(UserRole).default('EMPLOYEE'),
})

export const employeeDocumentsSchema = z.object({
  profilePhoto: z.string().url().optional().nullable(),
  resumeUrl: z.string().url().optional().nullable(),
  aadharNumber: z
    .string()
    .regex(aadharRegex, 'Invalid Aadhar number. Must be 12 digits')
    .optional()
    .nullable(),
  panNumber: z
    .string()
    .regex(panRegex, 'Invalid PAN number. Format: ABCDE1234F')
    .optional()
    .nullable(),
  passportNumber: z.string().max(20).optional().nullable(),
  drivingLicense: z.string().max(20).optional().nullable(),
})

export const employeeBankDetailsSchema = z.object({
  bankName: z.string().max(100).optional().nullable(),
  accountNumber: z.string().max(20).optional().nullable(),
  ifscCode: z
    .string()
    .regex(ifscRegex, 'Invalid IFSC code. Format: ABCD0123456')
    .optional()
    .nullable(),
  upiId: z.string().max(100).optional().nullable(),
})

export const employeeEmergencyContactSchema = z.object({
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactPhone: z
    .string()
    .regex(phoneRegex, 'Invalid phone number. Must be 10 digits starting with 6-9')
    .optional()
    .nullable(),
  emergencyContactRelation: z.string().max(50).optional().nullable(),
})

// Combined schema for creating a new employee
export const createEmployeeSchema = employeePersonalInfoSchema
  .merge(employeeContactInfoSchema)
  .merge(employeeEmploymentInfoSchema)
  .merge(employeeDocumentsSchema)
  .merge(employeeBankDetailsSchema)
  .merge(employeeEmergencyContactSchema)

// Schema for updating employee (all fields optional except required ones)
export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: z.string(),
})

// Schema for search and filter
export const employeeFilterSchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  status: z.string().optional(),
  employeeType: z.nativeEnum(EmployeeType).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Department schema
export const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100),
  code: z.string().min(1, 'Department code is required').max(20),
  description: z.string().max(500).optional().nullable(),
  headId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

// Designation schema
export const designationSchema = z.object({
  title: z.string().min(1, 'Designation title is required').max(100),
  code: z.string().min(1, 'Designation code is required').max(20),
  level: z.number().int().min(1).max(10),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
})

// Type exports
export type EmployeePersonalInfo = z.infer<typeof employeePersonalInfoSchema>
export type EmployeeContactInfo = z.infer<typeof employeeContactInfoSchema>
export type EmployeeEmploymentInfo = z.infer<typeof employeeEmploymentInfoSchema>
export type EmployeeDocuments = z.infer<typeof employeeDocumentsSchema>
export type EmployeeBankDetails = z.infer<typeof employeeBankDetailsSchema>
export type EmployeeEmergencyContact = z.infer<typeof employeeEmergencyContactSchema>
export type CreateEmployee = z.infer<typeof createEmployeeSchema>
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>
export type EmployeeFilter = z.infer<typeof employeeFilterSchema>
export type Department = z.infer<typeof departmentSchema>
export type Designation = z.infer<typeof designationSchema>
