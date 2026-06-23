export const PROJECT_TYPE_OPTIONS = [
  "Feature Film",
  "Television Series",
  "Limited Series",
  "Commercial",
  "Short Film",
  "Web Series",
  "Documentary",
  "Theater",
];

export const UNION_STATUS_OPTIONS = [
  "SAG-AFTRA",
  "Non-Union",
  "SAG-AFTRA Modified Low Budget",
  "SAG-AFTRA Low Budget",
  "SAG-AFTRA Ultra Low Budget",
  "SAG-AFTRA New Media",
  "SAG-AFTRA Short Project",
  "Equity (AEA)",
  "Union & Non-Union",
];

export function isDateBefore(date: string, minDate: string) {
  return date < minDate;
}

export function formatShootDates(start: string, end: string): string | undefined {
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return undefined;
}

export function parseShootDatesForForm(shootDates: string): { start: string; end: string } {
  if (!shootDates?.trim()) return { start: "", end: "" };

  const rangeMatch = shootDates.match(
    /(\d{4}-\d{2}-\d{2})\s*[–-]\s*(\d{4}-\d{2}-\d{2})/,
  );
  if (rangeMatch) {
    return { start: rangeMatch[1], end: rangeMatch[2] };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(shootDates.trim())) {
    return { start: shootDates.trim(), end: "" };
  }

  return { start: "", end: "" };
}
