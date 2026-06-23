import type { Role } from "@/types";

export function formatRolePlayingAge(playingAge: string): string {
  const trimmed = playingAge.trim();
  if (!trimmed) return "";
  if (/years?\s*old/i.test(trimmed)) return trimmed;
  return `${trimmed} years old`;
}

export function formatRoleEthnicity(ethnicity: string): string {
  const trimmed = ethnicity?.trim();
  if (!trimmed) return "open ethnicity";
  const lower = trimmed.toLowerCase();
  if (lower === "open" || lower === "any") return `${lower} ethnicity`;
  return trimmed;
}

export function formatRoleGender(gender: string): string {
  const trimmed = gender?.trim();
  if (!trimmed) return "Open";
  return trimmed;
}

function formatRolePayRate(compensation: string): string {
  const trimmed = compensation?.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) return trimmed;
  return `(${trimmed})`;
}

/** Ethnicity | Gender | Age range (pay rate) */
export function formatRoleMetaLine(role: Role): string {
  const ethnicity = formatRoleEthnicity(role.ethnicity);
  const gender = formatRoleGender(role.gender);
  const age = formatRolePlayingAge(role.playingAge);
  const pay = formatRolePayRate(role.compensation);
  const ageWithPay = age && pay ? `${age} ${pay}` : age || pay;
  return [ethnicity, gender, ageWithPay].filter(Boolean).join(" | ");
}
