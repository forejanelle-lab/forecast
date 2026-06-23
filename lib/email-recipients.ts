import { SUPPORT_EMAIL } from "@/lib/support";

export function getSignupNotificationRecipients(): string[] {
  const recipients = new Set<string>();

  recipients.add(SUPPORT_EMAIL.trim().toLowerCase());

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? [];

  for (const email of adminEmails) {
    recipients.add(email);
  }

  return [...recipients];
}
