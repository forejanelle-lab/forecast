export function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatFullName(
  firstName?: string | null,
  lastName?: string | null,
  fallbackName?: string | null,
): string {
  const fullName = [firstName?.trim(), lastName?.trim()]
    .filter(Boolean)
    .join(" ");
  return fullName || fallbackName?.trim() || "";
}

export function getUserDisplayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
}): string {
  return formatFullName(user.firstName, user.lastName, user.name) || "User";
}

export function getUserInitials(user: {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
}): string {
  const fromParts = formatFullName(user.firstName, user.lastName);
  if (fromParts) return getInitials(fromParts);
  return getInitials(user.name);
}
