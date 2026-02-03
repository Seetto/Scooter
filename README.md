# Scooter

A Next.js application ready for development.

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables Setup

### Google Maps API Key

To use the "Find Scooter" feature, you'll need to set up a Google Maps API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Maps JavaScript API"
4. Create credentials (API Key)
5. Add to your `.env.local` file:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

**Note:** Make sure to restrict your API key in the Google Cloud Console for production use.

### Email Configuration

To enable email notifications (booking confirmations, signup confirmations, etc.), configure SMTP settings in your `.env.local` file:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

**For Gmail:**
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Generate an app password for "Mail"
5. Use this app password (not your regular password) for `SMTP_PASSWORD`

**Alternative: Mailtrap (for testing):**
For testing emails without sending real emails, you can use [Mailtrap](https://mailtrap.io/):
```
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM=noreply@scoot2u.com
```

**Testing Email Setup:**
1. Log in as admin
2. Use the test email endpoint (or create a test booking)
3. Check your email inbox (or Mailtrap inbox if using Mailtrap)

**Note:** If SMTP is not configured, the app will log email content to the console instead of sending (useful for development).

### Admin Authentication

Admin credentials are stored securely in environment variables and are **never hardcoded** in the source code. Set the following in your `.env.local` file:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password-here
```

**Security Notes:**
- Admin credentials are required in production (the app will throw an error if not set)
- In development, you should still set these in `.env.local` for security
- Never commit `.env.local` to version control
- Use a strong, unique password for `ADMIN_PASSWORD` in production

**Admin Access:**
- Admins can log in through the main login page using the admin username and password
- Once logged in, admins will see "View Users" and "View Stores" buttons in the top right
- Admin pages at `/admin/users` and `/admin/stores` also require admin credentials

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
