export interface DateRange {
  start: Date;
  end: Date;
}

export function formatMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function parseMonthKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  if (month < 0 || month > 11) return null;

  return new Date(year, month, 1);
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

export function getRecentMonthOptions(count = 12, now = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    return {
      key: formatMonthKey(year, month),
      label: formatMonthLabel(year, month),
    };
  });
}

export function getCalendarMonthRange(
  year: number,
  month: number,
  now = new Date(),
): DateRange {
  const start = new Date(year, month, 1);
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === month;
  const end = isCurrentMonth
    ? now
    : new Date(year, month + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

export function getMonthRangeForKey(monthKey: string, now = new Date()): DateRange {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return getCurrentMonthRange(now);

  return getCalendarMonthRange(parsed.getFullYear(), parsed.getMonth(), now);
}

export function getPreviousMonthRangeFor(date: Date): DateRange {
  const previous = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getCalendarMonthRange(previous.getFullYear(), previous.getMonth());
}

export function getCurrentMonthRange(now = new Date()): DateRange {
  return getCalendarMonthRange(now.getFullYear(), now.getMonth(), now);
}

export function getTodayRange(now = new Date()): DateRange {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getPreviousMonthRange(now = new Date()): DateRange {
  return getPreviousMonthRangeFor(now);
}

export function prismaCreatedAtRange(range: DateRange) {
  return {
    gte: range.start,
    lte: range.end,
  };
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
