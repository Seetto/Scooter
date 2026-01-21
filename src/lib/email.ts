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
