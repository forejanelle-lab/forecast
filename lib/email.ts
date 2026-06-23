import nodemailer from "nodemailer";
import { Resend } from "resend";
import { getSignupNotificationRecipients } from "@/lib/email-recipients";

function getAppUrl(): string {
  const url = process.env.AUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:3000";
}

function getEmailFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    "Fore Cast <onboarding@resend.dev>"
  );
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim());
}

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function isEmailConfigured(): boolean {
  return isResendConfigured() || isSmtpConfigured();
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
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

function logEmailNotConfigured(options: SendEmailOptions): void {
  const recipients = Array.isArray(options.to) ? options.to.join(", ") : options.to;
  const message =
    "[email] Email delivery is not configured — set RESEND_API_KEY or SMTP_HOST + SMTP_FROM on Vercel.\n" +
    `To: ${recipients}\nSubject: ${options.subject}\n${options.text}`;

  if (process.env.NODE_ENV === "production") {
    console.error(message);
    return;
  }

  console.info(`[email:dev] ${message}`);
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const from = getEmailFromAddress();

  if (!isEmailConfigured()) {
    logEmailNotConfigured(options);
    return;
  }

  const resend = getResendClient();
  if (resend) {
    const { error } = await resend.emails.send({
      from,
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const transporter = await getTransporter();
  await transporter.sendMail({
    from,
    to: recipients.join(","),
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
  firstName: string;
  lastName: string;
  email: string;
  role: "ACTOR" | "CASTING";
  signupAt: Date;
  referralSource?: string;
}): Promise<void> {
  const userTypeLabel =
    params.role === "ACTOR" ? "Actor" : "Casting Director";
  const signupAtLabel = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(params.signupAt);
  const referralSource = params.referralSource?.trim();
  const recipients = getSignupNotificationRecipients();

  const subject = `🎉 New Fore Cast Signup - ${userTypeLabel}`;

  const referralText = referralSource
    ? `Referral Source: ${referralSource}\n`
    : "";
  const referralHtml = referralSource
    ? `<li><strong>Referral Source:</strong> ${referralSource}</li>`
    : "";

  await sendEmail({
    to: recipients,
    subject,
    text:
      `A new Fore Cast account was created.\n\n` +
      `User Type: ${userTypeLabel}\n` +
      `First Name: ${params.firstName}\n` +
      `Last Name: ${params.lastName}\n` +
      `Email Address: ${params.email}\n` +
      `Signup Date/Time: ${signupAtLabel} UTC\n` +
      referralText,
    html: `
      <p>A new <strong>Fore Cast</strong> account was created.</p>
      <ul>
        <li><strong>User Type:</strong> ${userTypeLabel}</li>
        <li><strong>First Name:</strong> ${params.firstName}</li>
        <li><strong>Last Name:</strong> ${params.lastName}</li>
        <li><strong>Email Address:</strong> ${params.email}</li>
        <li><strong>Signup Date/Time:</strong> ${signupAtLabel} UTC</li>
        ${referralHtml}
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
