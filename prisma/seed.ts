/**
 * Priacc Innovations CRM/HRMS - Database Seeder
 *
 * This script populates the database with realistic demo data for development and testing.
 *
 * Usage: npm run prisma:seed
 *
 * Features:
 * - Idempotent (can be run multiple times)
 * - Clears existing data in development
 * - Uses transactions for data integrity
 * - Logs progress during seeding
 * - Realistic Indian names and data
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword, generateEmployeeCode } from '../lib/utils';

const prisma = new PrismaClient();

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// ============================================
// DATA CONSTANTS
// ============================================

const INDIAN_NAMES = {
  firstNames: {
    male: ['Aarav', 'Arjun', 'Aditya', 'Rohan', 'Rahul', 'Karan', 'Vikram', 'Raj', 'Amit', 'Suresh', 'Akash', 'Nikhil', 'Varun', 'Siddharth', 'Harsh'],
    female: ['Priya', 'Ananya', 'Sneha', 'Pooja', 'Neha', 'Kavya', 'Riya', 'Divya', 'Anjali', 'Meera', 'Ishita', 'Shreya', 'Nikita', 'Tanvi', 'Simran']
  },
  lastNames: ['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Rao', 'Gupta', 'Verma', 'Joshi', 'Mehta', 'Shah', 'Nair', 'Desai', 'Iyer', 'Malhotra']
};

const DEPARTMENTS = [
  { name: 'Engineering', code: 'ENG', description: 'Technology and software development' },
  { name: 'Human Resources', code: 'HR', description: 'People and culture management' },
  { name: 'Sales', code: 'SALES', description: 'Revenue and customer acquisition' },
  { name: 'Marketing', code: 'MKT', description: 'Brand and digital marketing' },
  { name: 'Operations', code: 'OPS', description: 'Business operations and support' }
];

const DESIGNATIONS = [
  { title: 'Software Engineer', code: 'SE', level: 2, description: 'Junior software developer' },
  { title: 'Senior Software Engineer', code: 'SSE', level: 4, description: 'Experienced software developer' },
  { title: 'Tech Lead', code: 'TL', level: 5, description: 'Technical team leader' },
  { title: 'Engineering Manager', code: 'EM', level: 6, description: 'Engineering team manager' },
  { title: 'HR Executive', code: 'HRE', level: 2, description: 'HR operations executive' },
  { title: 'HR Manager', code: 'HRM', level: 6, description: 'HR team manager' },
  { title: 'Sales Executive', code: 'SLX', level: 2, description: 'Sales representative' },
  { title: 'Sales Manager', code: 'SLM', level: 6, description: 'Sales team manager' },
  { title: 'Marketing Executive', code: 'MKE', level: 2, description: 'Marketing specialist' },
  { title: 'Marketing Manager', code: 'MKM', level: 6, description: 'Marketing team manager' },
  { title: 'Operations Executive', code: 'OPE', level: 2, description: 'Operations support' },
  { title: 'Operations Manager', code: 'OPM', level: 6, description: 'Operations team manager' },
  { title: 'Intern', code: 'INT', level: 1, description: 'Internship role' },
  { title: 'Director', code: 'DIR', level: 7, description: 'Director level' },
  { title: 'CEO', code: 'CEO', level: 7, description: 'Chief Executive Officer' }
];

const SHIFTS = [
  { name: 'General Shift', startTime: '09:30', endTime: '18:30', workHours: 9, breakHours: 1 },
  { name: 'Early Shift', startTime: '08:00', endTime: '17:00', workHours: 9, breakHours: 1 },
  { name: 'Night Shift', startTime: '22:00', endTime: '07:00', workHours: 9, breakHours: 1 },
  { name: 'US Shift', startTime: '18:00', endTime: '03:00', workHours: 9, breakHours: 1 },
  { name: 'UK Shift', startTime: '13:00', endTime: '22:00', workHours: 9, breakHours: 1 },
  { name: 'Flexible Shift', startTime: '10:00', endTime: '19:00', workHours: 9, breakHours: 1 },
  { name: 'Part Time Morning', startTime: '09:00', endTime: '13:00', workHours: 4, breakHours: 0 },
  { name: 'Part Time Evening', startTime: '14:00', endTime: '18:00', workHours: 4, breakHours: 0 }
];

const LEAVE_POLICIES = [
  { leaveType: 'CASUAL', totalDays: 12, carryForward: true, maxCarryForward: 6, accrualEnabled: true, accrualRate: 1, minServiceMonths: 0, requiresDocument: false },
  { leaveType: 'SICK', totalDays: 12, carryForward: false, maxCarryForward: null, accrualEnabled: false, accrualRate: null, minServiceMonths: 0, requiresDocument: true },
  { leaveType: 'PRIVILEGE', totalDays: 15, carryForward: true, maxCarryForward: 10, accrualEnabled: true, accrualRate: 1.25, minServiceMonths: 6, requiresDocument: false },
  { leaveType: 'EARNED', totalDays: 20, carryForward: true, maxCarryForward: 15, accrualEnabled: true, accrualRate: 1.67, minServiceMonths: 12, requiresDocument: false },
  { leaveType: 'MATERNITY', totalDays: 180, carryForward: false, maxCarryForward: null, accrualEnabled: false, accrualRate: null, minServiceMonths: 0, requiresDocument: true },
  { leaveType: 'PATERNITY', totalDays: 15, carryForward: false, maxCarryForward: null, accrualEnabled: false, accrualRate: null, minServiceMonths: 0, requiresDocument: true },
  { leaveType: 'COMPENSATORY', totalDays: 12, carryForward: true, maxCarryForward: 6, accrualEnabled: false, accrualRate: null, minServiceMonths: 0, requiresDocument: false },
  { leaveType: 'BEREAVEMENT', totalDays: 5, carryForward: false, maxCarryForward: null, accrualEnabled: false, accrualRate: null, minServiceMonths: 0, requiresDocument: false },
  { leaveType: 'MARRIAGE', totalDays: 7, carryForward: false, maxCarryForward: null, accrualEnabled: false, accrualRate: null, minServiceMonths: 0, requiresDocument: false }
];

const HOLIDAYS_2025 = [
  { name: 'Republic Day', date: new Date('2025-01-26'), isOptional: false },
  { name: 'Maha Shivaratri', date: new Date('2025-02-26'), isOptional: true },
  { name: 'Holi', date: new Date('2025-03-14'), isOptional: false },
  { name: 'Good Friday', date: new Date('2025-04-18'), isOptional: true },
  { name: 'Mahavir Jayanti', date: new Date('2025-04-10'), isOptional: true },
  { name: 'Buddha Purnima', date: new Date('2025-05-12'), isOptional: true },
  { name: 'Eid al-Fitr', date: new Date('2025-03-31'), isOptional: true },
  { name: 'Independence Day', date: new Date('2025-08-15'), isOptional: false },
  { name: 'Janmashtami', date: new Date('2025-08-16'), isOptional: true },
  { name: 'Gandhi Jayanti', date: new Date('2025-10-02'), isOptional: false },
  { name: 'Dussehra', date: new Date('2025-10-02'), isOptional: false },
  { name: 'Diwali', date: new Date('2025-10-20'), isOptional: false },
  { name: 'Diwali (Second Day)', date: new Date('2025-10-21'), isOptional: false },
  { name: 'Guru Nanak Jayanti', date: new Date('2025-11-05'), isOptional: true },
  { name: 'Christmas', date: new Date('2025-12-25'), isOptional: false }
];

const CLIENTS = [
  { name: 'TechCorp India Pvt Ltd', code: 'TC001', industry: 'Technology', status: 'ACTIVE', revenue: 5000000 },
  { name: 'GlobalSoft Solutions', code: 'GS002', industry: 'IT Services', status: 'ACTIVE', revenue: 3500000 },
  { name: 'StartupXYZ', code: 'SX003', industry: 'E-commerce', status: 'ACTIVE', revenue: 1500000 },
  { name: 'EnterpriseCo Ltd', code: 'EC004', industry: 'Finance', status: 'ACTIVE', revenue: 7500000 },
  { name: 'InnovateLabs', code: 'IL005', industry: 'Healthcare', status: 'PROSPECT', revenue: 0 }
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');

  // Delete in reverse order of dependencies
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.document.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.assetAllocation.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.employeeTraining.deleteMany();
  await prisma.training.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.performance.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.task.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.taxDeclaration.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.salary.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.leavePolicy.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.designation.deleteMany();
  await prisma.department.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleared successfully');
}

async function seedDepartments() {
  console.log('🏢 Seeding departments...');

  const departments = await Promise.all(
    DEPARTMENTS.map(dept =>
      prisma.department.create({
        data: dept
      })
    )
  );

  console.log(`✅ Created ${departments.length} departments`);
  return departments;
}

async function seedDesignations() {
  console.log('👔 Seeding designations...');

  const designations = await Promise.all(
    DESIGNATIONS.map(designation =>
      prisma.designation.create({
        data: designation
      })
    )
  );

  console.log(`✅ Created ${designations.length} designations`);
  return designations;
}

async function seedShifts() {
  console.log('⏰ Seeding shifts...');

  const shifts = await Promise.all(
    SHIFTS.map(shift =>
      prisma.shift.create({
        data: shift
      })
    )
  );

  console.log(`✅ Created ${shifts.length} shifts`);
  return shifts;
}

async function seedLeavePolicies() {
  console.log('📋 Seeding leave policies...');

  const policies = await Promise.all(
    LEAVE_POLICIES.map(policy =>
      prisma.leavePolicy.create({
        data: policy as any
      })
    )
  );

  console.log(`✅ Created ${policies.length} leave policies`);
  return policies;
}

async function seedHolidays() {
  console.log('🎉 Seeding holidays...');

  const holidays = await Promise.all(
    HOLIDAYS_2025.map(holiday =>
      prisma.holiday.create({
        data: {
          ...holiday,
          location: 'India'
        }
      })
    )
  );

  console.log(`✅ Created ${holidays.length} holidays`);
  return holidays;
}

async function seedUsersAndEmployees(departments: any[], designations: any[]) {
  console.log('👥 Seeding users and employees...');

  const hashedPassword = await hashPassword('Password@123');

  const employeesData = [
    // 1. Super Admin (CEO)
    {
      role: 'SUPER_ADMIN',
      employeeType: 'FULL_TIME',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      gender: 'MALE',
      departmentCode: 'OPS',
      designationCode: 'CEO',
      dateOfJoining: new Date('2020-01-01'),
      reportingManagerId: null
    },
    // 2-3. Admin users
    {
      role: 'ADMIN',
      employeeType: 'FULL_TIME',
      firstName: 'Priya',
      lastName: 'Patel',
      gender: 'FEMALE',
      departmentCode: 'OPS',
      designationCode: 'DIR',
      dateOfJoining: new Date('2020-06-01'),
      reportingManagerIndex: 0
    },
    {
      role: 'ADMIN',
      employeeType: 'FULL_TIME',
      firstName: 'Amit',
      lastName: 'Kumar',
      gender: 'MALE',
      departmentCode: 'OPS',
      designationCode: 'DIR',
      dateOfJoining: new Date('2020-06-01'),
      reportingManagerIndex: 0
    },
    // 4-5. HR Managers
    {
      role: 'HR_MANAGER',
      employeeType: 'FULL_TIME',
      firstName: 'Neha',
      lastName: 'Gupta',
      gender: 'FEMALE',
      departmentCode: 'HR',
      designationCode: 'HRM',
      dateOfJoining: new Date('2021-01-15'),
      reportingManagerIndex: 0
    },
    {
      role: 'HR_EXECUTIVE',
      employeeType: 'FULL_TIME',
      firstName: 'Sneha',
      lastName: 'Reddy',
      gender: 'FEMALE',
      departmentCode: 'HR',
      designationCode: 'HRE',
      dateOfJoining: new Date('2022-03-01'),
      reportingManagerIndex: 3
    },
    // 6-7. Engineering Managers
    {
      role: 'MANAGER',
      employeeType: 'FULL_TIME',
      firstName: 'Vikram',
      lastName: 'Singh',
      gender: 'MALE',
      departmentCode: 'ENG',
      designationCode: 'EM',
      dateOfJoining: new Date('2021-02-01'),
      reportingManagerIndex: 0
    },
    {
      role: 'TEAM_LEAD',
      employeeType: 'FULL_TIME',
      firstName: 'Arjun',
      lastName: 'Verma',
      gender: 'MALE',
      departmentCode: 'ENG',
      designationCode: 'TL',
      dateOfJoining: new Date('2021-08-15'),
      reportingManagerIndex: 5
    },
    // 8-17. Regular Employees
    {
      role: 'EMPLOYEE',
      employeeType: 'FULL_TIME',
      firstName: 'Rohan',
      lastName: 'Joshi',
      gender: 'MALE',
      departmentCode: 'ENG',
      designationCode: 'SSE',
      dateOfJoining: new Date('2022-01-10'),
      reportingManagerIndex: 6
    },
    {
      role: 'EMPLOYEE',
      employeeType: 'FULL_TIME',
      firstName: 'Kavya',
      lastName: 'Mehta',
      gender: 'FEMALE',
      departmentCode: 'ENG',
      designationCode: 'SE',
      dateOfJoining: new Date('2023-01-15'),
      reportingManagerIndex: 6
    },
    {
      role: 'EMPLOYEE',
      employeeType: 'FULL_TIME',
      firstName: 'Aditya',
      lastName: 'Shah',
      gender: 'MALE',
      departmentCode: 'ENG',
      designationCode: 'SE',
      dateOfJoining: new Date('2023-03-01'),
      reportingManagerIndex: 6
    },
    {
      role: 'MANAGER',
      employeeType: 'FULL_TIME',
      firstName: 'Rahul',
      lastName: 'Nair',
      gender: 'MALE',
      departmentCode: 'SALES',
      designationCode: 'SLM',
      dateOfJoining: new Date('2021-04-01'),
      reportingManagerIndex: 0
    },
    {
      role: 'EMPLOYEE',
      employeeType: 'FULL_TIME',
      firstName: 'Riya',
      lastName: 'Desai',
      gender: 'FEMALE',
      departmentCode: 'SALES',
      designationCode: 'SLX',
      dateOfJoining: new Date('2022-06-01'),
      reportingManagerIndex: 10
    },
    {
      role: 'EMPLOYEE',
      employeeType: 'FULL_TIME',
      firstName: 'Karan',
      lastName: 'Iyer',
      gender: 'MALE',
      departmentCode: 'SALES',
      designationCode: 'SLX',
      dateOfJoining: new Date('2022-09-15'),
      reportingManagerIndex: 10
    },
    {
      role: 'MANAGER',
      employeeType: 'FULL_TIME',
      firstName: 'Divya',
      lastName: 'Malhotra',
      gender: 'FEMALE',
      departmentCode: 'MKT',
      designationCode: 'MKM',
      dateOfJoining: new Date('2021-05-01'),
      reportingManagerIndex: 0
    },
    {
      role: 'EMPLOYEE',
      employeeType: 'FULL_TIME',
      firstName: 'Akash',
      lastName: 'Rao',
      gender: 'MALE',
      departmentCode: 'MKT',
      designationCode: 'MKE',
      dateOfJoining: new Date('2022-07-01'),
      reportingManagerIndex: 13
    },
    {
      role: 'EMPLOYEE',
      employeeType: 'FULL_TIME',
      firstName: 'Anjali',
      lastName: 'Kumar',
      gender: 'FEMALE',
      departmentCode: 'MKT',
      designationCode: 'MKE',
      dateOfJoining: new Date('2023-02-01'),
      reportingManagerIndex: 13
    },
    {
      role: 'EMPLOYEE',
      employeeType: 'FULL_TIME',
      firstName: 'Nikhil',
      lastName: 'Sharma',
      gender: 'MALE',
      departmentCode: 'OPS',
      designationCode: 'OPE',
      dateOfJoining: new Date('2022-08-01'),
      reportingManagerIndex: 1
    },
    // 18-20. Interns
    {
      role: 'INTERN',
      employeeType: 'INTERN',
      firstName: 'Ishita',
      lastName: 'Gupta',
      gender: 'FEMALE',
      departmentCode: 'ENG',
      designationCode: 'INT',
      dateOfJoining: new Date('2024-07-01'),
      reportingManagerIndex: 6
    },
    {
      role: 'INTERN',
      employeeType: 'INTERN',
      firstName: 'Varun',
      lastName: 'Patel',
      gender: 'MALE',
      departmentCode: 'MKT',
      designationCode: 'INT',
      dateOfJoining: new Date('2024-08-01'),
      reportingManagerIndex: 13
    },
    {
      role: 'INTERN',
      employeeType: 'INTERN',
      firstName: 'Simran',
      lastName: 'Singh',
      gender: 'FEMALE',
      departmentCode: 'SALES',
      designationCode: 'INT',
      dateOfJoining: new Date('2024-08-15'),
      reportingManagerIndex: 10
    }
  ];

  const createdEmployees: any[] = [];

  for (let i = 0; i < employeesData.length; i++) {
    const empData = employeesData[i];
    const department = departments.find(d => d.code === empData.departmentCode);
    const designation = designations.find(d => d.code === empData.designationCode);

    const employeeCode = generateEmployeeCode('PRI', i);
    const email = `${empData.firstName.toLowerCase()}.${empData.lastName.toLowerCase()}@priacc.com`;

    // Get reporting manager if specified
    let reportingManagerId = null;
    if (empData.reportingManagerIndex !== undefined && empData.reportingManagerIndex !== null) {
      reportingManagerId = createdEmployees[empData.reportingManagerIndex]?.id || null;
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: empData.role as any,
        status: 'ACTIVE',
        employee: {
          create: {
            employeeCode,
            firstName: empData.firstName,
            lastName: empData.lastName,
            displayName: `${empData.firstName} ${empData.lastName}`,
            dateOfBirth: new Date(1990 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            gender: empData.gender as any,
            maritalStatus: getRandomElement(['SINGLE', 'MARRIED']),
            bloodGroup: getRandomElement(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']),
            personalEmail: `${empData.firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}@gmail.com`,
            phoneNumber: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            currentAddress: `${Math.floor(Math.random() * 500) + 1}, ${getRandomElement(['MG Road', 'Brigade Road', 'Koramangala', 'Indiranagar', 'Whitefield'])}, Bangalore`,
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India',
            pincode: `5600${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
            employeeType: empData.employeeType as any,
            dateOfJoining: empData.dateOfJoining,
            confirmationDate: empData.employeeType === 'FULL_TIME' ? addMonths(empData.dateOfJoining, 6) : null,
            probationPeriod: empData.employeeType === 'FULL_TIME' ? 6 : null,
            noticePeriod: empData.employeeType === 'FULL_TIME' ? 60 : 30,
            departmentId: department?.id,
            designationId: designation?.id,
            reportingManagerId,
            workLocation: 'Bangalore',
            employmentStatus: 'ACTIVE',
            emergencyContactName: getRandomElement(['Father', 'Mother', 'Spouse', 'Sibling']),
            emergencyContactPhone: `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            emergencyContactRelation: getRandomElement(['Father', 'Mother', 'Spouse', 'Brother', 'Sister']),
            bankName: getRandomElement(['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra']),
            accountNumber: `${Math.floor(Math.random() * 90000000000000) + 10000000000000}`,
            ifscCode: getRandomElement(['HDFC0001234', 'ICIC0001234', 'SBIN0001234', 'UTIB0001234'])
          }
        }
      },
      include: {
        employee: true
      }
    });

    createdEmployees.push(user.employee);
  }

  console.log(`✅ Created ${createdEmployees.length} users and employees`);
  return createdEmployees;
}

async function seedSalaryStructures(designations: any[]) {
  console.log('💰 Seeding salary structures...');

  const salaryStructureData = [
    // Intern - 3 LPA
    { designationCode: 'INT', name: 'Intern Package', minCTC: 250000, maxCTC: 350000, basicPercentage: 0.40 },
    // Junior - 5 LPA
    { designationCode: 'SE', name: 'Junior Engineer Package', minCTC: 400000, maxCTC: 600000, basicPercentage: 0.40 },
    { designationCode: 'HRE', name: 'HR Executive Package', minCTC: 350000, maxCTC: 550000, basicPercentage: 0.40 },
    { designationCode: 'SLX', name: 'Sales Executive Package', minCTC: 400000, maxCTC: 600000, basicPercentage: 0.40 },
    { designationCode: 'MKE', name: 'Marketing Executive Package', minCTC: 400000, maxCTC: 600000, basicPercentage: 0.40 },
    { designationCode: 'OPE', name: 'Operations Executive Package', minCTC: 350000, maxCTC: 550000, basicPercentage: 0.40 },
    // Mid - 8 LPA
    { designationCode: 'SSE', name: 'Senior Engineer Package', minCTC: 700000, maxCTC: 1000000, basicPercentage: 0.40 },
    // Lead - 12-18 LPA
    { designationCode: 'TL', name: 'Tech Lead Package', minCTC: 1200000, maxCTC: 1800000, basicPercentage: 0.40 },
    // Manager - 15-25 LPA
    { designationCode: 'EM', name: 'Engineering Manager Package', minCTC: 1500000, maxCTC: 2500000, basicPercentage: 0.40 },
    { designationCode: 'HRM', name: 'HR Manager Package', minCTC: 1200000, maxCTC: 2000000, basicPercentage: 0.40 },
    { designationCode: 'SLM', name: 'Sales Manager Package', minCTC: 1500000, maxCTC: 2500000, basicPercentage: 0.40 },
    { designationCode: 'MKM', name: 'Marketing Manager Package', minCTC: 1200000, maxCTC: 2000000, basicPercentage: 0.40 },
    { designationCode: 'OPM', name: 'Operations Manager Package', minCTC: 1200000, maxCTC: 2000000, basicPercentage: 0.40 },
    // Director - 30 LPA
    { designationCode: 'DIR', name: 'Director Package', minCTC: 2500000, maxCTC: 3500000, basicPercentage: 0.40 },
    // CEO - 50 LPA
    { designationCode: 'CEO', name: 'CEO Package', minCTC: 4500000, maxCTC: 6000000, basicPercentage: 0.40 }
  ];

  const structures = [];

  for (const structure of salaryStructureData) {
    const designation = designations.find(d => d.code === structure.designationCode);
    if (!designation) continue;

    const avgCTC = (structure.minCTC + structure.maxCTC) / 2;
    const annualBasic = avgCTC * structure.basicPercentage;
    const annualHRA = annualBasic * 0.50;
    const annualSpecialAllowance = avgCTC - annualBasic - annualHRA - 19200 - 10000 - 21600;

    const created = await prisma.salaryStructure.create({
      data: {
        designationId: designation.id,
        name: structure.name,
        minCTC: structure.minCTC,
        maxCTC: structure.maxCTC,
        basicSalary: annualBasic,
        hra: annualHRA,
        specialAllowance: annualSpecialAllowance,
        conveyance: 19200,
        medicalAllowance: 10000,
        otherAllowances: 0,
        pf: annualBasic * 0.12,
        esi: 0,
        professionalTax: 21600
      }
    });

    structures.push(created);
  }

  console.log(`✅ Created ${structures.length} salary structures`);
  return structures;
}

async function seedEmployeeSalaries(employees: any[], designations: any[]) {
  console.log('💵 Seeding employee salaries...');

  const salaries = [];

  for (const employee of employees) {
    const designation = designations.find(d => d.id === employee.designationId);
    if (!designation) continue;

    // Get CTC based on designation
    let ctc = 500000; // default

    switch (designation.code) {
      case 'INT': ctc = 300000; break;
      case 'SE': case 'HRE': case 'SLX': case 'MKE': case 'OPE': ctc = 500000; break;
      case 'SSE': ctc = 800000; break;
      case 'TL': ctc = 1500000; break;
      case 'EM': case 'SLM': ctc = 2000000; break;
      case 'HRM': case 'MKM': case 'OPM': ctc = 1500000; break;
      case 'DIR': ctc = 3000000; break;
      case 'CEO': ctc = 5000000; break;
    }

    const basicSalary = ctc * 0.40 / 12;
    const hra = basicSalary * 0.50;
    const conveyance = 1600;
    const medicalAllowance = 833;
    const specialAllowance = (ctc / 12) - basicSalary - hra - conveyance - medicalAllowance;

    const pf = Math.min(basicSalary, 15000) * 0.12;
    const esi = ctc / 12 <= 21000 ? (ctc / 12) * 0.0075 : 0;
    const professionalTax = 200;

    const grossSalary = basicSalary + hra + specialAllowance + conveyance + medicalAllowance;
    const netSalary = grossSalary - pf - esi - professionalTax;

    const salary = await prisma.salary.create({
      data: {
        employeeId: employee.id,
        ctc,
        basicSalary,
        hra,
        specialAllowance,
        conveyance,
        medicalAllowance,
        otherAllowances: 0,
        pf,
        esi,
        professionalTax,
        grossSalary,
        netSalary,
        effectiveFrom: employee.dateOfJoining
      }
    });

    salaries.push(salary);
  }

  console.log(`✅ Created ${salaries.length} salary records`);
  return salaries;
}

async function seedPayslips(employees: any[]) {
  console.log('📄 Seeding payslips (last 3 months)...');

  const payslips = [];
  const now = new Date();

  for (const employee of employees) {
    const salary = await prisma.salary.findUnique({
      where: { employeeId: employee.id }
    });

    if (!salary) continue;

    // Generate payslips for last 3 months
    for (let i = 1; i <= 3; i++) {
      const month = now.getMonth() - i + 1;
      const year = month <= 0 ? now.getFullYear() - 1 : now.getFullYear();
      const actualMonth = month <= 0 ? month + 12 : month;

      const totalWorkingDays = 26;
      const daysPresent = Math.floor(Math.random() * 3) + 24; // 24-26 days
      const daysAbsent = totalWorkingDays - daysPresent;

      // Add bonus for some employees in some months
      const bonus = (i === 2 && Math.random() > 0.7) ? Math.floor(Math.random() * 20000) + 10000 : 0;

      const grossEarnings = salary.grossSalary + bonus;
      const totalDeductions = salary.pf + salary.esi + salary.professionalTax;
      const netPay = grossEarnings - totalDeductions;

      const payslip = await prisma.payslip.create({
        data: {
          employeeId: employee.id,
          salaryId: salary.id,
          month: actualMonth,
          year,
          basicSalary: salary.basicSalary,
          hra: salary.hra,
          specialAllowance: salary.specialAllowance,
          conveyance: salary.conveyance,
          medicalAllowance: salary.medicalAllowance,
          otherAllowances: salary.otherAllowances,
          bonus,
          incentives: 0,
          overtime: 0,
          grossEarnings,
          pf: salary.pf,
          esi: salary.esi,
          professionalTax: salary.professionalTax,
          tds: 0,
          lop: 0,
          otherDeductions: 0,
          totalDeductions,
          netPay,
          totalWorkingDays,
          daysPresent,
          daysAbsent,
          paidLeaves: 0,
          unpaidLeaves: 0,
          status: 'PAID',
          paidDate: new Date(year, actualMonth - 1, 28)
        }
      });

      payslips.push(payslip);
    }
  }

  console.log(`✅ Created ${payslips.length} payslips`);
  return payslips;
}

async function seedAttendance(employees: any[], shifts: any[]) {
  console.log('📅 Seeding attendance (last 30 days)...');

  const attendanceRecords = [];
  const generalShift = shifts.find(s => s.name === 'General Shift');

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = addDays(new Date(), -dayOffset);
    const dayOfWeek = date.getDay();

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (const employee of employees) {
      // Skip if employee joined after this date
      if (new Date(employee.dateOfJoining) > date) continue;

      // Determine status
      let status: string;
      const rand = Math.random();

      if (rand < 0.80) status = 'PRESENT';
      else if (rand < 0.90) status = 'WORK_FROM_HOME';
      else if (rand < 0.95) status = 'ON_LEAVE';
      else status = 'ABSENT';

      let checkInTime = null;
      let checkOutTime = null;
      let workHours = null;

      if (status === 'PRESENT' || status === 'WORK_FROM_HOME') {
        // Random check-in between 9:00 and 10:00
        const checkInHour = 9;
        const checkInMinute = Math.floor(Math.random() * 60);
        checkInTime = new Date(date);
        checkInTime.setHours(checkInHour, checkInMinute, 0);

        // Random check-out between 18:00 and 20:00
        const checkOutHour = 18 + Math.floor(Math.random() * 3);
        const checkOutMinute = Math.floor(Math.random() * 60);
        checkOutTime = new Date(date);
        checkOutTime.setHours(checkOutHour, checkOutMinute, 0);

        workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
      }

      const attendance = await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date,
          checkInTime,
          checkOutTime,
          status: status as any,
          workHours,
          overtimeHours: workHours && workHours > 9 ? workHours - 9 : 0,
          isRemote: status === 'WORK_FROM_HOME',
          shiftId: generalShift?.id
        }
      });

      attendanceRecords.push(attendance);
    }
  }

  console.log(`✅ Created ${attendanceRecords.length} attendance records`);
  return attendanceRecords;
}

async function seedLeaves(employees: any[]) {
  console.log('🏖️  Seeding leaves...');

  const leaves = [];
  const leaveTypes = ['CASUAL', 'SICK', 'PRIVILEGE', 'EARNED'];
  const leaveStatuses = ['APPROVED', 'PENDING', 'REJECTED'];

  for (const employee of employees) {
    // 5-10 leaves per employee
    const leaveCount = Math.floor(Math.random() * 6) + 5;

    for (let i = 0; i < leaveCount; i++) {
      const leaveType = getRandomElement(leaveTypes);
      const status = getRandomElement(leaveStatuses);

      // Mix of past and future dates
      const isPast = Math.random() > 0.4;
      const daysFromNow = isPast
        ? -Math.floor(Math.random() * 60) - 1
        : Math.floor(Math.random() * 60) + 1;

      const startDate = addDays(new Date(), daysFromNow);
      const duration = Math.floor(Math.random() * 3) + 1; // 1-3 days
      const endDate = addDays(startDate, duration - 1);
      const halfDay = duration === 1 && Math.random() > 0.7;

      const leave = await prisma.leave.create({
        data: {
          employeeId: employee.id,
          leaveType: leaveType as any,
          startDate,
          endDate,
          totalDays: halfDay ? 0.5 : duration,
          halfDay,
          reason: getRandomElement([
            'Personal work',
            'Family function',
            'Medical appointment',
            'Emergency',
            'Planned vacation',
            'Festival celebration'
          ]),
          status: status as any,
          approvedBy: status === 'APPROVED' ? employee.reportingManagerId : null,
          approvedAt: status === 'APPROVED' ? startDate : null,
          rejectedReason: status === 'REJECTED' ? 'Not approved due to project deadlines' : null
        }
      });

      leaves.push(leave);
    }
  }

  console.log(`✅ Created ${leaves.length} leave records`);
  return leaves;
}

async function seedClients() {
  console.log('🏢 Seeding clients...');

  const clients = await Promise.all(
    CLIENTS.map((clientData, index) =>
      prisma.client.create({
        data: {
          ...clientData,
          email: `contact@${clientData.code.toLowerCase()}.com`,
          phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          website: `https://www.${clientData.code.toLowerCase()}.com`,
          address: `${Math.floor(Math.random() * 500) + 1}, ${getRandomElement(['Tech Park', 'Business Center', 'Innovation Hub', 'Corporate Plaza'])}`,
          city: getRandomElement(['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune']),
          state: getRandomElement(['Maharashtra', 'Delhi', 'Karnataka', 'Telangana']),
          country: 'India',
          pincode: `${Math.floor(Math.random() * 900000) + 100000}`,
          contactPerson: `${getRandomElement(INDIAN_NAMES.firstNames.male.concat(INDIAN_NAMES.firstNames.female))} ${getRandomElement(INDIAN_NAMES.lastNames)}`,
          contactEmail: `contact@${clientData.code.toLowerCase()}.com`,
          contactPhone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`
        }
      })
    )
  );

  console.log(`✅ Created ${clients.length} clients`);
  return clients;
}

async function seedProjectsAndTasks(clients: any[], departments: any[], employees: any[], designations: any[]) {
  console.log('📊 Seeding projects and tasks...');

  const projectNames = [
    'Customer Portal Development',
    'Mobile App Redesign',
    'ERP System Integration',
    'Cloud Migration Project',
    'Data Analytics Dashboard',
    'Marketing Automation',
    'Payment Gateway Integration',
    'HR Management System',
    'Inventory Management',
    'CRM Enhancement'
  ];

  const projects = [];

  for (let i = 0; i < 10; i++) {
    const client = getRandomElement(clients);
    const department = getRandomElement(departments);
    const projectManager = getRandomElement(employees.filter(e =>
      e.designationId && ['EM', 'TL', 'SLM', 'MKM'].some(code =>
        designations.find(d => d.id === e.designationId)?.code === code
      )
    ));

    const teamMembers = getRandomElements(
      employees.filter(e => e.departmentId === department.id && e.id !== projectManager.id),
      Math.floor(Math.random() * 4) + 2
    );

    const startDate = addDays(new Date(), -Math.floor(Math.random() * 180));
    const endDate = addDays(startDate, Math.floor(Math.random() * 180) + 90);
    const estimatedBudget = Math.floor(Math.random() * 5000000) + 1000000;

    const project = await prisma.project.create({
      data: {
        name: projectNames[i],
        code: `PRJ-${String(i + 1).padStart(3, '0')}`,
        clientId: client.id,
        departmentId: department.id,
        description: `${projectNames[i]} for ${client.name}`,
        objectives: 'Deliver high-quality solution on time and within budget',
        status: getRandomElement(['PLANNING', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'ON_HOLD', 'COMPLETED']),
        priority: getRandomElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
        startDate,
        endDate,
        estimatedBudget,
        actualCost: Math.floor(estimatedBudget * (Math.random() * 0.3 + 0.7)),
        projectManager: projectManager.id,
        teamMembers: teamMembers.map(m => m.id).join(',')
      }
    });

    projects.push(project);
  }

  // Create tasks
  const taskTitles = [
    'Requirements Gathering',
    'Database Design',
    'API Development',
    'Frontend Development',
    'Backend Development',
    'Testing & QA',
    'Code Review',
    'Documentation',
    'Deployment',
    'Bug Fixing'
  ];

  const tasks = [];

  for (const project of projects) {
    const taskCount = Math.floor(Math.random() * 8) + 5; // 5-12 tasks per project
    const teamMemberIds = project.teamMembers ? project.teamMembers.split(',') : [];

    for (let i = 0; i < taskCount; i++) {
      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          title: `${getRandomElement(taskTitles)} - ${project.name}`,
          description: `Complete ${taskTitles[i % taskTitles.length]} for the project`,
          status: getRandomElement(['TODO', 'IN_PROGRESS', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'COMPLETED']),
          priority: getRandomElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
          assignedTo: teamMemberIds.length > 0 ? getRandomElement(teamMemberIds) : null,
          estimatedHours: Math.floor(Math.random() * 40) + 8,
          actualHours: Math.floor(Math.random() * 50) + 5,
          startDate: addDays(new Date(project.startDate), Math.floor(Math.random() * 30)),
          dueDate: addDays(new Date(project.startDate), Math.floor(Math.random() * 60) + 30)
        }
      });

      tasks.push(task);
    }
  }

  console.log(`✅ Created ${projects.length} projects and ${tasks.length} tasks`);
  return { projects, tasks };
}

async function seedJobs(departments: any[], designations: any[]) {
  console.log('💼 Seeding jobs...');

  const jobTitles = [
    'Senior Full Stack Developer',
    'DevOps Engineer',
    'Product Manager',
    'UI/UX Designer',
    'Sales Executive'
  ];

  const jobs = [];

  for (let i = 0; i < 5; i++) {
    const department = getRandomElement(departments);
    const designation = getRandomElement(designations);

    const job = await prisma.job.create({
      data: {
        title: jobTitles[i],
        code: `JOB-2025-${String(i + 1).padStart(3, '0')}`,
        departmentId: department.id,
        designationId: designation.id,
        description: `We are looking for a talented ${jobTitles[i]} to join our team at Priacc Innovations.`,
        requirements: '- Bachelor\'s degree in relevant field\n- 3+ years of experience\n- Strong communication skills\n- Team player',
        responsibilities: '- Lead projects and initiatives\n- Collaborate with cross-functional teams\n- Mentor junior team members\n- Drive innovation',
        jobType: getRandomElement(['FULL_TIME', 'FULL_TIME', 'FULL_TIME', 'CONTRACT']),
        experience: getRandomElement(['0-2 years', '2-5 years', '5-8 years', '8+ years']),
        location: 'Bangalore, Karnataka',
        salaryRange: '₹8-15 LPA',
        openings: Math.floor(Math.random() * 3) + 1,
        status: 'OPEN',
        publishedAt: addDays(new Date(), -Math.floor(Math.random() * 30))
      }
    });

    jobs.push(job);
  }

  console.log(`✅ Created ${jobs.length} job postings`);
  return jobs;
}

async function seedApplicationsAndInterviews(jobs: any[]) {
  console.log('📝 Seeding applications and interviews...');

  const applications = [];
  const interviews = [];

  for (const job of jobs) {
    // 3-5 applications per job
    const appCount = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < appCount; i++) {
      const firstName = getRandomElement([...INDIAN_NAMES.firstNames.male, ...INDIAN_NAMES.firstNames.female]);
      const lastName = getRandomElement(INDIAN_NAMES.lastNames);

      const application = await prisma.application.create({
        data: {
          jobId: job.id,
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@gmail.com`,
          phone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          currentLocation: getRandomElement(['Bangalore', 'Mumbai', 'Delhi', 'Pune', 'Hyderabad']),
          resumeUrl: '/resumes/sample-resume.pdf',
          coverLetter: `I am excited to apply for the ${job.title} position at Priacc Innovations.`,
          totalExperience: Math.floor(Math.random() * 8) + 1,
          currentCompany: getRandomElement(['TCS', 'Infosys', 'Wipro', 'Accenture', 'Tech Mahindra', 'Startup XYZ']),
          currentCTC: Math.floor(Math.random() * 1000000) + 500000,
          expectedCTC: Math.floor(Math.random() * 1500000) + 800000,
          noticePeriod: getRandomElement([0, 15, 30, 60, 90]),
          source: getRandomElement(['LinkedIn', 'Naukri', 'Indeed', 'Referral', 'Company Website']),
          status: getRandomElement(['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFERED', 'REJECTED'])
        }
      });

      applications.push(application);

      // Create interviews for shortlisted candidates
      if (['INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFERED'].includes(application.status)) {
        const interviewCount = application.status === 'INTERVIEWED' || application.status === 'OFFERED' ? 2 : 1;

        for (let round = 1; round <= interviewCount; round++) {
          const scheduledDate = addDays(new Date(), Math.floor(Math.random() * 20) - 10);

          const interview = await prisma.interview.create({
            data: {
              applicationId: application.id,
              round,
              type: round === 1 ? 'TECHNICAL' : getRandomElement(['HR', 'MANAGERIAL']),
              scheduledDate,
              scheduledTime: getRandomElement(['10:00', '11:00', '14:00', '15:00', '16:00']),
              duration: getRandomElement([30, 45, 60]),
              meetingLink: 'https://meet.google.com/abc-defg-hij',
              interviewers: 'interviewer-id-1,interviewer-id-2',
              status: application.status === 'INTERVIEW_SCHEDULED' ? 'SCHEDULED' : 'COMPLETED',
              feedback: application.status === 'INTERVIEWED' || application.status === 'OFFERED'
                ? 'Good technical skills and communication'
                : null,
              rating: application.status === 'INTERVIEWED' || application.status === 'OFFERED'
                ? Math.floor(Math.random() * 2) + 4
                : null
            }
          });

          interviews.push(interview);
        }
      }
    }
  }

  console.log(`✅ Created ${applications.length} applications and ${interviews.length} interviews`);
  return { applications, interviews };
}

async function seedPerformanceAndGoals(employees: any[]) {
  console.log('🎯 Seeding goals and performance reviews...');

  const goals = [];
  const performances = [];

  const goalCategories = ['Technical', 'Management', 'Business', 'Personal Development'];
  const goalTitles = [
    'Complete certification course',
    'Improve code quality metrics',
    'Mentor junior team members',
    'Deliver project on time',
    'Increase customer satisfaction',
    'Learn new technology stack',
    'Reduce technical debt',
    'Improve team collaboration'
  ];

  for (const employee of employees) {
    // Skip interns for performance reviews
    if (employee.employeeType === 'INTERN') continue;

    // Create 3-5 goals per employee
    const goalCount = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < goalCount; i++) {
      const startDate = addDays(new Date(), -Math.floor(Math.random() * 180));
      const dueDate = addDays(startDate, Math.floor(Math.random() * 180) + 90);

      const goal = await prisma.goal.create({
        data: {
          employeeId: employee.id,
          title: getRandomElement(goalTitles),
          description: 'Achieve excellence in the assigned goal area',
          category: getRandomElement(goalCategories),
          priority: getRandomElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
          status: getRandomElement(['NOT_STARTED', 'IN_PROGRESS', 'IN_PROGRESS', 'COMPLETED']),
          startDate,
          dueDate,
          progress: Math.floor(Math.random() * 100)
        }
      });

      goals.push(goal);
    }

    // Create performance review for some employees
    if (Math.random() > 0.5) {
      const performance = await prisma.performance.create({
        data: {
          employeeId: employee.id,
          reviewCycle: 'QUARTERLY',
          reviewPeriod: 'Q3 2024',
          overallRating: getRandomElement(['OUTSTANDING', 'EXCEEDS_EXPECTATIONS', 'MEETS_EXPECTATIONS', 'NEEDS_IMPROVEMENT']),
          technicalSkills: Math.floor(Math.random() * 2) + 4,
          communication: Math.floor(Math.random() * 2) + 3,
          teamwork: Math.floor(Math.random() * 2) + 4,
          leadership: Math.floor(Math.random() * 2) + 3,
          initiative: Math.floor(Math.random() * 2) + 4,
          problemSolving: Math.floor(Math.random() * 2) + 4,
          strengths: 'Strong technical skills, good team player, meets deadlines consistently',
          areasOfImprovement: 'Can improve communication with stakeholders, explore new technologies',
          reviewerComments: 'Overall good performance. Keep up the good work!',
          goalsAchieved: Math.floor(Math.random() * 4) + 2,
          totalGoals: goalCount,
          isCompleted: true,
          completedAt: new Date()
        }
      });

      performances.push(performance);
    }
  }

  console.log(`✅ Created ${goals.length} goals and ${performances.length} performance reviews`);
  return { goals, performances };
}

async function seedTraining(employees: any[]) {
  console.log('📚 Seeding training courses...');

  const trainingData = [
    { title: 'Advanced React Patterns', type: 'TECHNICAL', duration: 16 },
    { title: 'AWS Cloud Practitioner', type: 'TECHNICAL', duration: 24 },
    { title: 'Leadership & Management', type: 'LEADERSHIP', duration: 12 },
    { title: 'Effective Communication Skills', type: 'SOFT_SKILLS', duration: 8 },
    { title: 'Data Privacy & Security', type: 'COMPLIANCE', duration: 4 },
    { title: 'Agile & Scrum Fundamentals', type: 'DOMAIN', duration: 16 },
    { title: 'Sales Excellence Program', type: 'DOMAIN', duration: 20 },
    { title: 'Time Management Mastery', type: 'SOFT_SKILLS', duration: 6 }
  ];

  const trainings = [];

  for (let i = 0; i < trainingData.length; i++) {
    const data = trainingData[i];
    const startDate = addDays(new Date(), Math.floor(Math.random() * 60) - 30);
    const endDate = addDays(startDate, Math.floor(data.duration / 2));

    const training = await prisma.training.create({
      data: {
        title: data.title,
        code: `TRN-2025-${String(i + 1).padStart(3, '0')}`,
        description: `Comprehensive ${data.title} course for professional development`,
        type: data.type as any,
        status: startDate > new Date() ? 'UPCOMING' : (endDate < new Date() ? 'COMPLETED' : 'ONGOING'),
        trainer: getRandomElement(['John Doe', 'Jane Smith', 'Expert Trainer', 'Industry Professional']),
        trainingMode: getRandomElement(['Online', 'Offline', 'Hybrid']),
        location: 'Bangalore Office / Online',
        meetingLink: 'https://zoom.us/j/meeting-link',
        startDate,
        endDate,
        duration: data.duration,
        maxParticipants: Math.floor(Math.random() * 20) + 10,
        cost: Math.floor(Math.random() * 50000) + 10000
      }
    });

    trainings.push(training);
  }

  // Enroll 50% of employees randomly
  const enrollments = [];

  for (const training of trainings) {
    const enrollCount = Math.floor(employees.length * 0.5);
    const selectedEmployees = getRandomElements(employees, enrollCount);

    for (const employee of selectedEmployees) {
      const isCompleted = training.status === 'COMPLETED' && Math.random() > 0.2;

      const enrollment = await prisma.employeeTraining.create({
        data: {
          employeeId: employee.id,
          trainingId: training.id,
          status: isCompleted ? 'COMPLETED' : 'ENROLLED',
          completedDate: isCompleted ? training.endDate : null,
          score: isCompleted ? Math.floor(Math.random() * 40) + 60 : null,
          feedback: isCompleted ? 'Excellent training program. Very informative and practical.' : null
        }
      });

      enrollments.push(enrollment);
    }
  }

  console.log(`✅ Created ${trainings.length} training courses and ${enrollments.length} enrollments`);
  return { trainings, enrollments };
}

async function seedAssets(employees: any[]) {
  console.log('💻 Seeding assets...');

  const assetTypes = ['LAPTOP', 'DESKTOP', 'MOBILE', 'MONITOR', 'KEYBOARD', 'MOUSE', 'HEADSET'];
  const brands = {
    LAPTOP: ['Dell', 'HP', 'Lenovo', 'MacBook'],
    DESKTOP: ['Dell', 'HP', 'Lenovo'],
    MOBILE: ['Apple', 'Samsung', 'OnePlus'],
    MONITOR: ['Dell', 'LG', 'Samsung', 'BenQ'],
    KEYBOARD: ['Logitech', 'Dell', 'HP'],
    MOUSE: ['Logitech', 'Dell', 'HP'],
    HEADSET: ['Jabra', 'Logitech', 'Sony']
  };

  const assets = [];
  const allocations = [];

  // Create 25 assets
  for (let i = 0; i < 25; i++) {
    const assetType = getRandomElement(assetTypes);
    const brand = getRandomElement(brands[assetType as keyof typeof brands]);
    const purchaseDate = addDays(new Date(), -Math.floor(Math.random() * 730)); // Within last 2 years

    let purchasePrice = 0;
    switch (assetType) {
      case 'LAPTOP': purchasePrice = Math.floor(Math.random() * 80000) + 40000; break;
      case 'DESKTOP': purchasePrice = Math.floor(Math.random() * 60000) + 30000; break;
      case 'MOBILE': purchasePrice = Math.floor(Math.random() * 50000) + 20000; break;
      case 'MONITOR': purchasePrice = Math.floor(Math.random() * 20000) + 10000; break;
      case 'KEYBOARD': purchasePrice = Math.floor(Math.random() * 3000) + 1000; break;
      case 'MOUSE': purchasePrice = Math.floor(Math.random() * 2000) + 500; break;
      case 'HEADSET': purchasePrice = Math.floor(Math.random() * 5000) + 2000; break;
    }

    const isAllocated = Math.random() > 0.2; // 80% allocated

    const asset = await prisma.asset.create({
      data: {
        assetCode: `AST-${String(i + 1).padStart(4, '0')}`,
        name: `${brand} ${assetType}`,
        type: assetType as any,
        brand,
        model: `${brand}-${Math.floor(Math.random() * 9000) + 1000}`,
        serialNumber: `SN${Math.floor(Math.random() * 900000000) + 100000000}`,
        purchaseDate,
        purchasePrice,
        vendor: getRandomElement(['Amazon Business', 'Flipkart', 'Dell Direct', 'HP Store']),
        warrantyExpiry: addMonths(purchaseDate, 36),
        status: isAllocated ? 'ALLOCATED' : 'AVAILABLE',
        condition: getRandomElement(['Excellent', 'Good', 'Fair']),
        depreciationRate: 20,
        currentValue: purchasePrice * 0.7
      }
    });

    assets.push(asset);

    // Allocate to random employee
    if (isAllocated) {
      const employee = getRandomElement(employees);
      const allocatedDate = addDays(purchaseDate, Math.floor(Math.random() * 30) + 1);

      const allocation = await prisma.assetAllocation.create({
        data: {
          assetId: asset.id,
          employeeId: employee.id,
          allocatedDate,
          condition: 'Good',
          notes: 'Asset allocated for work purposes'
        }
      });

      allocations.push(allocation);
    }
  }

  console.log(`✅ Created ${assets.length} assets and ${allocations.length} allocations`);
  return { assets, allocations };
}

async function seedExpenses(employees: any[]) {
  console.log('💳 Seeding expenses...');

  const expenseTypes = ['TRAVEL', 'ACCOMMODATION', 'MEALS', 'FUEL', 'INTERNET', 'MOBILE', 'SOFTWARE', 'OTHER'];
  const expenses = [];

  for (let i = 0; i < 30; i++) {
    const employee = getRandomElement(employees.filter(e => e.employeeType === 'FULL_TIME'));
    const expenseType = getRandomElement(expenseTypes);
    const date = addDays(new Date(), -Math.floor(Math.random() * 60));

    let amount = 0;
    let description = '';

    switch (expenseType) {
      case 'TRAVEL':
        amount = Math.floor(Math.random() * 3000) + 500;
        description = 'Travel expenses for client meeting';
        break;
      case 'ACCOMMODATION':
        amount = Math.floor(Math.random() * 4000) + 1000;
        description = 'Hotel stay for business trip';
        break;
      case 'MEALS':
        amount = Math.floor(Math.random() * 1000) + 200;
        description = 'Client lunch/dinner';
        break;
      case 'FUEL':
        amount = Math.floor(Math.random() * 2000) + 500;
        description = 'Fuel expenses for business travel';
        break;
      case 'INTERNET':
        amount = Math.floor(Math.random() * 1000) + 500;
        description = 'Home internet for WFH';
        break;
      case 'MOBILE':
        amount = Math.floor(Math.random() * 800) + 200;
        description = 'Mobile recharge for business calls';
        break;
      case 'SOFTWARE':
        amount = Math.floor(Math.random() * 3000) + 1000;
        description = 'Software subscription for work';
        break;
      default:
        amount = Math.floor(Math.random() * 2000) + 500;
        description = 'Miscellaneous business expense';
    }

    const status = getRandomElement(['SUBMITTED', 'APPROVED', 'APPROVED', 'REJECTED', 'REIMBURSED', 'REIMBURSED']);

    const expense = await prisma.expense.create({
      data: {
        employeeId: employee.id,
        expenseType: expenseType as any,
        amount,
        date,
        description,
        status: status as any,
        submittedAt: status !== 'DRAFT' ? date : null,
        approvedBy: ['APPROVED', 'REIMBURSED'].includes(status) ? employee.reportingManagerId : null,
        approvedAt: ['APPROVED', 'REIMBURSED'].includes(status) ? addDays(date, 2) : null,
        rejectedReason: status === 'REJECTED' ? 'Missing receipt' : null,
        reimbursedAt: status === 'REIMBURSED' ? addDays(date, 7) : null
      }
    });

    expenses.push(expense);
  }

  console.log(`✅ Created ${expenses.length} expenses`);
  return expenses;
}

async function seedAnnouncements(employees: any[]) {
  console.log('📢 Seeding announcements...');

  const announcementData = [
    {
      title: 'Diwali Celebration - Office Party',
      content: 'Join us for the Diwali celebration on October 20th at 6 PM. Dinner and cultural programs arranged!',
      priority: 'HIGH'
    },
    {
      title: 'New Health Insurance Policy',
      content: 'We are pleased to announce an enhanced health insurance policy covering family members. Details will be shared by HR.',
      priority: 'MEDIUM'
    },
    {
      title: 'Work From Home Policy Update',
      content: 'Effective immediately, employees can work from home up to 2 days per week. Please coordinate with your manager.',
      priority: 'HIGH'
    },
    {
      title: 'Q3 Results - Outstanding Performance',
      content: 'Congratulations team! We achieved 125% of our Q3 targets. Special appreciation to all departments.',
      priority: 'MEDIUM'
    },
    {
      title: 'Office Closure - Republic Day',
      content: 'The office will be closed on January 26th for Republic Day. Enjoy the long weekend!',
      priority: 'LOW'
    }
  ];

  const announcements = [];

  for (let i = 0; i < announcementData.length; i++) {
    const data = announcementData[i];
    const publisher = getRandomElement(employees.filter(e =>
      ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(e.userId)
    ));

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority as any,
        publishedBy: publisher.id,
        publishedAt: addDays(new Date(), -Math.floor(Math.random() * 30)),
        expiresAt: addDays(new Date(), Math.floor(Math.random() * 30) + 30)
      }
    });

    announcements.push(announcement);
  }

  console.log(`✅ Created ${announcements.length} announcements`);
  return announcements;
}

async function seedNotifications(employees: any[]) {
  console.log('🔔 Seeding notifications...');

  const notifications = [];
  const notificationTypes = ['LEAVE', 'ATTENDANCE', 'PAYROLL', 'PERFORMANCE', 'TRAINING', 'EXPENSE', 'ANNOUNCEMENT', 'TASK'];

  for (const employee of employees) {
    // Create 3-8 notifications per employee
    const notifCount = Math.floor(Math.random() * 6) + 3;

    for (let i = 0; i < notifCount; i++) {
      const type = getRandomElement(notificationTypes);
      const isRead = Math.random() > 0.4; // 60% read

      let title = '';
      let message = '';

      switch (type) {
        case 'LEAVE':
          title = 'Leave Request Update';
          message = 'Your leave request has been approved by your manager';
          break;
        case 'ATTENDANCE':
          title = 'Attendance Reminder';
          message = 'Please mark your attendance for today';
          break;
        case 'PAYROLL':
          title = 'Payslip Generated';
          message = 'Your payslip for this month has been generated';
          break;
        case 'PERFORMANCE':
          title = 'Performance Review';
          message = 'Your quarterly performance review is available';
          break;
        case 'TRAINING':
          title = 'Training Enrollment';
          message = 'You have been enrolled in a new training program';
          break;
        case 'EXPENSE':
          title: 'Expense Reimbursement';
          message = 'Your expense claim has been reimbursed';
          break;
        case 'ANNOUNCEMENT':
          title = 'New Announcement';
          message = 'A new company announcement has been posted';
          break;
        case 'TASK':
          title = 'Task Assigned';
          message = 'A new task has been assigned to you';
          break;
      }

      const user = await prisma.user.findFirst({
        where: { employee: { id: employee.id } }
      });

      if (!user) continue;

      const createdAt = addDays(new Date(), -Math.floor(Math.random() * 30));

      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          type: type as any,
          title,
          message,
          isRead,
          readAt: isRead ? addDays(createdAt, Math.floor(Math.random() * 3)) : null,
          createdAt
        }
      });

      notifications.push(notification);
    }
  }

  console.log(`✅ Created ${notifications.length} notifications`);
  return notifications;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Clear existing data
    await clearDatabase();
    console.log('');

    // 1. System Setup
    const departments = await seedDepartments();
    const designations = await seedDesignations();
    const shifts = await seedShifts();
    const leavePolicies = await seedLeavePolicies();
    const holidays = await seedHolidays();
    console.log('');

    // 2. Users & Employees
    const employees = await seedUsersAndEmployees(departments, designations);
    console.log('');

    // 3. Salary & Payroll
    const salaryStructures = await seedSalaryStructures(designations);
    const salaries = await seedEmployeeSalaries(employees, designations);
    const payslips = await seedPayslips(employees);
    console.log('');

    // 4. Attendance & Leaves
    const attendance = await seedAttendance(employees, shifts);
    const leaves = await seedLeaves(employees);
    console.log('');

    // 5. Clients & Projects
    const clients = await seedClients();
    const { projects, tasks } = await seedProjectsAndTasks(clients, departments, employees, designations);
    console.log('');

    // 6. Recruitment
    const jobs = await seedJobs(departments, designations);
    const { applications, interviews } = await seedApplicationsAndInterviews(jobs);
    console.log('');

    // 7. Performance & Goals
    const { goals, performances } = await seedPerformanceAndGoals(employees);
    console.log('');

    // 8. Training
    const { trainings, enrollments } = await seedTraining(employees);
    console.log('');

    // 9. Assets
    const { assets, allocations } = await seedAssets(employees);
    console.log('');

    // 10. Expenses
    const expenses = await seedExpenses(employees);
    console.log('');

    // 11. Announcements
    const announcements = await seedAnnouncements(employees);
    console.log('');

    // 12. Notifications
    const notifications = await seedNotifications(employees);
    console.log('');

    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Departments: ${departments.length}`);
    console.log(`   - Designations: ${designations.length}`);
    console.log(`   - Shifts: ${shifts.length}`);
    console.log(`   - Leave Policies: ${leavePolicies.length}`);
    console.log(`   - Holidays: ${holidays.length}`);
    console.log(`   - Employees: ${employees.length}`);
    console.log(`   - Salary Structures: ${salaryStructures.length}`);
    console.log(`   - Salaries: ${salaries.length}`);
    console.log(`   - Payslips: ${payslips.length}`);
    console.log(`   - Attendance Records: ${attendance.length}`);
    console.log(`   - Leaves: ${leaves.length}`);
    console.log(`   - Clients: ${clients.length}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Tasks: ${tasks.length}`);
    console.log(`   - Jobs: ${jobs.length}`);
    console.log(`   - Applications: ${applications.length}`);
    console.log(`   - Interviews: ${interviews.length}`);
    console.log(`   - Goals: ${goals.length}`);
    console.log(`   - Performance Reviews: ${performances.length}`);
    console.log(`   - Training Courses: ${trainings.length}`);
    console.log(`   - Training Enrollments: ${enrollments.length}`);
    console.log(`   - Assets: ${assets.length}`);
    console.log(`   - Asset Allocations: ${allocations.length}`);
    console.log(`   - Expenses: ${expenses.length}`);
    console.log(`   - Announcements: ${announcements.length}`);
    console.log(`   - Notifications: ${notifications.length}`);
    console.log('\n💡 Test Credentials:');
    console.log('   Email: rajesh.sharma@priacc.com');
    console.log('   Password: Password@123');
    console.log('   Role: SUPER_ADMIN\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
