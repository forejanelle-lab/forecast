export const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL?.trim() || "hello@forecastcasting.com";

export function buildSupportMailtoUrl(subject = "Fore Cast Support"): string {
  const params = new URLSearchParams({ subject });
  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
}
