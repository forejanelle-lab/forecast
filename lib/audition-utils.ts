/** Parse calendar dates (YYYY-MM-DD) as UTC midnight for consistent storage/display. */
export function parseCalendarDate(value: string): Date | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function isUpcomingAudition(deadline: string): boolean {
  if (!deadline) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parts = deadline.split("-").map(Number);
  const deadlineDate = new Date(parts[0], parts[1] - 1, parts[2]);
  return deadlineDate >= today;
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isAuditionDeadlineInPast(deadline: string): boolean {
  if (!deadline?.trim()) return false;
  return !isUpcomingAudition(deadline);
}

/** Use role submission deadline when valid; otherwise default to today. */
export function resolveAuditionDeadline(deadline?: string | null): string {
  if (deadline?.trim() && !isAuditionDeadlineInPast(deadline)) return deadline;
  return getTodayDateString();
}
