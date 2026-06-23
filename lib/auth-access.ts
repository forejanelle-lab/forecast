export const ACTOR_AUTH_CLOSED_MESSAGE =
  "Actor sign-up and sign-in are not open yet. Casting directors can create an account and sign in.";

/** When false, actor create-account and sign-in buttons are disabled in the UI. */
export function isActorSignupLoginEnabled(): boolean {
  return process.env.ACTOR_PUBLIC_AUTH_ENABLED === "true";
}

export function isActorAccountDisabled(): boolean {
  return !isActorSignupLoginEnabled();
}
