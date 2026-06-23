import nodemailer from "nodemailer";
import { SUPPORT_EMAIL } from "@/lib/support";

function getAppUrl(): string {
  const url = process.env.AUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:3000";
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim());
}

async function getTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const from = process.env.SMTP_FROM?.trim() ?? "Fore Cast <noreply@forecast.com>";

  if (!isSmtpConfigured()) {
    console.info(
      "[email:dev] SMTP not configured — logging message instead of sending.\n" +
        `To: ${options.to}\nSubject: ${options.subject}\n${options.text}`,
    );
    return;
  }

  const transporter = await getTransporter();
  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${getAppUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "Verify your Fore Cast email",
    text: `Welcome to Fore Cast. Verify your email by visiting: ${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: `
      <p>Welcome to <strong>Fore Cast</strong>.</p>
      <p>Verify your email to access your account:</p>
      <p><a href="${verifyUrl}">Verify email address</a></p>
      <p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
    `,
  });
}

export async function sendNewAccountNotificationToSupport(params: {
  name: string;
  email: string;
  role: string;
}): Promise<void> {
  const roleLabel = params.role === "ACTOR" ? "Actor" : "Casting";

  await sendEmail({
    to: SUPPORT_EMAIL,
    subject: `New ${roleLabel} account: ${params.email}`,
    text:
      `A new account was created on Fore Cast.\n\n` +
      `Name: ${params.name}\n` +
      `Email: ${params.email}\n` +
      `Role: ${roleLabel}\n`,
    html: `
      <p>A new account was created on <strong>Fore Cast</strong>.</p>
      <ul>
        <li><strong>Name:</strong> ${params.name}</li>
        <li><strong>Email:</strong> ${params.email}</li>
        <li><strong>Role:</strong> ${roleLabel}</li>
      </ul>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const resetUrl = `${getAppUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: email,
    subject: "Reset your Fore Cast password",
    text: `Reset your password by visiting: ${resetUrl}\n\nThis link expires in 1 hour.`,
    html: `
      <p>We received a request to reset your Fore Cast password.</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>This link expires in 1 hour. If you didn't request a reset, you can ignore this email.</p>
    `,
  });
}
