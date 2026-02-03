# Vercel Environment Variables - Complete List

Copy and paste these into your Vercel project settings (Settings → Environment Variables).

## 🔴 REQUIRED - Must Set These

### Database
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```
**How to get:**
- If using **Vercel Postgres**: Go to Storage → Your Database → Copy the connection string
- If using **Supabase**: Settings → Database → Connection string (URI mode)
- If using **Neon**: Dashboard → Connection string

**Note:** If Vercel Postgres gives you `POSTGRES_URL`, you can either:
- Set `DATABASE_URL=$POSTGRES_URL` (if Vercel supports variable expansion)
- Or use `POSTGRES_URL` directly and update Prisma schema to use `POSTGRES_URL`

### NextAuth (Authentication)
```
NEXTAUTH_URL=https://your-app-name.vercel.app
```
**Replace `your-app-name` with your actual Vercel deployment URL**

```
NEXTAUTH_SECRET=your-secret-key-here
```
**Generate with:** `openssl rand -base64 32` (run in terminal) or use [this online generator](https://generate-secret.vercel.app/32)

### Admin Credentials
```
ADMIN_USERNAME=admin
```
**Or whatever username you want for admin login**

```
ADMIN_PASSWORD=your-secure-password-here
```
**Use a strong password - this is your admin login password**

---

## 🟡 OPTIONAL - Set These If You Need The Features

### Google OAuth (For Google Calendar Integration)
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```
**Get from:** [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

### Google Maps API (For Map Features)
```
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```
**Note:** Set both to the same value. The `NEXT_PUBLIC_` version is needed for client-side code.

**Get from:** [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

### Email/SMTP Configuration (For Email Notifications)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

**For Gmail:**
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER` = Your Gmail address
- `SMTP_PASSWORD` = Gmail App Password (not your regular password)
  - Get from: [Google App Passwords](https://myaccount.google.com/apppasswords)
- `SMTP_FROM` = Your Gmail address

**For Mailtrap (Testing):**
```
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM=noreply@scoot2u.com
```

---

## 📋 Quick Copy-Paste Checklist

### Minimum Required (App will work but limited features):
- [ ] `DATABASE_URL`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `ADMIN_USERNAME`
- [ ] `ADMIN_PASSWORD`

### For Full Functionality:
- [ ] `GOOGLE_CLIENT_ID` (if using Google login/calendar)
- [ ] `GOOGLE_CLIENT_SECRET` (if using Google login/calendar)
- [ ] `GOOGLE_MAPS_API_KEY` (if using maps)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (if using maps)
- [ ] `SMTP_HOST` (if sending emails)
- [ ] `SMTP_PORT` (if sending emails)
- [ ] `SMTP_USER` (if sending emails)
- [ ] `SMTP_PASSWORD` (if sending emails)
- [ ] `SMTP_FROM` (if sending emails)
- [ ] `SMTP_SECURE` (if sending emails)

---

## 🔧 How to Add in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter the **Name** (exactly as shown above)
5. Enter the **Value** (your actual value)
6. Select **Environment(s)**: Choose **Production**, **Preview**, and **Development** (or just Production if you only want it there)
7. Click **Save**
8. Repeat for each variable
9. **Redeploy** your application after adding variables

---

## ⚠️ Important Notes

1. **After adding variables, you MUST redeploy** for them to take effect
2. **Never commit these values to GitHub** - they're secrets!
3. **Generate a new `NEXTAUTH_SECRET`** - don't use the example
4. **Use strong passwords** for `ADMIN_PASSWORD`
5. **For Gmail SMTP**, you need an App Password, not your regular password
6. **Database URL** must use SSL in production (`?sslmode=require`)

---

## 🧪 Testing After Setup

1. Deploy with all required variables
2. Try logging in as admin using `ADMIN_USERNAME` and `ADMIN_PASSWORD`
3. Try creating a new user account
4. Check that database operations work (creating bookings, etc.)
