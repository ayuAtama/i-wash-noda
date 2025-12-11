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
  hashedToken: string
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
      <p style="font-size: 20px; font-weight: bold;">${code}</p>
      <p>This code expires in 10 minutes.</p>
    `,
  });
}

// 5. Password reset
export async function sendPasswordResetEmail(email: string, code: string) {
  return sendMail({
    to: email,
    subject: "Reset Your Password",
    html: `
      <h2>Password Reset Code</h2>
      <p style="font-size: 20px; font-weight: bold;">${code}</p>
      <p>This code expires in 10 minutes.</p>
    `,
  });
}
