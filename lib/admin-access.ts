function getAdminEmailList(): string[] {
  return (
    process.env.ADMIN_EMAILS?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? []
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  if (!normalized) return false;

  const adminEmails = getAdminEmailList();
  if (adminEmails.length === 0) return false;

  return adminEmails.includes(normalized);
}
