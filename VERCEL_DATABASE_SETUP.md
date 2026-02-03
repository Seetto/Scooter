# Vercel Database Setup Guide

## Problem
Your app is currently using SQLite, which **does not work on Vercel**. SQLite is a file-based database, and Vercel's serverless functions have an ephemeral filesystem that doesn't persist data.

## Solution: Migrate to PostgreSQL

You have several options for PostgreSQL on Vercel:

### Option 1: Vercel Postgres (Recommended - Easiest)
1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Create a new Postgres database
4. Vercel will automatically add the `POSTGRES_URL` environment variable

### Option 2: Supabase (Free tier available)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your connection string from Settings → Database
4. Add to Vercel as `DATABASE_URL`

### Option 3: Neon (Free tier available)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Get your connection string
4. Add to Vercel as `DATABASE_URL`

## Migration Steps

### 1. Update Prisma Schema

Change `prisma/schema.prisma` from:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

To:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Update Environment Variables in Vercel

Add these to your Vercel project settings (Settings → Environment Variables):

**Required:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_URL` - Your Vercel deployment URL
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `ADMIN_USERNAME` - Your admin username
- `ADMIN_PASSWORD` - Your admin password

**Optional (for email):**
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

**Optional (for Google OAuth):**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Optional (for Google Maps):**
- `GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 3. Run Migrations

After updating the schema and setting up the database:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

Or in Vercel, add a build command that runs migrations:
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "next build && prisma migrate deploy"
  }
}
```

### 4. Seed Initial Data (Optional)

You may want to create an initial admin user. You can do this via:
- Vercel's database dashboard
- A migration script
- Or manually through your app's signup flow

## Important Notes

1. **Local Development**: You'll need to set up a local PostgreSQL database or use a cloud database for development too
2. **Data Migration**: If you have existing data in SQLite, you'll need to export and import it
3. **Connection Pooling**: For serverless, consider using a connection pooler like PgBouncer

## Quick Start with Vercel Postgres

1. In Vercel dashboard → Your Project → Storage → Create Database → Postgres
2. Vercel automatically adds `POSTGRES_URL` - you may need to also set `DATABASE_URL=$POSTGRES_URL`
3. Update Prisma schema to use `postgresql`
4. Commit and push the schema change
5. Vercel will run migrations automatically if configured
