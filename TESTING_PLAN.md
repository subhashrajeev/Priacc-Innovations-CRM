# Comprehensive Testing Plan - Priacc CRM/HRMS

## Testing Execution Strategy

### Phase 1: Pre-Deployment Testing (Current Environment)
- [x] Code structure validation
- [x] Dependency verification
- [x] TypeScript compilation checks
- [x] Security audit
- [x] Missing component identification
- [x] Critical bug fixes

### Phase 2: Local Development Testing (Required)
- [ ] Database setup and migrations
- [ ] Seed data loading
- [ ] Development server startup
- [ ] Basic functionality smoke tests
- [ ] API endpoint verification

### Phase 3: Integration Testing (Staging Environment)
- [ ] Authentication flows
- [ ] CRUD operations for all modules
- [ ] API integration testing
- [ ] File upload/download
- [ ] Email notifications
- [ ] Real-time features

### Phase 4: User Acceptance Testing (UAT)
- [ ] End-to-end workflows
- [ ] Role-based access testing
- [ ] Business logic validation
- [ ] Performance testing
- [ ] Cross-browser testing
- [ ] Mobile responsiveness

### Phase 5: Production Readiness
- [ ] Load testing
- [ ] Security penetration testing
- [ ] Backup and recovery
- [ ] Monitoring setup
- [ ] Documentation review

---

## 1. INITIAL SETUP & DEPLOYMENT TESTING

### 1.1 Fresh Installation Checklist

```bash
# Clone repository
git clone https://github.com/priacc-innovations/crm-hrms.git
cd crm-hrms

# Install dependencies
npm install

# Expected output: All dependencies installed without errors
# ✓ Should install 577+ packages

# Create environment file
cp .env.example .env
# Edit .env with actual credentials

# Generate Prisma Client
npx prisma generate
# Expected: Prisma client generated successfully

# Run database migrations
npx prisma migrate dev
# Expected: All migrations run successfully

# Seed database
npm run prisma:seed
# Expected: 1,200+ records created

# Start development server
npm run dev
# Expected: Server running on http://localhost:3000
```

**Success Criteria:**
- ✓ Zero installation errors
- ✓ All 577+ packages installed
- ✓ Prisma client generated
- ✓ Database migrations successful
- ✓ Seed data loaded (1,200+ records)
- ✓ Server starts without errors
- ✓ Application accessible at localhost:3000

### 1.2 Database Verification

```sql
-- Connect to PostgreSQL
psql -h localhost -U postgres -d priacc_crm_hrms

-- Verify all tables created
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Expected: 30+ tables

-- Check sample data
SELECT COUNT(*) FROM "User";
-- Expected: 20 users

SELECT COUNT(*) FROM "Employee";
-- Expected: 20 employees

SELECT COUNT(*) FROM "Attendance";
-- Expected: 600+ attendance records

SELECT COUNT(*) FROM "Leave";
-- Expected: 100+ leave records

SELECT COUNT(*) FROM "Payslip";
-- Expected: 60 payslips

-- Verify indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';
-- Expected: Multiple indexes on foreign keys and frequently queried fields

-- Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
-- Expected: All relationships defined in schema
```

---

## 2. AUTHENTICATION & AUTHORIZATION TESTING

### 2.1 Registration Flow Tests

**Test Case 1: Valid Registration**
```
URL: /auth/register
Method: POST
Data: {
  firstName: "Test",
  lastName: "User",
  email: "test.user@priacc.com",
  employeeCode: "PRI9999",
  password: "Test@12345",
  confirmPassword: "Test@12345"
}
Expected: 201 Created, user account created
```

**Test Case 2: Duplicate Email**
```
Attempt to register with existing email: rajesh.sharma@priacc.com
Expected: 400 Bad Request, "Email already exists" error
```

**Test Case 3: Weak Password**
```
Password: "12345"
Expected: 400 Bad Request, password strength validation error
```

**Test Case 4: Password Mismatch**
```
Password: "Test@12345"
Confirm Password: "Test@54321"
Expected: 400 Bad Request, "Passwords do not match" error
```

### 2.2 Login Testing

**Test Credentials (From Seed Data):**
- CEO: rajesh.sharma@priacc.com / Password@123
- HR Manager: neha.gupta@priacc.com / Password@123
- Engineer: rohan.joshi@priacc.com / Password@123

**Test Case 1: Valid Login**
```
Email: rajesh.sharma@priacc.com
Password: Password@123
Expected: 200 OK, session created, redirect to /dashboard
```

**Test Case 2: Invalid Password**
```
Email: rajesh.sharma@priacc.com
Password: WrongPassword
Expected: 401 Unauthorized, "Invalid credentials" error
```

**Test Case 3: Non-existent Email**
```
Email: nonexistent@priacc.com
Password: Password@123
Expected: 401 Unauthorized, "User not found" error
```

**Test Case 4: Session Timeout**
```
1. Login successfully
2. Wait for session timeout (30 days configured)
3. Attempt to access protected route
Expected: Redirect to /auth/login
```

### 2.3 Role-Based Access Control

**Test Matrix:**

| Role | Employee Module | Payroll | Recruitment | Analytics |
|------|----------------|---------|-------------|-----------|
| SUPER_ADMIN | ✓ Full Access | ✓ Full | ✓ Full | ✓ Full |
| ADMIN | ✓ Full Access | ✓ Full | ✓ Full | ✓ Full |
| HR_MANAGER | ✓ Full Access | ✓ Full | ✓ Full | ✓ Basic |
| HR_EXECUTIVE | ✓ View/Edit | ✓ View | ✓ Manage | ✗ None |
| MANAGER | ✓ Team Only | ✓ Team | ✗ None | ✓ Team |
| EMPLOYEE | ✓ Self Only | ✓ Self | ✗ None | ✗ None |

**Test Procedure:**
1. Login as each role
2. Attempt to access each module
3. Verify permissions match the matrix
4. Test API endpoints with each role's token
5. Attempt unauthorized actions (should fail with 403)

---

## 3. EMPLOYEE MANAGEMENT MODULE TESTING

### 3.1 CRUD Operations

**Create Employee:**
```javascript
// Test Data
const newEmployee = {
  firstName: "Amit",
  lastName: "Patel",
  email: "amit.patel@priacc.com",
  phoneNumber: "9876543210",
  dateOfBirth: "1990-05-15",
  gender: "MALE",
  dateOfJoining: "2024-12-01",
  employeeType: "FULL_TIME",
  departmentId: "[Engineering Department ID]",
  designationId: "[Software Engineer ID]",
  reportingManagerId: "[Manager ID]"
};

// Expected:
// - Employee created with auto-generated code (PRI0021)
// - User account created
// - Welcome email sent (if configured)
```

**Read Employee:**
```
GET /api/employees/[id]
Expected: Employee details with all related data
```

**Update Employee:**
```
PATCH /api/employees/[id]
Data: { phoneNumber: "9999999999" }
Expected: Employee updated, auditLog created
```

**Delete Employee:**
```
DELETE /api/employees/[id]
Expected: Employee status set to TERMINATED
```

### 3.2 Search & Filter Tests

**Test Case 1: Name Search**
```
Search: "raj"
Expected: Returns "Rajesh Sharma" and any other matching employees
```

**Test Case 2: Department Filter**
```
Filter: Department = "Engineering"
Expected: Returns only Engineering department employees
```

**Test Case 3: Combined Filters**
```
Department: "Engineering"
Designation: "Software Engineer"
Status: "ACTIVE"
Expected: Returns active software engineers in engineering
```

**Test Case 4: Pagination**
```
Page: 2
Limit: 20
Expected: Returns employees 21-40
```

### 3.3 Org Chart Testing

**Test Procedure:**
1. Navigate to /employees/org-chart
2. Verify CEO (Rajesh Sharma) at top
3. Check reporting hierarchy displays correctly
4. Test expand/collapse functionality
5. Click on employee card
6. Verify redirect to employee profile

**Expected Hierarchy:**
```
Rajesh Sharma (CEO)
├── Neha Gupta (HR Manager)
│   └── Priya Reddy (HR Executive)
├── Vikram Singh (Engineering Manager)
│   ├── Arjun Verma (Tech Lead)
│   │   ├── Rohan Joshi (Engineer)
│   │   ├── Sneha Iyer (Engineer)
│   │   └── Kabir Malik (Engineer)
│   └── Anjali Desai (Engineer)
└── [Other managers and teams]
```

---

## 4. ATTENDANCE MODULE TESTING

### 4.1 Check-in/Check-out Tests

**Test Case 1: Morning Check-in**
```javascript
// Simulated geolocation
const location = {
  latitude: 17.4485,  // Hyderabad, Hi-Tech City
  longitude: 78.3908,
  accuracy: 10
};

POST /api/attendance/checkin
Body: {
  checkInTime: "2024-11-22T09:15:00",
  location: location
}

Expected:
- Attendance record created with status PRESENT
- Check-in time: 09:15 AM
- Location captured
- No late coming flag (before 9:30 AM)
```

**Test Case 2: Late Check-in**
```
checkInTime: "2024-11-22T10:00:00"
Expected:
- Attendance created with late coming flag
- Email notification to manager (if configured)
```

**Test Case 3: Evening Check-out**
```
POST /api/attendance/checkout
Body: {
  checkOutTime: "2024-11-22T18:30:00",
  location: location
}

Expected:
- Check-out time updated
- Work hours calculated: 9.25 hours
- Overtime: 0.25 hours (if policy applies)
```

**Test Case 4: Multiple Check-ins**
```
Attempt second check-in on same day
Expected: 400 Bad Request, "Already checked in today"
```

**Test Case 5: Weekend Check-in**
```
Attempt check-in on Saturday/Sunday
Expected:
- Attendance created with status WEEKEND or WFH
- Or warning message based on policy
```

### 4.2 Attendance Reports

**Monthly Report Test:**
```
GET /api/attendance?employeeId=[ID]&month=11&year=2024

Expected Response:
{
  totalDays: 30,
  present: 22,
  absent: 0,
  leaves: 2,
  weekends: 4,
  holidays: 2,
  workFromHome: 0,
  totalWorkHours: 192.5,
  avgCheckInTime: "09:25 AM",
  avgCheckOutTime: "18:20 PM",
  lateComings: 3,
  earlyLeavings: 0
}
```

### 4.3 Regularization Tests

**Test Case: Submit Regularization**
```
POST /api/attendance/regularize
Body: {
  date: "2024-11-20",
  checkInTime: "09:00:00",
  checkOutTime: "18:00:00",
  reason: "Forgot to punch in/out"
}

Expected:
- Regularization request created with status PENDING
- Notification sent to manager
- Manager sees request in approval queue
```

---

## 5. LEAVE MANAGEMENT TESTING

### 5.1 Leave Application Tests

**Test Case 1: Valid Leave Application**
```
POST /api/leave
Body: {
  leaveType: "CASUAL",
  startDate: "2024-12-10",
  endDate: "2024-12-12",
  totalDays: 3,
  halfDay: false,
  reason: "Personal work"
}

Expected:
- Leave created with status PENDING
- Leave balance deducted (pending approval)
- Notification to manager
- Email sent to manager
```

**Test Case 2: Insufficient Balance**
```
Apply for 15 days Casual Leave
(Employee has only 12 days available)

Expected: 400 Bad Request, "Insufficient leave balance"
```

**Test Case 3: Half-Day Leave**
```
Body: {
  leaveType: "CASUAL",
  startDate: "2024-12-05",
  endDate: "2024-12-05",
  totalDays: 0.5,
  halfDay: true
}

Expected: Leave created for half day
```

**Test Case 4: Leave on Holiday**
```
Apply leave for Republic Day (26th Jan 2025)
Expected: Warning message, "Selected date is a holiday"
```

### 5.2 Leave Approval Workflow

**Test Procedure:**
1. Login as employee (rohan.joshi@priacc.com)
2. Apply for leave (3 days)
3. Logout
4. Login as manager (vikram.singh@priacc.com)
5. Navigate to /leave/approvals
6. See pending leave request
7. Approve the leave
8. Logout
9. Login back as employee
10. Verify leave status changed to APPROVED
11. Check leave balance updated

**Expected Behavior:**
- Manager sees all pending leaves for their team
- Approve button updates status to APPROVED
- Employee gets notification
- Email sent to employee
- Leave balance adjusted
- Attendance marked as ON_LEAVE for those dates

### 5.3 Leave Balance Tests

**Test Balance Calculation:**
```
GET /api/leave/balance

Expected Response:
[
  {
    leaveType: "CASUAL",
    total: 12,
    used: 5,
    pending: 3,
    available: 4
  },
  {
    leaveType: "SICK",
    total: 12,
    used: 2,
    pending: 0,
    available: 10
  },
  {
    leaveType: "PRIVILEGE",
    total: 15,
    used: 0,
    pending: 0,
    available: 15
  }
]
```

---

## 6. PAYROLL MODULE TESTING

### 6.1 Salary Structure Tests

**Test Case: Create Salary Structure**
```javascript
const salaryStructure = {
  designationId: "[Software Engineer ID]",
  name: "Software Engineer - Standard",
  minCTC: 500000,  // 5 LPA
  maxCTC: 800000,  // 8 LPA
  basicSalary: 200000,  // 40% of CTC
  hra: 100000,          // 50% of basic
  specialAllowance: 150000,
  conveyance: 19200,
  medicalAllowance: 15000,
  otherAllowances: 15800,
  pf: 24000,            // 12% of basic
  esi: 0,               // If gross > 21000/month
  professionalTax: 2400
};

POST /api/payroll/salary
Body: salaryStructure

Expected: Salary structure created with auto-calculated components
```

### 6.2 Payroll Processing Tests

**Test Case: Generate Monthly Payslip**
```javascript
POST /api/payroll/payslip
Body: {
  employeeIds: ["all"], // or specific IDs
  month: 11,
  year: 2024
}

Expected Process:
1. Fetch attendance for each employee
2. Calculate present days
3. Calculate LOP (Loss of Pay) if any absences
4. Apply salary structure
5. Calculate deductions (PF, ESI, PT, TDS)
6. Generate payslip with all components
7. Save to database
8. Return summary of generated payslips
```

**Expected Payslip Structure:**
```json
{
  "employee": "Rohan Joshi",
  "employeeCode": "PRI0009",
  "month": "November",
  "year": 2024,
  "earnings": {
    "basic": 16667,
    "hra": 8333,
    "specialAllowance": 12500,
    "conveyance": 1600,
    "medical": 1250,
    "other": 1317,
    "grossEarnings": 41667
  },
  "deductions": {
    "pf": 2000,
    "esi": 0,
    "pt": 200,
    "tds": 1500,
    "totalDeductions": 3700
  },
  "netPay": 37967,
  "attendance": {
    "totalDays": 30,
    "present": 22,
    "leaves": 2,
    "weekends": 4,
    "holidays": 2,
    "lop": 0
  }
}
```

### 6.3 Tax Calculation Tests

**Test Indian Tax Calculation (FY 2024-25):**
```javascript
// Annual Salary: 5,00,000
const taxCalculation = {
  grossIncome: 500000,
  standardDeduction: 50000,
  section80C: 150000,  // PPF, ELSS, etc.
  section80D: 25000,   // Health insurance
  taxableIncome: 275000,

  // New tax regime calculation
  tax: 0 + (275000 - 300000 < 0 ? 0 : (275000 - 300000) * 0.05)
};

Expected: Tax = 0 (Income below 3 lakhs threshold)
```

---

## 7. PERFORMANCE MANAGEMENT TESTING

### 7.1 Goal Setting Tests

**Test Case: Create Individual Goal**
```
POST /api/goals
Body: {
  employeeId: "[Employee ID]",
  title: "Improve Code Quality",
  description: "Achieve 90% code coverage in unit tests",
  category: "Technical",
  priority: "HIGH",
  startDate: "2024-01-01",
  dueDate: "2024-12-31",
  keyResults: [
    "Increase test coverage from 60% to 90%",
    "Reduce code review comments by 50%",
    "Complete 2 technical certifications"
  ]
}

Expected: Goal created with status NOT_STARTED
```

**Test Case: Update Goal Progress**
```
PATCH /api/goals/[id]
Body: {
  progress: 75,
  status: "IN_PROGRESS"
}

Expected: Goal progress updated
```

### 7.2 Performance Review Tests

**Test Case: Create Performance Review**
```
POST /api/performance
Body: {
  employeeId: "[ID]",
  reviewCycle: "ANNUAL",
  reviewPeriod: "FY 2024",
  technicalSkills: 4,
  communication: 5,
  teamwork: 4,
  leadership: 3,
  initiative: 4,
  problemSolving: 5,
  overallRating: "EXCEEDS_EXPECTATIONS",
  strengths: "Excellent problem-solving skills...",
  areasOfImprovement: "Could improve in...",
  reviewerComments: "Outstanding performance..."
}

Expected: Performance review created
```

---

## 8. RECRUITMENT MODULE TESTING

### 8.1 Job Posting Tests

**Test Case: Create Job Posting**
```
POST /api/recruitment/jobs
Body: {
  title: "Senior Software Engineer",
  code: "JOB-SE-2024-01",
  departmentId: "[Engineering ID]",
  designationId: "[Senior Engineer ID]",
  description: "We are looking for...",
  requirements: "5+ years experience...",
  responsibilities: "Design and develop...",
  jobType: "FULL_TIME",
  experience: "5-8 years",
  location: "Hyderabad",
  salaryRange: "15-20 LPA",
  openings: 2,
  status: "OPEN"
}

Expected: Job posting created, visible on careers page
```

### 8.2 Application Management

**Test Case: Submit Application**
```
POST /api/recruitment/applications
Body: {
  jobId: "[Job ID]",
  firstName: "Candidate",
  lastName: "Name",
  email: "candidate@email.com",
  phone: "9876543210",
  resumeUrl: "[S3/Cloudinary URL]",
  totalExperience: 6,
  currentCTC: 1200000,
  expectedCTC: 1800000,
  noticePeriod: 30
}

Expected: Application created with status APPLIED
```

### 8.3 Interview Scheduling

**Test Case: Schedule Interview**
```
POST /api/recruitment/interviews
Body: {
  applicationId: "[Application ID]",
  round: 1,
  type: "TECHNICAL",
  scheduledDate: "2024-12-05",
  scheduledTime: "10:00",
  duration: 60,
  location: "Video Call",
  meetingLink: "https://meet.google.com/xxx",
  interviewers: "[Interviewer IDs]"
}

Expected:
- Interview scheduled
- Calendar invite sent
- Email to candidate
- Reminder notifications
```

---

## 9. PROJECT & CLIENT MANAGEMENT (CRM) TESTING

### 9.1 Client Management

**Test Case: Create Client**
```
POST /api/clients
Body: {
  name: "TechCorp Solutions",
  code: "CLI-001",
  industry: "Technology",
  email: "contact@techcorp.com",
  phone: "080-12345678",
  address: "Bangalore, Karnataka",
  contactPerson: "Mr. Sharma",
  status: "ACTIVE"
}

Expected: Client created
```

### 9.2 Project Management

**Test Case: Create Project**
```
POST /api/projects
Body: {
  name: "CRM Implementation",
  code: "PRJ-CRM-001",
  clientId: "[Client ID]",
  departmentId: "[Engineering ID]",
  description: "Implement CRM system...",
  status: "ACTIVE",
  priority: "HIGH",
  startDate: "2024-12-01",
  endDate: "2025-03-31",
  estimatedBudget: 5000000,
  projectManager: "[Manager ID]",
  teamMembers: "[Employee IDs]"
}

Expected: Project created
```

### 9.3 Timesheet Management

**Test Case: Log Time**
```
POST /api/timesheets
Body: {
  employeeId: "[ID]",
  projectId: "[ID]",
  date: "2024-11-22",
  hours: 8,
  description: "Developed login module",
  taskType: "Development",
  billable: true
}

Expected: Timesheet entry created
```

---

## 10. UI/UX TESTING

### 10.1 Responsive Design Testing

**Desktop (1920x1080):**
- ✓ Sidebar expands fully
- ✓ Tables show all columns
- ✓ Charts render properly
- ✓ No horizontal scroll
- ✓ All content visible without zoom

**Tablet (768x1024):**
- ✓ Sidebar collapses to icons
- ✓ Tables stack or scroll horizontally
- ✓ Touch-friendly button sizes
- ✓ Bottom navigation appears

**Mobile (375x667):**
- ✓ Hamburger menu for navigation
- ✓ Single column layout
- ✓ Swipe gestures work
- ✓ Forms are usable
- ✓ No tiny text (<14px)

### 10.2 Browser Compatibility

**Test Matrix:**
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Login | ✓ | ✓ | ✓ | ✓ |
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Forms | ✓ | ✓ | ✓ | ✓ |
| File Upload | ✓ | ✓ | ✓ | ✓ |
| Charts | ✓ | ✓ | ✓ | ✓ |
| Animations | ✓ | ✓ | ✓ | ✓ |

### 10.3 Theme Testing

**Dark Mode:**
1. Click theme toggle
2. Verify all components switch to dark theme
3. Check contrast ratios
4. Ensure readability

**Light Mode:**
1. Switch back to light mode
2. Verify proper color scheme
3. Check all pages

**System Preference:**
1. Set system to dark mode
2. Open application
3. Verify it respects system preference

---

## 11. PERFORMANCE TESTING

### 11.1 Page Load Times

**Acceptance Criteria:** < 2 seconds

**Test Pages:**
- /dashboard
- /employees
- /attendance
- /leave
- /payroll
- /projects
- /analytics

**Measurement:** Use Chrome DevTools Lighthouse

### 11.2 API Response Times

**Acceptance Criteria:** < 200ms

**Test Endpoints:**
```
GET /api/employees - Target: < 150ms
GET /api/attendance/stats - Target: < 200ms
POST /api/leave - Target: < 100ms
GET /api/payroll/payslip - Target: < 200ms
GET /api/analytics/dashboard - Target: < 300ms
```

### 11.3 Load Testing

**Scenario 1: 100 Concurrent Users**
```bash
# Using K6 or Apache JMeter
# Simulate 100 users logging in simultaneously
# Expected: All requests successful, response time < 3s
```

**Scenario 2: Large Dataset**
```
# Load 10,000 employee records
# Test list page performance
# Expected: Pagination works, < 2s load time
```

---

## 12. SECURITY TESTING

### 12.1 SQL Injection Tests

**Test All Input Fields:**
```sql
-- Attempt SQL injection in search
Search: "'; DROP TABLE Employee; --"
Expected: Safely handled by Prisma, no SQL execution

-- Try in login
Email: "admin'--"
Password: "anything"
Expected: Login fails, no SQL error exposed
```

### 12.2 XSS Tests

**Test Script Injection:**
```html
<!-- Attempt XSS in employee name -->
Name: "<script>alert('XSS')</script>"
Expected: String is escaped/sanitized, no script execution

<!-- Try in announcement -->
Content: "<img src=x onerror=alert('XSS')>"
Expected: HTML sanitized, safe display
```

### 12.3 Authorization Tests

**Test Unauthorized Access:**
```
1. Login as EMPLOYEE role
2. Try to access: GET /api/payroll/salary (HR only)
   Expected: 403 Forbidden

3. Try to access: POST /api/employees (HR only)
   Expected: 403 Forbidden

4. Try to access: GET /api/analytics/hr (Admin only)
   Expected: 403 Forbidden
```

---

## TEST DATA REQUIREMENTS

### Pre-populated Test Data (From Seed):
✓ 5 Departments
✓ 15 Designations
✓ 20 Employees (various roles)
✓ 600+ Attendance records
✓ 100+ Leave records
✓ 60 Payslips
✓ 5 Clients
✓ 10 Projects
✓ 8 Training courses
✓ 25 Assets
✓ 30 Expense claims

### Additional Test Data Needed:
- [ ] 100+ additional employees for load testing
- [ ] 12 months of continuous attendance
- [ ] 50+ job applications
- [ ] 20+ performance reviews
- [ ] Multiple salary structures
- [ ] Various document types

---

## AUTOMATION TEST SCRIPTS

### Unit Test Example (Jest):
```javascript
// lib/utils.test.ts
import { calculatePF, calculateESI, calculateTax } from './utils';

describe('Payroll Calculations', () => {
  test('PF calculation for basic < 15000', () => {
    const pf = calculatePF(12000);
    expect(pf).toBe(1440); // 12% of 12000
  });

  test('PF calculation for basic > 15000', () => {
    const pf = calculatePF(20000);
    expect(pf).toBe(1800); // 12% of 15000 (capped)
  });

  test('ESI calculation for gross <= 21000', () => {
    const esi = calculateESI(20000);
    expect(esi).toBe(150); // 0.75% of 20000
  });

  test('ESI calculation for gross > 21000', () => {
    const esi = calculateESI(25000);
    expect(esi).toBe(0); // Not applicable
  });

  test('Tax calculation for 5 LPA', () => {
    const tax = calculateTax(500000);
    expect(tax).toBe(0); // Below threshold
  });

  test('Tax calculation for 10 LPA', () => {
    const tax = calculateTax(1000000);
    expect(tax).toBeGreaterThan(0);
  });
});
```

### E2E Test Example (Playwright):
```javascript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');

    // Fill login form
    await page.fill('input[type="email"]', 'rajesh.sharma@priacc.com');
    await page.fill('input[type="password"]', 'Password@123');

    // Click login button
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Should show user name
    await expect(page.locator('text=Rajesh Sharma')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login');

    await page.fill('input[type="email"]', 'test@priacc.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL('/auth/login');
  });
});
```

---

## FINAL VALIDATION CHECKLIST

### Before Production Deployment:

**Code Quality:**
- [ ] TypeScript compiles without errors
- [ ] All dependencies updated to latest stable versions
- [ ] No console.log statements in production code
- [ ] All TODO comments resolved
- [ ] Code review completed
- [ ] Security scan passed

**Functionality:**
- [ ] All 12 modules tested and working
- [ ] All CRUD operations successful
- [ ] All workflows complete end-to-end
- [ ] All reports generate correctly
- [ ] All emails send successfully
- [ ] All file uploads/downloads work

**Performance:**
- [ ] Page load < 2 seconds
- [ ] API response < 200ms
- [ ] Database queries optimized
- [ ] No memory leaks detected
- [ ] Lighthouse score > 90

**Security:**
- [ ] SQL injection tests passed
- [ ] XSS tests passed
- [ ] CSRF protection verified
- [ ] Authorization tests passed
- [ ] Session management tested
- [ ] Data encryption verified

**Deployment:**
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Seed data loaded
- [ ] Backup procedure tested
- [ ] Rollback procedure tested
- [ ] Monitoring configured
- [ ] Error tracking set up

---

## TEST EXECUTION TIMELINE

### Week 1: Setup & Unit Testing
- Day 1-2: Environment setup, database setup
- Day 3-5: Unit tests for all modules

### Week 2: Integration Testing
- Day 1-2: Authentication & authorization
- Day 3-4: Module integration tests
- Day 5: API integration tests

### Week 3: System Testing
- Day 1-2: End-to-end workflows
- Day 3: Performance testing
- Day 4: Security testing
- Day 5: UAT preparation

### Week 4: UAT & Production Prep
- Day 1-3: User acceptance testing
- Day 4: Bug fixes
- Day 5: Production deployment

---

## ISSUE TRACKING

### Critical Issues Found:
1. ~~Missing Prisma Client~~ - **FIXED**
2. ~~Missing UI Components (textarea, switch)~~ - **FIXED**
3. ~~Missing Dependencies~~ - **FIXED**
4. ~~Toast Type Export~~ - **FIXED**

### Major Issues:
1. Console.log statements (105 files) - **TO FIX**
2. Implicit 'any' types (50+ instances) - **TO FIX**
3. TODO comments (15 files) - **TO REVIEW**

### Minor Issues:
1. Session timeout too long (30 days) - **TO CONFIGURE**
2. No rate limiting - **TO IMPLEMENT**
3. No error boundary - **TO ADD**

---

## CONCLUSION

The Priacc CRM/HRMS application has a **solid foundation** with comprehensive features across all 12 modules. The codebase is well-structured, uses modern technologies, and follows best practices.

**Current Status:** Ready for staging deployment after Prisma client generation

**Recommendation:**
1. Deploy to staging environment
2. Generate Prisma client
3. Run complete test suite
4. Fix identified issues
5. Conduct UAT
6. Deploy to production

**Estimated Production Readiness:** 1-2 weeks after staging deployment
