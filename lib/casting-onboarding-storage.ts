const ONBOARDING_KEY_PREFIX = "forecast-casting-onboarding";

export function isCastingOnboardingComplete(
  userId: string,
  dbComplete = false,
): boolean {
  if (dbComplete) return true;
  if (typeof window === "undefined") return dbComplete;
  return localStorage.getItem(`${ONBOARDING_KEY_PREFIX}-${userId}`) === "done";
}

export async function markCastingOnboardingComplete(userId: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem(`${ONBOARDING_KEY_PREFIX}-${userId}`, "done");

  try {
    await fetch("/api/auth/onboarding/complete", { method: "POST" });
  } catch (error) {
    console.error("Failed to persist casting onboarding completion:", error);
  }
}
