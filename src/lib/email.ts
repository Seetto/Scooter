import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendConfirmationEmail(email: string, name: string | null) {
  try {
    // If SMTP is not configured, log and return (for development)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('Email not sent - SMTP not configured. Would send to:', email)
      return { success: true, message: 'Email would be sent (SMTP not configured)' }
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to Scooter - Account Confirmation',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Scooter!</h1>
              </div>
              <div class="content">
                <p>Hi ${name || 'there'},</p>
                <p>Thank you for signing up for Scooter! Your account has been successfully created.</p>
                <p>You can now start using our service to find scooters near you.</p>
                <p>If you have any questions, feel free to reach out to our support team.</p>
                <p>Happy riding!</p>
                <p>Best regards,<br>The Scooter Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Welcome to Scooter!
        
        Hi ${name || 'there'},
        
        Thank you for signing up for Scooter! Your account has been successfully created.
        
        You can now start using our service to find scooters near you.
        
        If you have any questions, feel free to reach out to our support team.
        
        Happy riding!
        
        Best regards,
        The Scooter Team
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendBookingReceivedEmail(
  userEmail: string,
  userName: string | null,
  storeName: string,
  scooterName: string,
  startDate: Date,
  endDate: Date,
) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('Email not sent - SMTP not configured. Would send booking received email to:', userEmail)
      return { success: true, message: 'Email would be sent (SMTP not configured)' }
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: userEmail,
      subject: 'Booking Received - Waiting for Store Confirmation',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
              .booking-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .detail-row { margin: 10px 0; }
              .detail-label { font-weight: 600; color: #4b5563; }
              .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Booking Received!</h1>
              </div>
              <div class="content">
                <p>Hi ${userName || 'there'},</p>
                <p>Thank you for your booking request! We've received your booking and it's now waiting for confirmation from the store.</p>
                
                <div class="booking-details">
                  <h3 style="margin-top: 0;">Booking Details:</h3>
                  <div class="detail-row">
                    <span class="detail-label">Store:</span> ${storeName}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Scooter:</span> ${scooterName}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Start Date:</span> ${startDate.toLocaleDateString()}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">End Date:</span> ${endDate.toLocaleDateString()}
                  </div>
                </div>

                <p>The store will review your booking and confirm it shortly. You'll receive another email once your booking is confirmed.</p>
                <p>You can view your booking status in the app under "My Bookings".</p>
                
                <p>Best regards,<br>The Scoot2U Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Booking Received!
        
        Hi ${userName || 'there'},
        
        Thank you for your booking request! We've received your booking and it's now waiting for confirmation from the store.
        
        Booking Details:
        - Store: ${storeName}
        - Scooter: ${scooterName}
        - Start Date: ${startDate.toLocaleDateString()}
        - End Date: ${endDate.toLocaleDateString()}
        
        The store will review your booking and confirm it shortly. You'll receive another email once your booking is confirmed.
        
        You can view your booking status in the app under "My Bookings".
        
        Best regards,
        The Scoot2U Team
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending booking received email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendNewBookingNotificationEmail(
  storeEmail: string,
  storeName: string,
  userName: string | null,
  userEmail: string,
  scooterName: string,
  startDate: Date,
  endDate: Date,
) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('Email not sent - SMTP not configured. Would send new booking notification to:', storeEmail)
      return { success: true, message: 'Email would be sent (SMTP not configured)' }
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: storeEmail,
      subject: 'New Booking Request - Action Required',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
              .booking-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .detail-row { margin: 10px 0; }
              .detail-label { font-weight: 600; color: #4b5563; }
              .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .urgent { background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Booking Request</h1>
              </div>
              <div class="content">
                <p>Hi ${storeName},</p>
                <div class="urgent">
                  <p style="margin: 0; font-weight: 600;">You have a new booking request waiting for your confirmation!</p>
                </div>
                
                <div class="booking-details">
                  <h3 style="margin-top: 0;">Booking Details:</h3>
                  <div class="detail-row">
                    <span class="detail-label">Customer:</span> ${userName || userEmail}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Customer Email:</span> ${userEmail}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Scooter:</span> ${scooterName}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Start Date:</span> ${startDate.toLocaleDateString()}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">End Date:</span> ${endDate.toLocaleDateString()}
                  </div>
                </div>

                <p>Please log in to your store account to review and confirm this booking.</p>
                <p>You can view and manage all your bookings in the app under "My Bookings".</p>
                
                <p>Best regards,<br>The Scoot2U Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        New Booking Request
        
        Hi ${storeName},
        
        You have a new booking request waiting for your confirmation!
        
        Booking Details:
        - Customer: ${userName || userEmail}
        - Customer Email: ${userEmail}
        - Scooter: ${scooterName}
        - Start Date: ${startDate.toLocaleDateString()}
        - End Date: ${endDate.toLocaleDateString()}
        
        Please log in to your store account to review and confirm this booking.
        
        You can view and manage all your bookings in the app under "My Bookings".
        
        Best regards,
        The Scoot2U Team
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending new booking notification email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function sendBookingConfirmedEmail(
  userEmail: string,
  userName: string | null,
  storeName: string,
  scooterName: string,
  startDate: Date,
  endDate: Date,
) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('Email not sent - SMTP not configured. Would send booking confirmed email to:', userEmail)
      return { success: true, message: 'Email would be sent (SMTP not configured)' }
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: userEmail,
      subject: 'Booking Confirmed! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
              .booking-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .detail-row { margin: 10px 0; }
              .detail-label { font-weight: 600; color: #4b5563; }
              .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .success-banner { background-color: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Booking Confirmed!</h1>
              </div>
              <div class="content">
                <p>Hi ${userName || 'there'},</p>
                <div class="success-banner">
                  <p style="margin: 0; font-weight: 600; color: #065f46;">Great news! Your booking has been confirmed by the store.</p>
                </div>
                
                <div class="booking-details">
                  <h3 style="margin-top: 0;">Confirmed Booking Details:</h3>
                  <div class="detail-row">
                    <span class="detail-label">Store:</span> ${storeName}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Scooter:</span> ${scooterName}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Start Date:</span> ${startDate.toLocaleDateString()}
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">End Date:</span> ${endDate.toLocaleDateString()}
                  </div>
                </div>

                <p>Your booking is now confirmed and ready! You can view all your bookings in the app under "My Bookings".</p>
                <p>We look forward to serving you!</p>
                
                <p>Best regards,<br>The Scoot2U Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Booking Confirmed! 🎉
        
        Hi ${userName || 'there'},
        
        Great news! Your booking has been confirmed by the store.
        
        Confirmed Booking Details:
        - Store: ${storeName}
        - Scooter: ${scooterName}
        - Start Date: ${startDate.toLocaleDateString()}
        - End Date: ${endDate.toLocaleDateString()}
        
        Your booking is now confirmed and ready! You can view all your bookings in the app under "My Bookings".
        
        We look forward to serving you!
        
        Best regards,
        The Scoot2U Team
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending booking confirmed email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
