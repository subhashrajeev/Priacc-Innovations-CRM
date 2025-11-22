# Database Seeding Instructions

## Overview

This document provides comprehensive instructions for seeding the Priacc CRM/HRMS database with realistic demo data.

## Prerequisites

1. **PostgreSQL Database**: Ensure PostgreSQL is installed and running
2. **Node.js**: Version 18+ recommended
3. **Dependencies**: All npm packages installed

## Setup Steps

### 1. Configure Database

Create a `.env` file in the project root (if not already exists):

```bash
cp prisma/.env.example .env
```

Update the `DATABASE_URL` in `.env` with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/priacc_crm_dev?schema=public"
```

### 2. Run Migrations

Generate Prisma Client and run database migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 3. Run the Seeder

Execute the seed script to populate the database:

```bash
npm run prisma:seed
```

**Note**: The seeder is idempotent and will clear existing data before seeding in development mode.

## What Gets Seeded?

### System Configuration (70+ records)
- ✅ 5 Departments (Engineering, HR, Sales, Marketing, Operations)
- ✅ 15 Designations with hierarchical levels (1-7)
- ✅ 8 Shift configurations (General, Night, US, UK, Flexible, etc.)
- ✅ 9 Leave Policies (Casual, Sick, Privilege, Earned, etc.)
- ✅ 15 Holidays for 2025 (Indian holidays)

### Users & Employees (20 employees)
- ✅ 1 Super Admin (CEO) - Rajesh Sharma
- ✅ 2 Admin users (Directors)
- ✅ 2 HR Managers/Executives
- ✅ 2 Engineering Managers/Leads
- ✅ 10 Regular Employees across departments
- ✅ 3 Interns

**Employee Codes**: PRI0001 to PRI0020

**All Passwords**: `Password@123` (hashed with bcrypt)

### Attendance & Leaves (600+ records)
- ✅ Last 30 days attendance for all active employees
- ✅ Mixed status: Present (80%), WFH (10%), Leave (5%), Absent (5%)
- ✅ Realistic check-in/check-out times
- ✅ 100+ leave records (approved, pending, rejected)
- ✅ Mix of half-day and full-day leaves

### Salary & Payroll (80+ records)
- ✅ Salary structures for all designations
- ✅ CTC ranges:
  - Intern: ₹3 LPA
  - Junior: ₹5 LPA
  - Mid-level: ₹8 LPA
  - Senior: ₹12 LPA
  - Lead: ₹15-18 LPA
  - Manager: ₹15-25 LPA
  - Director: ₹30 LPA
  - CEO: ₹50 LPA
- ✅ Last 3 months payslips for all employees
- ✅ Bonus allocation for select months

### CRM & Projects (65+ records)
- ✅ 5 Clients (TechCorp, GlobalSoft, StartupXYZ, EnterpriseCo, InnovateLabs)
- ✅ 10 Projects with realistic timelines and budgets
- ✅ 50+ Tasks across projects in various statuses
- ✅ Project managers and team assignments

### Recruitment (35+ records)
- ✅ 5 Open job postings
- ✅ 20 Applications in various stages
- ✅ 10+ Scheduled interviews

### Performance & Goals (80+ records)
- ✅ 60+ Goals assigned to employees
- ✅ 20+ Performance reviews for Q3 2024
- ✅ Mix of ratings and comprehensive feedback

### Training & Development (60+ records)
- ✅ 8 Training courses (Technical, Soft Skills, Compliance, Leadership)
- ✅ 50+ Employee enrollments
- ✅ Mix of completed and ongoing courses

### Asset Management (50+ records)
- ✅ 25 Assets (laptops, monitors, mobiles, peripherals)
- ✅ Asset allocations to employees
- ✅ Purchase dates, warranties, and valuations

### Expenses (30 records)
- ✅ 30 Expense claims with various statuses
- ✅ Different expense types (Travel, Meals, Internet, etc.)
- ✅ Amounts ranging from ₹500 to ₹5000

### Communication (100+ records)
- ✅ 5 Recent announcements
- ✅ 100+ Notifications for employees
- ✅ Mix of read/unread statuses

## Total Records: 1200+

## Test Credentials

### Super Admin Account
- **Email**: `rajesh.sharma@priacc.com`
- **Password**: `Password@123`
- **Role**: SUPER_ADMIN (CEO)
- **Employee Code**: PRI0001

### Other Test Accounts
- **HR Manager**: `neha.gupta@priacc.com` / `Password@123`
- **Engineering Manager**: `vikram.singh@priacc.com` / `Password@123`
- **Sales Manager**: `rahul.nair@priacc.com` / `Password@123`
- **Regular Employee**: `rohan.joshi@priacc.com` / `Password@123`
- **Intern**: `ishita.gupta@priacc.com` / `Password@123`

All users have the same password: **Password@123**

## Organizational Structure

```
Rajesh Sharma (CEO)
├── Priya Patel (Director - Operations)
├── Amit Kumar (Director - Operations)
│
├── Neha Gupta (HR Manager)
│   └── Sneha Reddy (HR Executive)
│
├── Vikram Singh (Engineering Manager)
│   └── Arjun Verma (Tech Lead)
│       ├── Rohan Joshi (Senior Software Engineer)
│       ├── Kavya Mehta (Software Engineer)
│       ├── Aditya Shah (Software Engineer)
│       └── Ishita Gupta (Intern)
│
├── Rahul Nair (Sales Manager)
│   ├── Riya Desai (Sales Executive)
│   ├── Karan Iyer (Sales Executive)
│   └── Simran Singh (Intern)
│
└── Divya Malhotra (Marketing Manager)
    ├── Akash Rao (Marketing Executive)
    ├── Anjali Kumar (Marketing Executive)
    └── Varun Patel (Intern)
```

## Useful Prisma Commands

### View Data in Prisma Studio
```bash
npm run prisma:studio
```
Opens a visual database browser at http://localhost:5555

### Reset Database
```bash
npx prisma migrate reset
```
This will:
1. Drop the database
2. Create a new database
3. Run all migrations
4. Run the seed script automatically

### Generate Prisma Client
```bash
npm run prisma:generate
```

### Create New Migration
```bash
npm run prisma:migrate
```

## Troubleshooting

### Issue: "Environment variable not found: DATABASE_URL"
**Solution**: Ensure `.env` file exists in the project root with valid `DATABASE_URL`

### Issue: "Can't reach database server"
**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check database credentials in `.env`
3. Ensure database exists: `createdb priacc_crm_dev`

### Issue: "Table does not exist"
**Solution**: Run migrations first: `npm run prisma:migrate`

### Issue: Seed fails with foreign key constraint errors
**Solution**:
1. Clear database: `npx prisma migrate reset`
2. Run seed again: `npm run prisma:seed`

### Issue: "bcryptjs module not found"
**Solution**: Install dependencies: `npm install`

## Data Characteristics

### Realistic Indian Context
- ✅ Indian names (first and last names)
- ✅ Indian holidays (Diwali, Holi, Independence Day, etc.)
- ✅ Indian locations (Bangalore, Mumbai, Delhi, etc.)
- ✅ Indian currency (INR/₹)
- ✅ Indian tax structure
- ✅ Indian phone numbers (+91)
- ✅ Indian business hours (9:30 AM - 6:30 PM)

### Data Distribution
- **Attendance**: 80% Present, 10% WFH, 5% Leave, 5% Absent
- **Leave Status**: Mixed (Approved, Pending, Rejected)
- **Project Status**: Mostly Active, some Planning/On Hold/Completed
- **Application Status**: All stages of recruitment pipeline
- **Asset Allocation**: 80% allocated, 20% available
- **Expense Status**: Various stages (Submitted, Approved, Reimbursed, Rejected)

## Features

### Idempotent Seeding
- Can be run multiple times safely
- Clears existing data before seeding (development only)
- Uses transactions for data integrity

### Hierarchical Data
- Proper reporting manager relationships
- Department and designation hierarchies
- Project team structures

### Realistic Relationships
- Employees assigned to departments
- Projects linked to clients
- Tasks assigned to team members
- Assets allocated to employees
- Leaves linked to employees and approvers

### Date Ranges
- **Historical**: Last 30-60 days for attendance, expenses
- **Current**: Active projects, ongoing training
- **Future**: Upcoming leaves, scheduled interviews, future holidays

## Security Notes

1. **Default Password**: All users have `Password@123` - **CHANGE IN PRODUCTION**
2. **Sensitive Data**: Seed contains demo data only - not for production use
3. **Environment Variables**: Never commit `.env` file to version control
4. **Database Access**: Ensure proper database user permissions

## Next Steps

After seeding:

1. **Login**: Use any test account credentials
2. **Explore**: Navigate through different modules
3. **Test Features**: Create, update, delete operations
4. **Customize**: Modify seed data as needed for your use case
5. **Development**: Build new features with realistic data

## Support

For issues or questions:
- Check Prisma documentation: https://www.prisma.io/docs
- Review schema.prisma for data model
- Examine seed.ts for seeding logic

---

**Happy Coding! 🚀**
