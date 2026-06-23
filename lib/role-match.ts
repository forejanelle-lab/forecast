import type { Role } from "@/types";

export function parsePlayingAge(age: string): [number, number] {
  const parts = age.split("-").map((part) => parseInt(part.trim(), 10));
  const min = parts[0] ?? 0;
  const max = parts[1] ?? min;
  return [min, max];
}

export function playingAgesOverlap(actorAge: string, roleAge: string): boolean {
  const [actorMin, actorMax] = parsePlayingAge(actorAge);
  const [roleMin, roleMax] = parsePlayingAge(roleAge);
  return actorMin <= roleMax && roleMin <= actorMax;
}

export function parseRoleEthnicities(ethnicity: string): string[] {
  if (!ethnicity.trim()) return ["Open"];
  return ethnicity
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function ethnicityMatchesRole(
  actorEthnicities: string[] | undefined,
  roleEthnicity: string,
): boolean {
  const roleEthnicities = parseRoleEthnicities(roleEthnicity);
  if (
    roleEthnicities.length === 0 ||
    roleEthnicities.some((value) => value.toLowerCase() === "open")
  ) {
    return true;
  }
  if (!actorEthnicities?.length) return true;
  const normalizedActor = actorEthnicities.map((value) => value.toLowerCase());
  return roleEthnicities.some((value) =>
    normalizedActor.includes(value.toLowerCase()),
  );
}

export function genderMatchesRole(roleGender: string, actorGender: string): boolean {
  const normalizedRole = roleGender.trim().toLowerCase();
  if (!normalizedRole || normalizedRole === "open" || normalizedRole === "any") {
    return true;
  }
  const normalizedActor = actorGender.trim().toLowerCase();
  if (!normalizedActor) return false;
  return normalizedRole === normalizedActor;
}

export function isRoleFitForActor(
  role: Role,
  actor: { playingAge: string; gender: string; ethnicities?: string[] },
): boolean {
  if (!actor.playingAge.trim()) return false;
  return (
    genderMatchesRole(role.gender, actor.gender) &&
    playingAgesOverlap(actor.playingAge, role.playingAge) &&
    ethnicityMatchesRole(actor.ethnicities, role.ethnicity)
  );
}

export function isPostedToday(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split("-").map(Number);
  const posted = new Date(year, month - 1, day);
  return posted.getTime() === today.getTime();
}

export function matchesSearchQuery(
  query: string,
  projectTitle: string,
  productionCompany: string,
  roleNames: string[],
): boolean {
  if (!query.trim()) return true;
  const normalized = query.trim().toLowerCase();
  return (
    projectTitle.toLowerCase().includes(normalized) ||
    productionCompany.toLowerCase().includes(normalized) ||
    roleNames.some((name) => name.toLowerCase().includes(normalized))
  );
}
