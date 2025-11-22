# Deployment Guide - Priacc CRM/HRMS

This guide covers deploying the Priacc CRM/HRMS application to various platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Vercel Deployment (Recommended)](#vercel-deployment)
- [Railway Deployment](#railway-deployment)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Post-Deployment Steps](#post-deployment-steps)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account with your code pushed
- ✅ PostgreSQL database (or provider account)
- ✅ Domain name (optional)
- ✅ Email service account (SendGrid/Resend)
- ✅ Cloud storage account (AWS S3/Cloudinary) - optional

---

## Vercel Deployment

### Step 1: Prepare Your Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** .next

### Step 3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key

# Email
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@priacc.com

# Optional: Cloud Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Company Info
COMPANY_NAME=Priacc Innovations Private Limited
COMPANY_ADDRESS=Hi-Tech City, Hyderabad, India
COMPANY_EMAIL=info@priacc.com
```

### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

### Step 5: Run Database Migrations

After deployment, run migrations using Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Run migrations
vercel env pull .env.production
npm run prisma:generate
npm run prisma:migrate
```

Or use your database provider's migration tools (Railway, Supabase, etc.)

---

## Railway Deployment

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository

### Step 3: Add PostgreSQL

1. In your project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Wait for provisioning
4. Copy the `DATABASE_URL` from the PostgreSQL service

### Step 4: Configure Variables

1. Go to your app service
2. Click "Variables" tab
3. Add all environment variables (see list above)
4. Use the `DATABASE_URL` from your PostgreSQL service

### Step 5: Deploy

1. Click "Deploy"
2. Railway will automatically build and deploy

### Step 6: Run Migrations

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run npm run prisma:migrate
```

---

## Docker Deployment

### Create Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run prisma:generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: priacc_crm_hrms
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/priacc_crm_hrms
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: your-secret-key-here
    depends_on:
      - db
    volumes:
      - ./public/uploads:/app/public/uploads

volumes:
  postgres_data:
```

### Deploy with Docker

```bash
# Build and run
docker-compose up -d

# Run migrations
docker-compose exec app npm run prisma:migrate

# Seed database (optional)
docker-compose exec app npm run prisma:seed

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | Application URL | `https://your-domain.com` |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Generate with `openssl rand -base64 32` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_SERVER_HOST` | SMTP host | - |
| `EMAIL_SERVER_PORT` | SMTP port | 587 |
| `EMAIL_SERVER_USER` | SMTP username | - |
| `EMAIL_SERVER_PASSWORD` | SMTP password | - |
| `EMAIL_FROM` | From email address | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - |
| `COMPANY_NAME` | Company name | Priacc Innovations |
| `NODE_ENV` | Environment | production |

---

## Database Setup

### Option 1: Vercel Postgres

1. In Vercel Dashboard, go to Storage
2. Create PostgreSQL database
3. Copy connection string
4. Update `DATABASE_URL` in environment variables

### Option 2: Railway PostgreSQL

1. In Railway project, click "New"
2. Add PostgreSQL
3. Copy connection string from PostgreSQL service
4. Use in your app's environment variables

### Option 3: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Use pooler connection string for serverless

### Option 4: Neon

1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Supports serverless and branching

### Running Migrations

After setting up database, run migrations:

```bash
# Using Vercel CLI
vercel env pull
npx prisma migrate deploy

# Using Railway CLI
railway run npx prisma migrate deploy

# Using direct connection
DATABASE_URL="your-connection-string" npx prisma migrate deploy
```

---

## Post-Deployment Steps

### 1. Verify Deployment

- Visit your deployed URL
- Check login page loads
- Verify database connection

### 2. Create Admin User

If not using seeders, create admin user manually:

```bash
# Connect to production database
npm run prisma:studio

# Or use database GUI (TablePlus, pgAdmin, etc.)
```

Create user with:
- Email: admin@priacc.com
- Password: (hashed with bcrypt)
- Role: SUPER_ADMIN

### 3. Configure Email

Test email sending:
- Forgot password flow
- Payslip generation
- Notifications

### 4. Set Up File Storage

If using cloud storage:
- Configure Cloudinary/S3
- Update upload components
- Test file uploads

### 5. Custom Domain (Optional)

**Vercel:**
1. Go to Settings → Domains
2. Add your domain
3. Configure DNS records as instructed

**Railway:**
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS

### 6. SSL Certificate

Both Vercel and Railway provide automatic SSL certificates.

For self-hosted:
- Use Let's Encrypt (certbot)
- Configure reverse proxy (nginx)

### 7. Monitoring

Set up monitoring:
- Vercel Analytics (built-in)
- Sentry for error tracking
- Uptime monitoring (UptimeRobot)

---

## Performance Optimization

### 1. Database Indexes

Ensure indexes are created for frequently queried fields (already in schema).

### 2. Image Optimization

Next.js automatically optimizes images. For external storage:
- Use Cloudinary transformations
- Enable S3 CDN

### 3. Caching

Consider adding:
- Redis for session storage
- API route caching
- Static page generation where possible

### 4. CDN

Use Vercel's built-in CDN or configure Cloudflare.

---

## Backup Strategy

### Database Backups

**Automated (Recommended):**
- Vercel Postgres: Automatic backups
- Railway: Automatic backups (Pro plan)
- Supabase: Point-in-time recovery

**Manual:**
```bash
# Export database
pg_dump -h host -U user -d dbname > backup.sql

# Restore
psql -h host -U user -d dbname < backup.sql
```

### File Backups

If using local storage, back up `/public/uploads` directory regularly.

For cloud storage (S3/Cloudinary), backups are handled by provider.

---

## Rollback Procedure

### Application Rollback

**Vercel:**
1. Go to Deployments
2. Find previous working deployment
3. Click "⋯" → "Promote to Production"

**Railway:**
1. Go to Deployments
2. Select previous deployment
3. Click "Redeploy"

### Database Rollback

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Or restore from backup
psql -h host -U user -d dbname < backup.sql
```

---

## Troubleshooting

### Build Fails

1. Check build logs for errors
2. Verify all dependencies are in package.json
3. Ensure TypeScript has no errors
4. Check environment variables

### Database Connection Issues

1. Verify DATABASE_URL is correct
2. Check if database is accessible from deployment platform
3. Ensure SSL mode is correct (add `?sslmode=require` if needed)
4. Check firewall rules

### Runtime Errors

1. Check application logs
2. Verify environment variables
3. Check database migrations are up to date
4. Review recent changes

### Performance Issues

1. Check database query performance
2. Add database indexes if needed
3. Enable caching
4. Optimize images
5. Use CDN

---

## Security Checklist

- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] Environment variables are not exposed in client
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection enabled
- [ ] Regular dependency updates
- [ ] Backup strategy in place

---

## Support

For deployment issues:
- Check documentation
- Review logs carefully
- Search issues in GitHub repository
- Contact support@priacc.com

---

**Last Updated:** November 2024
