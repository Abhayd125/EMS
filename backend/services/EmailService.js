const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../config/logger');

let transporter;

const initTransporter = async () => {
  if (transporter) return transporter;

  // If credentials exist in env, use real SMTP configuration
  if (env.smtp.auth) {
    logger.info('Using custom SMTP mailer configuration: %s:%s', env.smtp.host, env.smtp.port);
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.auth
    });
  } else {
    // Local/development fallback: create Ethereal mock SMTP account
    logger.warn('No SMTP credentials found in env. Creating a test Ethereal mail account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      logger.info('Ethereal test mailer account generated. Username: %s', testAccount.user);
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (err) {
      logger.error('Failed to create Ethereal test account: %s. Falling back to console logging mailer.', err.message);
      // Ultimate fallback: dummy logger log
      transporter = {
        sendMail: async (mailOptions) => {
          logger.info('\n=======================================');
          logger.info(`MOCK EMAIL SENT TO: ${mailOptions.to}`);
          logger.info(`SUBJECT: ${mailOptions.subject}`);
          logger.info(`TEXT CONTENT: ${mailOptions.text}`);
          logger.info('=======================================\n');
          return { messageId: 'mock-id-' + Date.now() };
        }
      };
    }
  }
  return transporter;
};

const sendMail = async (options) => {
  try {
    const client = await initTransporter();
    const mailOptions = {
      from: env.smtp.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await client.sendMail(mailOptions);
    logger.info('Email sent successfully. MessageId: %s', info.messageId);

    // If Ethereal test account was used, print test link
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info('\n=======================================');
      logger.info('VIEW SENT TEST EMAIL IN BROWSER:');
      logger.info(previewUrl);
      logger.info('=======================================\n');
    }
    return info;
  } catch (err) {
    logger.error('Failed to deliver email: %s', err.message);
    throw err;
  }
};

const sendVerificationEmail = async (email, token) => {
  // Since they deployed to Vercel, use the window origin dynamically or process env FRONTEND_URL fallback
  const host = process.env.FRONTEND_URL || 'http://localhost:3000';
  const link = `${host}/verify-email/${token}`;
  
  return sendMail({
    to: email,
    subject: 'Verify your ORA Employee Account',
    text: `Welcome to Ora! Please verify your account by opening this link: ${link}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Welcome to ORA</h2>
        <p>Dear Employee,</p>
        <p>Your ORA Employee Management System portal access is ready. Please click the button below to verify your email address and activate your account:</p>
        <div style="margin: 25px 0; text-align: center;">
          <a href="${link}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Account</a>
        </div>
        <p style="font-size: 0.85rem; color: #666;">Or copy/paste this URL into your browser: <br/> <a href="${link}">${link}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;"/>
        <p style="font-size: 0.75rem; color: #999;">Ora HRMS & Employee Portal. This is an automated email, please do not reply.</p>
      </div>
    `
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const host = process.env.FRONTEND_URL || 'http://localhost:3000';
  const link = `${host}/reset-password/${token}`;

  return sendMail({
    to: email,
    subject: 'Reset your ORA Account Password',
    text: `We received a password reset request. Reset it here: ${link}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for the ORA Employee Portal. Click the button below to set a new password. This link is valid for 1 hour.</p>
        <div style="margin: 25px 0; text-align: center;">
          <a href="${link}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="font-size: 0.85rem; color: #666;">Or copy/paste this URL into your browser: <br/> <a href="${link}">${link}</a></p>
        <p style="color: #666; font-size: 0.9rem;">If you did not request this reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;"/>
        <p style="font-size: 0.75rem; color: #999;">Ora HRMS & Employee Portal.</p>
      </div>
    `
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMail
};
