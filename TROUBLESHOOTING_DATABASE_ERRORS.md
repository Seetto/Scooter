# Troubleshooting Database Errors - User Signup

## Error: "Database error. Please check the server logs."

If you're getting this error when trying to sign up a user, follow these steps:

## Step 1: Check Vercel Server Logs

1. Go to your Vercel project dashboard
2. Click on **"Deployments"**
3. Click on your latest deployment
4. Click on **"Functions"** tab
5. Look for any function logs, especially `/api/auth/signup`
6. Check for specific error messages

Common error messages you might see:
- `relation "User" does not exist` → **Migrations not run**
- `Can't reach database server` → **Connection string issue**
- `Connection timeout` → **Connection pooling issue**

## Step 2: Verify Database Migrations Were Run

The most common issue is that database tables don't exist yet.

### Check if tables exist in Neon:

1. Go to [Neon Dashboard](https://console.neon.tech/)
2. Select your project
3. Click on **"SQL Editor"**
4. Run this query:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

**Expected tables:**
- `User`
- `Store`
- `Scooter`
- `Booking`
- `_prisma_migrations`

### If tables are missing, run migrations:

**Option A: Run locally (Recommended)**
```bash
# Make sure your .env.local has DATABASE_URL from Neon
DATABASE_URL=your-neon-connection-string

# Run migrations
npx prisma migrate deploy
```

**Option B: Run via Neon SQL Editor**
1. Go to Neon Dashboard → SQL Editor
2. Copy the contents of each migration file from `prisma/migrations/`
3. Run them in order (oldest to newest)

## Step 3: Verify DATABASE_URL Environment Variable

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Check that `DATABASE_URL` is set
3. Verify it includes `?sslmode=require` at the end
4. The format should be:
   ```
   postgresql://username:password@host:port/database?sslmode=require
   ```

### Test the connection string:

You can test if your connection string works by running this locally:
```bash
# In your project directory
npx prisma db pull
```

If this fails, your connection string is incorrect.

## Step 4: Check for Connection Pooling Issues

Neon requires connection pooling for serverless environments like Vercel. Your connection string should use a **pooler endpoint**.

### How to get the pooler connection string from Neon:

1. Go to Neon Dashboard → Your Project
2. Look for **"Connection Details"** or **"Connection String"**
3. Make sure you're using the **"Pooled connection"** or **"Transaction pooler"** option
4. The connection string should look like:
   ```
   postgresql://username:password@ep-xxxx-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   (Notice the `-pooler` in the hostname)

### If you're using a direct connection:

Direct connections (without `-pooler`) can cause timeout issues in serverless environments. Switch to the pooled connection string.

## Step 5: Regenerate Prisma Client

Sometimes the Prisma client is out of sync. Regenerate it:

```bash
npx prisma generate
```

Then commit and push:
```bash
git add .
git commit -m "Regenerate Prisma client"
git push
```

Vercel will automatically regenerate during build, but you can also do it locally.

## Step 6: Check Prisma Schema Matches Database

Verify your `prisma/schema.prisma` has:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**NOT** `provider = "sqlite"`

## Step 7: Test Database Connection Manually

Create a test API route to verify the connection:

**File: `src/app/api/test-db/route.ts`**
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test connection
    await prisma.$connect()
    
    // Test query
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
```

Then visit: `https://your-app.vercel.app/api/test-db`

This will tell you if the database connection works.

## Step 8: Check Vercel Build Logs

1. Go to Vercel → Your Project → Deployments
2. Click on a deployment
3. Check the **"Build Logs"** tab
4. Look for:
   - `prisma generate` running successfully
   - Any Prisma-related errors
   - Database connection errors

## Common Error Messages and Solutions

### "relation 'User' does not exist"
**Solution:** Run `npx prisma migrate deploy` to create tables

### "Can't reach database server"
**Solution:** 
- Check DATABASE_URL is set correctly in Vercel
- Verify connection string includes `?sslmode=require`
- Use pooled connection string (with `-pooler` in hostname)

### "Connection timeout"
**Solution:** 
- Use Neon's pooled connection string
- Check Neon dashboard for any service issues
- Verify your Neon project is active

### "Prisma Client has not been generated"
**Solution:** 
- Run `npx prisma generate` locally
- Check that `package.json` has `"postinstall": "prisma generate"`

### "Invalid `prisma.user.create()` invocation"
**Solution:** 
- Regenerate Prisma client: `npx prisma generate`
- Verify schema matches database structure

## Quick Fix Checklist

- [ ] Checked Vercel server logs for specific error
- [ ] Verified `DATABASE_URL` is set in Vercel environment variables
- [ ] Confirmed connection string uses pooled endpoint (`-pooler`)
- [ ] Verified connection string includes `?sslmode=require`
- [ ] Checked that database tables exist in Neon
- [ ] Ran `npx prisma migrate deploy` if tables are missing
- [ ] Regenerated Prisma client: `npx prisma generate`
- [ ] Verified `prisma/schema.prisma` uses `provider = "postgresql"`
- [ ] Tested database connection with `/api/test-db` route
- [ ] Redeployed Vercel app after making changes

## Still Having Issues?

If you've tried all the above:

1. **Share the exact error message** from Vercel logs
2. **Verify your Neon project is active** (not paused)
3. **Check Neon dashboard** for any service alerts
4. **Try creating a test user directly in Neon SQL Editor:**
   ```sql
   INSERT INTO "User" (id, email, password, "createdAt", "updatedAt")
   VALUES (
     'test-' || gen_random_uuid()::text,
     'test@example.com',
     '$2a$10$hashedpasswordhere', -- Use bcrypt hash
     NOW(),
     NOW()
   );
   ```

If this works, the issue is with the Prisma client or API route, not the database itself.
