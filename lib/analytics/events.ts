import type { BusinessAnalyticsEventType } from "@prisma/client";

export const BUSINESS_ANALYTICS_EVENT_TYPES: BusinessAnalyticsEventType[] = [
  "SIGNUP",
  "LOGIN",
  "ACTOR_REGISTRATION",
  "CASTING_REGISTRATION",
  "PROFILE_COMPLETION",
  "PROJECT_CREATION",
  "ROLE_CREATION",
  "APPLICATION_SUBMITTED",
  "AUDITION_REQUEST_SENT",
  "MESSAGE_SENT",
  "PREMIUM_UPGRADE",
];

export const BUSINESS_EVENT_LABELS: Record<BusinessAnalyticsEventType, string> = {
  SIGNUP: "Signups",
  LOGIN: "Logins",
  ACTOR_REGISTRATION: "Actor registrations",
  CASTING_REGISTRATION: "Casting director registrations",
  PROFILE_COMPLETION: "Profile completions",
  PROJECT_CREATION: "Projects created",
  ROLE_CREATION: "Roles created",
  APPLICATION_SUBMITTED: "Applications submitted",
  AUDITION_REQUEST_SENT: "Audition requests sent",
  MESSAGE_SENT: "Messages sent",
  PREMIUM_UPGRADE: "Premium upgrades",
};

/** Events that must only be recorded on the server for integrity. */
export const SERVER_AUTHORITATIVE_EVENTS = new Set<BusinessAnalyticsEventType>(
  BUSINESS_ANALYTICS_EVENT_TYPES,
);

export function isBusinessAnalyticsEventType(
  value: string,
): value is BusinessAnalyticsEventType {
  return (BUSINESS_ANALYTICS_EVENT_TYPES as string[]).includes(value);
}
