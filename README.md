# Priacc CRM/HRMS - Enterprise Management Portal

<div align="center">

![Priacc Innovations](https://img.shields.io/badge/Priacc-Innovations-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Prisma](https://img.shields.io/badge/Prisma-5.9-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-316192)
![License](https://img.shields.io/badge/license-MIT-green)

**A full-stack, enterprise-grade CRM/HRMS portal for Priacc Innovations Private Limited**

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Documentation](#documentation) • [License](#license)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Module Documentation](#module-documentation)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

Priacc CRM/HRMS is a comprehensive, production-ready enterprise management system designed specifically for **Priacc Innovations Private Limited**, a startup enterprise software solutions company based in Hyderabad, India.

This platform rivals commercial solutions like Keka, BambooHR, and Zoho People, featuring:
- **12 Core Modules** covering all aspects of HR and CRM operations
- **Modern 2025 UI/UX** with glassmorphism effects and smooth animations
- **Role-Based Access Control** for secure multi-level operations
- **Real-time Analytics** and comprehensive reporting
- **Mobile-First Design** with PWA capabilities
- **Indian Compliance** ready (PF, ESI, TDS, Professional Tax)

---

## ✨ Features

### 🧑‍💼 Employee Management
- Complete employee lifecycle management
- Digital onboarding with document collection
- Interactive organizational chart
- Employee self-service portal
- Advanced search and filtering
- Bulk import/export capabilities

### ⏰ Attendance & Time Tracking
- Web-based check-in/check-out with geolocation
- Shift management and roster planning
- Work-from-home/hybrid tracking
- Overtime and comp-off calculation
- Real-time attendance dashboard
- Monthly reports and analytics

### 🏖️ Leave Management
- Multiple leave types (Casual, Sick, Privilege, Maternity, etc.)
- Real-time balance tracking with accrual rules
- Multi-level approval workflow
- Team leave calendar
- Leave encashment module
- Holiday calendar (Indian holidays)

### 💰 Payroll Management
- Indian CTC structure configuration
- Automatic tax computation (TDS, PF, ESI, PT)
- Digital payslip generation and distribution
- Salary revision management
- Investment declaration (80C, 80D, HRA)
- Form 16 generation ready

### 📊 Performance Management
- Goal setting with OKR support
- 360-degree feedback system
- Performance review cycles (Quarterly/Annual)
- 1-on-1 meeting scheduler
- Skills assessment
- Career development planning

### 🎯 Recruitment & ATS
- Applicant tracking system
- Job posting management
- Resume parsing capability
- Interview scheduling with calendar integration
- Multi-round feedback collection
- Offer letter generation

### 💼 Project & Client Management (CRM)
- Complete client database with history
- Project milestone tracking
- Resource allocation and capacity planning
- Timesheet management (billable/non-billable)
- Invoice generation and payment tracking
- Project profitability analysis

### 📚 Learning & Development
- Training course catalog
- Online course integration
- Certification tracking
- Training effectiveness measurement
- Individual development plans

### 💻 Asset Management
- IT asset allocation and tracking
- Asset lifecycle management
- Depreciation calculation
- QR code/barcode ready
- Asset audit tools

### 💳 Expense Management
- Expense claim submission with receipts
- Multi-level approval workflow
- Mileage tracking
- Advance request management
- Automated reimbursement

### 📢 Communication & Collaboration
- Company-wide announcements
- Document management system
- Policy repository
- Internal knowledge base
- Employee suggestion box

### 📈 Analytics & Reporting
- Real-time executive dashboard
- HR analytics (attrition, diversity, headcount)
- Custom report builder
- Predictive analytics
- Budget vs actual analysis

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.3
- **Styling:** Tailwind CSS 3.4
- **UI Components:** Shadcn UI + Radix UI
- **Animations:** Framer Motion 11
- **Charts:** Recharts 2.12
- **Forms:** React Hook Form + Zod validation
- **State Management:** Zustand 4.5
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js 20+
- **API:** Next.js API Routes (RESTful)
- **Authentication:** NextAuth.js 4.24 (JWT)
- **Database ORM:** Prisma 5.9
- **File Upload:** Base64 (ready for S3/Cloudinary)
- **Email:** SendGrid/Resend ready

### Database
- **Primary:** PostgreSQL 15+
- **Schema:** Prisma ORM with 40+ models
- **Migrations:** Prisma Migrate
- **Seeding:** Comprehensive sample data

### DevOps & Deployment
- **Package Manager:** npm
- **Hosting:** Vercel ready (also supports Railway, Render)
- **CI/CD:** GitHub Actions ready
- **Monitoring:** Logging infrastructure ready
- **Environment:** .env configuration

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                      │
│         (React 18 + Next.js 15 App Router)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Next.js Server                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Authentication Layer (NextAuth.js)              │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  API Routes (RESTful Endpoints)                  │  │
│  │  - /api/employees, /api/attendance, etc.         │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  Business Logic Layer                            │  │
│  │  - Validation, Calculations, Workflows           │  │
│  └──────────────────┬───────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Prisma ORM
                     │
┌────────────────────▼────────────────────────────────────┐
│              PostgreSQL Database                        │
│  - 40+ Tables (Employee, Attendance, Payroll, etc.)    │
│  - Relationships & Constraints                          │
│  - Indexes for Performance                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0 or higher (comes with Node.js)
- **PostgreSQL** 14.0 or higher ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/priacc-innovations/crm-hrms.git
cd crm-hrms
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/priacc_crm_hrms"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-generate-using-openssl"

# Email (Optional)
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PASSWORD="your-sendgrid-api-key"
EMAIL_FROM="noreply@priacc.com"

# File Storage (Optional)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

4. **Generate NextAuth Secret**

```bash
openssl rand -base64 32
```

---

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
# Using psql
psql -U postgres
CREATE DATABASE priacc_crm_hrms;
\q
```

### 2. Run Prisma Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 3. Seed Database (Optional but Recommended)

This will populate your database with sample data for testing:

```bash
npm run prisma:seed
```

**Seeding includes:**
- 5 Departments
- 15 Designations
- 20 Employees (including CEO, managers, staff, interns)
- 600+ Attendance records (last 30 days)
- 100+ Leave records
- 60 Payslips (last 3 months)
- 5 Clients and 10 Projects
- 50+ Tasks
- 20 Job Applications
- And much more!

**Test Credentials after seeding:**

| Role | Email | Password | Employee Code |
|------|-------|----------|---------------|
| CEO (Super Admin) | rajesh.sharma@priacc.com | Password@123 | PRI0001 |
| HR Manager | neha.gupta@priacc.com | Password@123 | PRI0003 |
| Engineering Manager | vikram.singh@priacc.com | Password@123 | PRI0005 |
| Engineer | rohan.joshi@priacc.com | Password@123 | PRI0009 |

See `SEEDING_INSTRUCTIONS.md` for complete details.

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Other Useful Commands

```bash
# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Run linting
npm run lint

# View database schema
npx prisma format
```

---

## 📖 Module Documentation

### Employee Management
- **Directory:** `/employees`
- **Features:** CRUD operations, org chart, onboarding
- **Access:** HR/Admin (full), Employees (view own)
- **API Routes:** `/api/employees/*`, `/api/departments/*`, `/api/designations/*`

### Attendance & Time Tracking
- **Directory:** `/attendance`
- **Features:** Check-in/out, regularization, reports
- **Access:** All employees (own data), Managers (team data)
- **API Routes:** `/api/attendance/*`

### Leave Management
- **Directory:** `/leave`
- **Features:** Apply leave, approvals, calendar, balance tracking
- **Access:** All employees (own), Managers (team approvals)
- **API Routes:** `/api/leave/*`, `/api/holidays/*`

### Payroll Management
- **Directory:** `/payroll`
- **Features:** Salary structures, payslip generation, tax declarations
- **Access:** Employees (own payslips), HR (manage all)
- **API Routes:** `/api/payroll/*`

### Performance Management
- **Directory:** `/performance`
- **Features:** Goals, reviews, feedback, ratings
- **Access:** All employees (own), Managers (team)
- **API Routes:** `/api/performance/*`, `/api/goals/*`

### Recruitment & ATS
- **Directory:** `/recruitment`
- **Features:** Job postings, applications, interviews
- **Access:** HR (manage), Managers (interview)
- **API Routes:** `/api/recruitment/*`

### Project & Client Management
- **Directory:** `/projects`
- **Features:** CRM, project tracking, timesheets, invoices
- **Access:** Managers (create), All (assigned projects)
- **API Routes:** `/api/projects/*`, `/api/clients/*`, `/api/timesheets/*`, `/api/invoices/*`

### Training & Development
- **Directory:** `/training`
- **Features:** Course catalog, enrollments, certifications
- **Access:** HR (create), All (enroll)
- **API Routes:** `/api/training/*`

### Asset Management
- **Directory:** `/assets`
- **Features:** Asset tracking, allocation, lifecycle
- **Access:** Admin (manage), Employees (view own)
- **API Routes:** `/api/assets/*`

### Expense Management
- **Directory:** `/expenses`
- **Features:** Expense claims, approvals, reimbursement
- **Access:** All (submit), Managers (approve)
- **API Routes:** `/api/expenses/*`

### Announcements
- **Directory:** `/announcements`
- **Features:** Company-wide and targeted announcements
- **Access:** HR/Admin (create), All (view)
- **API Routes:** `/api/announcements/*`

### Analytics & Reporting
- **Directory:** `/analytics`
- **Features:** Dashboards, reports, insights
- **Access:** All (basic), HR/Admin (detailed)
- **API Routes:** `/api/analytics/*`

---

## 🔌 API Documentation

### Authentication

All API routes (except `/api/auth/*`) require authentication via NextAuth session.

**Get Session:**
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
```

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Pagination

List endpoints support pagination:

```
GET /api/employees?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

**Response:**
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

### Filtering

Most list endpoints support filtering:

```
GET /api/employees?department=engineering&status=ACTIVE&search=john
```

### Key API Endpoints

See `API_DOCUMENTATION.md` for complete API reference.

**Core Endpoints:**

- `POST /api/auth/register` - Register new user
- `GET /api/employees` - List employees
- `POST /api/attendance/checkin` - Clock in
- `POST /api/leave` - Apply for leave
- `GET /api/payroll/payslip` - Get payslips
- `POST /api/projects` - Create project
- `GET /api/analytics/dashboard` - Get dashboard stats

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push code to GitHub**

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**

- Go to [vercel.com](https://vercel.com)
- Click "Import Project"
- Select your GitHub repository
- Configure environment variables
- Deploy!

3. **Configure Database**

- Use Vercel Postgres or external PostgreSQL (Railway, Supabase, Neon)
- Update `DATABASE_URL` in Vercel environment variables
- Run migrations from Vercel CLI or your database provider

### Railway

1. **Create new project**
2. **Add PostgreSQL service**
3. **Deploy Next.js app**
4. **Set environment variables**
5. **Run migrations**

```bash
railway run npm run prisma:migrate
```

### Docker (Self-hosted)

See `DOCKER_DEPLOYMENT.md` for containerized deployment.

---

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing (bcrypt with 10 rounds)
- ✅ Session management
- ✅ CSRF protection
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection
- ✅ Audit logging for critical operations
- ✅ Data encryption ready
- ✅ Environment variable protection

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (when implemented)
npm run test:e2e
```

---

## 📱 Mobile Support

The application is fully responsive and includes:
- Mobile-first design with Tailwind CSS
- Touch-optimized interfaces
- PWA capabilities (add to home screen)
- Offline-ready structure
- Swipe gestures support
- Bottom navigation for mobile

---

## 🌍 Internationalization

Currently supports:
- English (default)
- Indian number/currency formats (₹)
- Indian date formats (DD/MM/YYYY)
- Indian holidays and working days

Ready for i18n expansion.

---

## 🤝 Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Priacc Innovations Private Limited** - For the opportunity to build this platform
- **Next.js Team** - For the amazing framework
- **Prisma Team** - For the excellent ORM
- **Shadcn** - For the beautiful UI components
- **Vercel** - For the hosting platform

---

## 📞 Support

For support, email [support@priacc.com](mailto:support@priacc.com) or create an issue in the repository.

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] AI-powered resume screening
- [ ] Chatbot for employee queries
- [ ] Advanced analytics with ML
- [ ] Third-party integrations (Slack, Zoom, Google Workspace)
- [ ] Biometric device integration
- [ ] Video interviewing
- [ ] Learning management system (LMS)
- [ ] Performance analytics AI

---

<div align="center">

**Built with ❤️ for Priacc Innovations Private Limited**

**Hyderabad, India** • **2024-2025**

[Website](https://priacc.com) • [LinkedIn](https://linkedin.com/company/priacc-innovations)

</div>
