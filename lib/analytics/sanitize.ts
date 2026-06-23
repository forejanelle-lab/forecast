const SENSITIVE_KEY_PATTERN =
  /email|password|name|token|secret|authorization|cookie|session/i;
const MAX_METADATA_KEYS = 12;
const MAX_STRING_LENGTH = 120;

export type SanitizedMetadata = Record<string, string | number | boolean>;

export function sanitizeAnalyticsMetadata(
  metadata: Record<string, unknown> | undefined | null,
): SanitizedMetadata | undefined {
  if (!metadata) return undefined;

  const sanitized: SanitizedMetadata = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (Object.keys(sanitized).length >= MAX_METADATA_KEYS) break;
    if (!key.trim() || SENSITIVE_KEY_PATTERN.test(key)) continue;

    if (typeof value === "string") {
      const trimmed = value.trim().slice(0, MAX_STRING_LENGTH);
      if (trimmed) sanitized[key] = trimmed;
      continue;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === "boolean") {
      sanitized[key] = value;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}
