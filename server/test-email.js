import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load email configuration
const emailConfigPath = path.join(__dirname, 'config', 'email.json');
const emailConfig = JSON.parse(fs.readFileSync(emailConfigPath, 'utf8'));

async function testEmailDelivery() {
  console.log('🔧 Testing email delivery to samil000828@gmail.com');
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: {
      user: emailConfig.smtp.auth.user,
      pass: emailConfig.smtp.auth.pass
    }
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return;
  }

  // Send test email
  const mailOptions = {
    from: emailConfig.fromEmail,
    to: 'samil000828@gmail.com',
    subject: 'Test Email - Direct Send',
    text: 'This is a test email sent directly using nodemailer.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Test Email</h2>
        <p>This is a test email sent directly using nodemailer to diagnose delivery issues.</p>
        <p>Time sent: ${new Date().toISOString()}</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', info);
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
  }
}

testEmailDelivery();