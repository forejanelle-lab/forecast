import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse calendar dates (YYYY-MM-DD) in local time; full ISO strings as instants. */
export function parseAppDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(date);
}

export function formatDate(date: string | Date): string {
  const parsed = parseAppDate(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function formatDateTime(date: string | Date): string {
  const parsed = parseAppDate(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

export function formatDateOrPlaceholder(
  date: string | Date | null | undefined,
  placeholder = "—",
): string {
  if (!date) return placeholder;
  if (typeof date === "string" && !date.trim()) return placeholder;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return placeholder;
  return formatDate(parsed);
}

export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const target = parseAppDate(date);
  if (Number.isNaN(target.getTime())) return "";
  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}
