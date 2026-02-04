# Neon Database Setup Guide for Vercel

## Step 1: Get Your Neon Database Connection String

1. Go to your [Neon Dashboard](https://console.neon.tech/)
2. Select your project (the one connected to Vercel)
3. Click on **"Connection Details"** or go to **"Dashboard"** → **"Connection String"**
4. You'll see a connection string that looks like:
   ```
   postgresql://username:password@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Copy this entire connection string** - you'll need it in the next step

## Step 2: Add Environment Variables to Vercel

Go to your Vercel project dashboard and add these environment variables:

### 🔴 REQUIRED Variables

#### 1. DATABASE_URL
- **Name:** `DATABASE_URL`
- **Value:** Paste the connection string you copied from Neon (the full string starting with `postgresql://`)
- **Environments:** Select **Production**, **Preview**, and **Development**

#### 2. NEXTAUTH_URL
- **Name:** `NEXTAUTH_URL`
- **Value:** `https://your-app-name.vercel.app` (replace with your actual Vercel app URL)
- **Environments:** Select **Production**, **Preview**, and **Development**

#### 3. NEXTAUTH_SECRET
- **Name:** `NEXTAUTH_SECRET`
- **Value:** Generate a secret key using one of these methods:
  - **Option A (Terminal):** Run `openssl rand -base64 32`
  - **Option B (Online):** Use [this generator](https://generate-secret.vercel.app/32)
- **Environments:** Select **Production**, **Preview**, and **Development**

#### 4. ADMIN_USERNAME
- **Name:** `ADMIN_USERNAME`
- **Value:** `admin` (or whatever username you want for admin login)
- **Environments:** Select **Production**, **Preview**, and **Development**

#### 5. ADMIN_PASSWORD
- **Name:** `ADMIN_PASSWORD`
- **Value:** Your secure admin password (use a strong password!)
- **Environments:** Select **Production**, **Preview**, and **Development**

### 🟡 OPTIONAL Variables (Add if you need these features)

#### Email/SMTP (For email notifications)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=your-email@gmail.com
```

#### Google OAuth (For Google Calendar integration)
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Google Maps (For map features)
```
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## Step 3: Run Database Migrations

After adding the `DATABASE_URL` environment variable, you need to create the database tables. You have two options:

### Option A: Run Migrations Locally (Recommended for first-time setup)

1. **Set up your local `.env.local` file:**
   ```bash
   DATABASE_URL=your-neon-connection-string-here
   ```
   (Use the same connection string from Neon)

2. **Run the migrations:**
   ```bash
   npx prisma migrate deploy
   ```
   
   This will create all the necessary tables in your Neon database:
   - `User` - Stores user accounts
   - `Store` - Stores store information
   - `Scooter` - Stores scooter listings
   - `Booking` - Stores booking records

### Option B: Run Migrations via Vercel Build (Automatic)

Your `package.json` already includes `prisma generate` in the build script, which will generate the Prisma client. However, to automatically run migrations on each deployment, you can add a post-deploy script.

**Note:** Vercel runs `prisma generate` automatically during build, but you'll need to run `prisma migrate deploy` manually the first time (use Option A above).

## Step 4: Verify Database Setup

### Check Tables Were Created

1. Go to your Neon Dashboard
2. Click on **"SQL Editor"** or **"Query"**
3. Run this query to see all tables:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
4. You should see:
   - `User`
   - `Store`
   - `Scooter`
   - `Booking`
   - `_prisma_migrations`

### Test Your Application

1. **Redeploy your Vercel app** (after adding all environment variables)
2. Try logging in as admin using your `ADMIN_USERNAME` and `ADMIN_PASSWORD`
3. Try creating a new user account
4. Try creating a booking

## Step 5: Create Your First Admin User (If Needed)

If you need to create an admin user manually in the database:

1. Go to Neon Dashboard → SQL Editor
2. Run this query (replace with your actual values):
   ```sql
   -- First, hash your password using bcrypt
   -- You can use an online bcrypt generator or run this in Node.js:
   -- const bcrypt = require('bcryptjs');
   -- bcrypt.hashSync('your-password', 10);
   
   -- Then insert the admin user:
   INSERT INTO "User" (id, email, password, "createdAt", "updatedAt")
   VALUES (
     'admin-user-id-here',
     'admin@example.com',
     '$2a$10$hashed-password-here', -- Replace with bcrypt hash
     NOW(),
     NOW()
   );
   ```

**However**, it's easier to use your app's signup flow or admin login with the `ADMIN_USERNAME` and `ADMIN_PASSWORD` you set in environment variables.

## Quick Checklist

- [ ] Got connection string from Neon Dashboard
- [ ] Added `DATABASE_URL` to Vercel environment variables
- [ ] Added `NEXTAUTH_URL` to Vercel (your app URL)
- [ ] Generated and added `NEXTAUTH_SECRET` to Vercel
- [ ] Added `ADMIN_USERNAME` to Vercel
- [ ] Added `ADMIN_PASSWORD` to Vercel
- [ ] Ran `npx prisma migrate deploy` locally (or via Neon SQL Editor)
- [ ] Verified tables were created in Neon
- [ ] Redeployed Vercel app
- [ ] Tested admin login
- [ ] Tested user signup

## Troubleshooting

### "Can't reach database server"
- Check that your `DATABASE_URL` includes `?sslmode=require` at the end
- Verify the connection string is correct in Neon Dashboard

### "Table does not exist"
- Run `npx prisma migrate deploy` to create the tables
- Check that migrations ran successfully

### "Authentication failed"
- Verify your `ADMIN_USERNAME` and `ADMIN_PASSWORD` match what you set in Vercel
- Check that `NEXTAUTH_SECRET` is set correctly

### "Prisma Client not generated"
- Vercel should run `prisma generate` automatically during build
- Check your build logs in Vercel to see if there are any errors

## Database Schema Overview

Your database will store:

- **Users**: Customer accounts with email, password, phone, address, etc.
- **Stores**: Store accounts that rent out scooters
- **Scooters**: Individual scooter listings belonging to stores
- **Bookings**: Rental bookings connecting users, stores, and scooters

All relationships are properly set up with foreign keys and cascade deletes.
