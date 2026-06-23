export function formatReferralSourceLabel(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 500) : undefined;
}

export function buildSignupReferralSourceFromSearchParams(
  searchParams: URLSearchParams,
  documentReferrer?: string | null,
): string | undefined {
  const parts: string[] = [];

  for (const key of ["utm_source", "utm_medium", "utm_campaign", "ref", "source"]) {
    const value = searchParams.get(key);
    if (value?.trim()) {
      parts.push(`${key}=${value.trim()}`);
    }
  }

  if (parts.length > 0) {
    return formatReferralSourceLabel(parts.join(" · "));
  }

  const referrer = documentReferrer?.trim();
  if (!referrer) return undefined;

  try {
    return formatReferralSourceLabel(
      new URL(referrer).hostname.replace(/^www\./, ""),
    );
  } catch {
    return formatReferralSourceLabel(referrer);
  }
}
