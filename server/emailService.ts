import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private transporter: any;
  private fromEmail: string;

  constructor(config: EmailConfig, fromEmail: string) {
    this.fromEmail = fromEmail;
    // Add connection pooling and better error handling
    this.transporter = nodemailer.createTransport({
      ...config,
      pool: true, // Enable connection pooling
      maxConnections: 5, // Maximum concurrent connections
      maxMessages: 100, // Maximum messages per connection
      rateDelta: 1000, // Rate limiting: 1 second between messages
      rateLimit: 5, // Rate limiting: max 5 messages per rateDelta
    });
    
    // Verify connection on startup
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');
      console.log('📧 SMTP server details verified for:', this.fromEmail);
    } catch (error) {
      console.error('❌ SMTP connection verification failed:', error);
      console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    }
  }

  private async ensureConnection(): Promise<void> {
    // Create a fresh transporter for each email send to avoid stale connections
    // This fixes the issue where emails don't send after the first one
    console.log('🔄 Creating fresh SMTP connection...');
    
    // Get the original config from environment/file
    const emailConfig = loadEmailConfig();
    const config = {
      host: emailConfig.host,
      port: parseInt(emailConfig.port),
      secure: emailConfig.secure !== null ? emailConfig.secure : parseInt(emailConfig.port) === 465,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    };
    
    this.transporter = nodemailer.createTransport({
      ...config,
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      debug: true,
      logger: true
    });
    await this.transporter.verify();
    console.log('✅ Fresh SMTP connection created and verified');
  }

  async sendEmail(params: EmailParams): Promise<boolean> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Ensure connection is alive before sending
        await this.ensureConnection();
        const mailOptions = {
          from: `"TicTac 3x5 Game" <${this.fromEmail}>`,
          to: params.to,
          subject: params.subject,
          text: params.text,
          html: params.html,
          headers: {
            'X-Mailer': 'TicTac3x5-GameApp',
            'X-Priority': '3',
            'X-MSMail-Priority': 'Normal',
            'Importance': 'Normal',
            'List-Unsubscribe': '<mailto:support@darklayerstudios.com?subject=Unsubscribe>',
            'Reply-To': 'support@darklayerstudios.com',
            'Return-Path': 'support@darklayerstudios.com',
            'X-SES-Configuration-Set': 'DefaultConfigurationSet',
            'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN',
          },
          messageId: `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@darklayerstudios.com>`,
        };

        console.log(`📧 Sending email (attempt ${attempt}/${maxRetries}):`, {
          to: params.to,
          subject: params.subject,
          from: this.fromEmail
        });

        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully to:', params.to);
        console.log('📧 Message info:', {
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected,
          pending: info.pending,
          envelope: info.envelope
        });
        
        // Additional delivery info
        if (info.rejected && info.rejected.length > 0) {
          console.log('⚠️ Some emails were rejected:', info.rejected);
        }
        if (info.pending && info.pending.length > 0) {
          console.log('⏳ Some emails are pending:', info.pending);
        }
        return true;
      } catch (error) {
        lastError = error;
        console.error(`❌ SMTP email error (attempt ${attempt}/${maxRetries}):`, error);
        console.error('❌ Full error details:', JSON.stringify(error, null, 2));
        
        // If it's the last attempt, don't wait
        if (attempt < maxRetries) {
          const delay = attempt * 1000; // Exponential backoff: 1s, 2s, 3s
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('❌ Failed to send email after all retries:', lastError);
    return false;
  }

  async sendVerificationEmail(email: string, verificationCode: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; text-align: center;">Verify Your Email - TicTac 3x5</h2>
        <p>Thanks for signing up for TicTac 3x5! Please use the verification code below to verify your email address.</p>
        
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 2px dashed #1e40af;">
          <h3 style="margin: 0; color: #1e40af;">Your Verification Code:</h3>
          <div style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px; margin: 10px 0;">
            ${verificationCode}
          </div>
          <p style="margin: 0; color: #666; font-size: 14px;">Enter this code on the verification page</p>
        </div>
        
        <p style="text-align: center; margin: 20px 0;">
          <strong>Code expires in 24 hours</strong>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Your Verification Code - TicTac 3x5',
      html,
      text: `Your TicTac 3x5 verification code is: ${verificationCode}. This code expires in 24 hours.`,
    });
  }

  async sendTestEmail(email: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; text-align: center;">Test Email - TicTac 3x5</h2>
        <p>This is a test email to verify that the SMTP service is working correctly.</p>
        <p>If you receive this email, the email service is properly configured and working.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px; text-align: center;">
          Test sent at: ${new Date().toISOString()}
        </p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Test Email from TicTac 3x5',
      html,
      text: 'This is a test email to verify that the SMTP service is working correctly.',
    });
  }

  async sendPasswordResetEmail(email: string, resetCode: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - TicTac 3x5</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔒 Password Reset</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">TicTac 3x5 Game</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
            <p style="margin: 0 0 20px 0; font-size: 16px; color: #555;">
              Hello! We received a request to reset your password for your TicTac 3x5 account.
            </p>
            <p style="margin: 0 0 30px 0; font-size: 16px; color: #555;">
              Use the verification code below to create a new password:
            </p>
            
            <!-- Code Box -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #dc2626; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #dc2626;">Your Reset Code</p>
              <div style="font-size: 36px; font-weight: bold; color: #dc2626; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border: 1px dashed #dc2626;">
                ${resetCode}
              </div>
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
                Enter this 6-digit code on the password reset page
              </p>
            </div>
            
            <!-- Important Info -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <p style="margin: 0; font-size: 16px; color: #856404;">
                <strong>⚠️ Important:</strong> This code expires in <strong>1 hour</strong> for security reasons.
              </p>
            </div>
            
            <p style="margin: 30px 0 0 0; font-size: 14px; color: #666; text-align: center;">
              If you didn't request this password reset, you can safely ignore this email.<br>
              Your password will remain unchanged.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              This is an automated message from TicTac 3x5 Game<br>
              Sent on ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const plainText = `
Password Reset - TicTac 3x5 Game

Hello! We received a request to reset your password for your TicTac 3x5 account.

Your password reset code is: ${resetCode}

This code expires in 1 hour for security reasons.

To reset your password:
1. Go to the password reset page
2. Enter this 6-digit code: ${resetCode}
3. Create your new password

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

---
This is an automated message from TicTac 3x5 Game
Sent on ${new Date().toLocaleString()}
    `;

    return await this.sendEmail({
      to: email,
      subject: '🔒 Your Password Reset Code - TicTac 3x5',
      html,
      text: plainText.trim(),
    });
  }
}

// Singleton email service instance
let emailServiceInstance: EmailService | null = null;
let emailServiceInitialized = false;

// Create email service instance if SMTP settings are provided (singleton pattern)
export function loadEmailConfig() {
  // Try multiple possible config file locations
  const possiblePaths = [
    path.join(__dirname, 'config', 'email.json'),
    path.resolve(process.cwd(), 'server', 'config', 'email.json'),
    path.resolve(process.cwd(), 'config', 'email.json'),
    path.resolve(process.cwd(), 'dist', 'server', 'config', 'email.json')
  ];

  console.log('🔍 Searching for email configuration files...');
  console.log('📂 Current working directory:', process.cwd());
  console.log('📂 __dirname:', __dirname);

  for (const configPath of possiblePaths) {
    try {
      console.log(`🔍 Checking: ${configPath}`);
      if (fs.existsSync(configPath)) {
        console.log(`✅ Found config file at: ${configPath}`);
        
        // Check file permissions
        try {
          fs.accessSync(configPath, fs.constants.R_OK);
          console.log('✅ File is readable');
        } catch (permError) {
          console.error(`❌ File permission error: ${permError instanceof Error ? permError.message : String(permError)}`);
          continue;
        }
        
        const configData = fs.readFileSync(configPath, 'utf8');
        console.log('✅ File read successfully, length:', configData.length);
        
        const config = JSON.parse(configData);
        console.log('✅ JSON parsed successfully');
        console.log('📧 Config structure:', {
          hasSmtp: !!config.smtp,
          hasHost: !!config.smtp?.host,
          hasPort: !!config.smtp?.port,
          hasAuth: !!config.smtp?.auth,
          hasUser: !!config.smtp?.auth?.user,
          hasPass: !!config.smtp?.auth?.pass,
          hasFromEmail: !!config.fromEmail
        });
        
        const result = {
          host: config.smtp?.host,
          port: config.smtp?.port?.toString(),
          user: config.smtp?.auth?.user,
          pass: config.smtp?.auth?.pass,
          fromEmail: config.fromEmail,
          secure: typeof config.smtp?.secure === 'boolean' ? config.smtp.secure : (config.smtp?.port === 465)
        };
        
        console.log('✅ Email configuration loaded from config file:', configPath);
        console.log('📧 Loaded values:', {
          host: !!result.host,
          port: !!result.port,
          user: !!result.user,
          pass: !!result.pass,
          fromEmail: !!result.fromEmail,
          secure: result.secure
        });
        
        return result;
      } else {
        console.log(`❌ File not found: ${configPath}`);
      }
    } catch (error) {
      console.error(`❌ Error loading config from ${configPath}:`, error instanceof Error ? error.message : String(error));
      if (error instanceof SyntaxError) {
        console.error('❌ JSON syntax error - check file format');
      }
      continue;
    }
  }

  console.log('⚠️ No config files found, falling back to environment variables');
  
  // Fall back to environment variables
  const envConfig = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromEmail: process.env.FROM_EMAIL,
    secure: null // Will be determined based on port
  };
  
  console.log('📧 Environment variables:', {
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_PORT: !!process.env.SMTP_PORT,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS,
    FROM_EMAIL: !!process.env.FROM_EMAIL
  });
  
  return envConfig;
}

export function createEmailService(): EmailService | null {
  // Return cached instance if already created
  if (emailServiceInitialized) {
    return emailServiceInstance;
  }

  const emailConfig = loadEmailConfig();
  const { host, port, user, pass, fromEmail, secure } = emailConfig;

  emailServiceInitialized = true; // Mark as initialized to prevent multiple attempts

  if (!host || !port || !user || !pass || !fromEmail) {
    console.log('SMTP configuration not complete - email verification disabled');
    console.log('Missing:', {
      smtpHost: !!host,
      smtpPort: !!port,
      smtpUser: !!user,
      smtpPass: !!pass,
      fromEmail: !!fromEmail
    });
    emailServiceInstance = null;
    return null;
  }

  console.log('✅ SMTP configuration complete - email service enabled');
  console.log('SMTP settings:', {
    host,
    port,
    user,
    from: fromEmail
  });

  const config: EmailConfig = {
    host,
    port: parseInt(port),
    secure: secure !== null ? secure : parseInt(port) === 465, // Use config value or determine from port
    auth: {
      user,
      pass,
    },
  };

  emailServiceInstance = new EmailService(config, fromEmail);
  return emailServiceInstance;
}

// Function to reset email service (for testing or configuration changes)
export function resetEmailService(): void {
  emailServiceInitialized = false;
  emailServiceInstance = null;
  console.log('🔄 Email service reset - will recreate on next use');
}