export interface ActorProfileCompletenessInput {
  bio?: string | null;
  location?: string | null;
  playingAge?: string | null;
  playingAgeMin?: number | null;
  playingAgeMax?: number | null;
  height?: string | null;
  unionStatus?: string | null;
  skills?: string[];
  languages?: string[];
  credits?: unknown[];
  headshots?: unknown[];
  media?: unknown[];
  hasProfilePhoto?: boolean;
}

export function getMissingActorProfileFields(
  input: ActorProfileCompletenessInput,
): string[] {
  const missing: string[] = [];

  if (!input.hasProfilePhoto) missing.push("Profile photo");
  if (!input.bio?.trim()) missing.push("Bio");
  if (!input.location?.trim()) missing.push("Location");

  const hasPlayingAge =
    Boolean(input.playingAge?.trim()) ||
    (input.playingAgeMin != null && input.playingAgeMax != null);

  if (!hasPlayingAge) missing.push("Playing age");
  if (!input.height?.trim()) missing.push("Height");
  if (!input.unionStatus?.trim()) missing.push("Union status");
  if (!input.credits?.length) missing.push("Credits");
  if (!input.skills?.length) missing.push("Skills");
  if (!input.languages?.length) missing.push("Languages");
  if (!input.headshots?.length) missing.push("Headshots");
  if (!input.media?.length) missing.push("Media");

  return missing;
}

export function isActorProfileComplete(input: ActorProfileCompletenessInput): boolean {
  return getMissingActorProfileFields(input).length === 0;
}
