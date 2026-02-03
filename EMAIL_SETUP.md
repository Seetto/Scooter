# Email Setup Guide

This guide will help you set up email notifications for the Scoot2U application.

## Quick Setup Options

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Step Verification:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password:**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password

3. **Add to `.env.local`:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM=your-email@gmail.com
   ```

### Option 2: Mailtrap (Best for Development/Testing)

Mailtrap is a fake SMTP server that captures all emails for testing without sending real emails.

1. **Sign up for Mailtrap:**
   - Go to [https://mailtrap.io/](https://mailtrap.io/)
   - Create a free account
   - Go to "Inboxes" → "SMTP Settings"
   - Select "Node.js - Nodemailer"

2. **Add to `.env.local`:**
   ```env
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=your-mailtrap-username
   SMTP_PASSWORD=your-mailtrap-password
   SMTP_FROM=noreply@scoot2u.com
   ```

3. **View Test Emails:**
   - All emails will appear in your Mailtrap inbox
   - No real emails will be sent

### Option 3: Other SMTP Providers

You can use any SMTP provider. Common options:

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@scoot2u.com
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=noreply@scoot2u.com
```

## Testing Email Setup

### Method 1: Test Email Endpoint (Admin Only)

1. Log in as admin
2. Open browser console or use a tool like Postman
3. Send a POST request to `/api/test-email`:

```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'your-test-email@example.com',
    testType: 'booking-received' // or 'new-booking' or 'booking-confirmed'
  })
})
```

### Method 2: Create a Test Booking

1. Create a test user account
2. Create a test store account (and get it approved by admin)
3. Add a scooter to the store
4. Log in as the test user
5. Create a booking
6. Check your email (or Mailtrap inbox)

### Method 3: Check Server Logs

If SMTP is not configured, the app will log email content to the console:
```
Email not sent - SMTP not configured. Would send to: user@example.com
```

## Email Types

The application sends the following emails:

1. **Signup Confirmation** - Sent when a user signs up
2. **Booking Received** - Sent to user when booking is created
3. **New Booking Notification** - Sent to store when booking is created
4. **Booking Confirmed** - Sent to user when store confirms booking

## Troubleshooting

### Emails not sending?

1. **Check `.env.local` exists** and has all SMTP variables
2. **Restart the dev server** after changing `.env.local`
3. **Check server logs** for error messages
4. **Verify SMTP credentials** are correct
5. **Check spam folder** if using real email

### Gmail Issues?

- Make sure you're using an **App Password**, not your regular password
- App passwords are 16 characters with spaces (spaces are optional)
- 2-Step Verification must be enabled

### Mailtrap Issues?

- Check your inbox name matches the username
- Verify the port is 2525 (not 587)
- Make sure you're using the SMTP credentials, not API credentials

## Production Setup

For production, use a reliable email service:
- **SendGrid** (recommended)
- **Mailgun**
- **Amazon SES**
- **Postmark**

Make sure to:
- Set up proper SPF/DKIM records
- Use a verified sender domain
- Monitor email delivery rates
- Set up bounce handling
