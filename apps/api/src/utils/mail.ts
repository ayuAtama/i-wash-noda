import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import "dotenv/config";
import { HttpError } from "./httpError";

const baseUrl: string = process.env.FRONTEND_URL || "http://localhost:3001";

// 1. Email Configuration
export const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
} as SMTPTransport.Options);

// 2. Base reusable function
export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const res = await mailer.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
    });
    if (!res.accepted || res.accepted.length === 0) {
      throw new HttpError(500, "SMTP server did not accept the email.");
    }
    return res;
  } catch (error) {
    throw error;
  }
}

// 3. Email verification
export async function sendVerificationEmail(
  email: string,
  code: string,
  hashedToken: string,
) {
  return sendMail({
    to: email,
    subject: "Verify Your Email",
    html: `
      <h2>Email Verification Code</h2>
      <p style="font-size: 20px; font-weight: bold;">${code}</p>
      <p>This code expires in 60 minutes.</p>
      <p>You can also verify your email from this link: </p>
      <a href="${baseUrl}/verify?token=${hashedToken}">Verify here!</a>
    `,
  });
}

// 4. Change email verification
export async function sendEmailChangeVerification(email: string, code: string) {
  return sendMail({
    to: email,
    subject: "Confirm Email Change",
    html: `
      <h2>Confirm Your New Email Address</h2>
      <p style="font-size: 20px; font-weight: bold;">
      Click the link below to change your email address:
      <br/>
      <a href="${baseUrl}/reset-password?token=${code}">Change to New Email!</a>
      </p>
      </p>
      <p>This code expires in 1 hour.</p>
    `,
  });
}

// 5. Password reset
export async function sendPasswordResetEmail(email: string, code: string) {
  return sendMail({
    to: email,
    subject: "Reset Your Password",
    html: `
      <h2>Password Reset Link!</h2>
      <p style="font-size: 20px; font-weight: bold;">
      Click the link below to reset your password:
      <br/>
      <a href="${baseUrl}/reset-password?token=${code}">Reset Password!</a>
      </p>
      <p>This code expires in 1 hour.</p>
    `,
  });
}

// 6. Verify account made by admin (worker and driver)
export async function sendVerifyEmailbyAdmin(
  email: string,
  userId: string,
  hashedToken: string,
  role: string,
) {
  return sendMail({
    to: email,
    subject: `Verify Your ${role} Account`,
    html: `
      <h2>Verify Your Account</h2>
      <p style="font-size: 20px; font-weight: bold;">
      Click the link below to verify your account:</p>
      <br/>
      <a href="${baseUrl}/verify?token=${hashedToken}?userId=${userId}">Verify here!</a>
      <p>This code expires in 1 hour.</p>
    `,
  });
}

// 7. Order completion notification
export async function sendOrderCompletionEmail(
  email: string,
  orderId: string,
  outletName: string,
) {
  return sendMail({
    to: email,
    subject: "Your Laundry Order is Ready!",
    html: `
      <h2>Your Order is Complete</h2>
      <p>Your laundry order <strong>#${orderId.slice(0, 8)}</strong> at <strong>${outletName}</strong> has been completed and is ready for pickup.</p>
      <p>Please collect your order within 24 hours.</p>
      <p>Thank you for choosing I Wash Noda!</p>
    `,
  });
}
