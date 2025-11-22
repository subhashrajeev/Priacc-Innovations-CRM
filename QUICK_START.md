# Quick Start - Database Seeding

## TL;DR - Get Started in 3 Steps

```bash
# 1. Setup database connection
cp prisma/.env.example .env
# Edit .env and update DATABASE_URL

# 2. Run migrations
npm run prisma:migrate

# 3. Seed the database
npm run prisma:seed
```

## Login Credentials

```
Email: rajesh.sharma@priacc.com
Password: Password@123
Role: Super Admin
```

## What You Get

- **20 Employees** with complete profiles
- **600+ Attendance** records (last 30 days)
- **100+ Leaves** in various states
- **60+ Payslips** (3 months for all employees)
- **10 Projects** with 50+ tasks
- **20 Job Applications** with interviews
- **8 Training Courses** with enrollments
- **25 Assets** allocated to employees
- **30 Expense Claims**
- **5 Announcements**
- **100+ Notifications**

**Total: 1200+ Records** with realistic relationships

## Organizational Structure

```
CEO (Rajesh)
  ├─ Directors (2)
  ├─ HR Team (2)
  ├─ Engineering (6)
  ├─ Sales (4)
  ├─ Marketing (4)
  └─ Operations (1)
```

## All Test Users

| Name | Email | Role | Dept | Password |
|------|-------|------|------|----------|
| Rajesh Sharma | rajesh.sharma@priacc.com | Super Admin | Operations | Password@123 |
| Priya Patel | priya.patel@priacc.com | Admin | Operations | Password@123 |
| Neha Gupta | neha.gupta@priacc.com | HR Manager | HR | Password@123 |
| Vikram Singh | vikram.singh@priacc.com | Manager | Engineering | Password@123 |
| Arjun Verma | arjun.verma@priacc.com | Team Lead | Engineering | Password@123 |
| Rohan Joshi | rohan.joshi@priacc.com | Employee | Engineering | Password@123 |

**All users**: Same password `Password@123`

## View Your Data

```bash
npm run prisma:studio
```

Opens visual database browser at **http://localhost:5555**

## Reset & Reseed

```bash
npx prisma migrate reset
# This will drop DB, run migrations, and seed automatically
```

## Features

✅ Idempotent seeding (run multiple times safely)
✅ Hierarchical organization structure
✅ Realistic Indian names and data
✅ Past, current, and future dated records
✅ All relationships properly linked
✅ Mix of statuses (pending, approved, rejected, etc.)
✅ Complete salary structures with CTC ranges
✅ Real-world business scenarios

## Package.json Scripts

```json
{
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "tsx prisma/seed.ts",
  "prisma:studio": "prisma studio"
}
```

## Troubleshooting

**Database connection error?**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env

**Table doesn't exist?**
- Run: `npm run prisma:migrate`

**Seed fails?**
- Reset DB: `npx prisma migrate reset`
- Run seed: `npm run prisma:seed`

---

For detailed documentation, see **SEEDING_INSTRUCTIONS.md**
