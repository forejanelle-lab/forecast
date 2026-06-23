import type {
  ApplicationStatus,
  AuditionStatus,
  ProjectStatus,
  RoleStatus,
} from "@/types";

export function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDateOnly(date: Date | string | null | undefined): string {
  if (!date) return "";
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const useUtc =
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0;
  const year = useUtc ? d.getUTCFullYear() : d.getFullYear();
  const month = useUtc ? d.getUTCMonth() + 1 : d.getMonth() + 1;
  const day = useUtc ? d.getUTCDate() : d.getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString();
}

export function inferRegion(location: string | null | undefined): "LA" | "NY" | "Atlanta" {
  const value = location?.toLowerCase() ?? "";
  if (value.includes("new york") || value.includes("ny")) return "NY";
  if (value.includes("atlanta")) return "Atlanta";
  return "LA";
}

const PROJECT_STATUS_MAP: Record<string, ProjectStatus> = {
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
  COMPLETED: "completed",
};

const PROJECT_STATUS_TO_PRISMA: Record<ProjectStatus, string> = {
  draft: "DRAFT",
  active: "ACTIVE",
  archived: "ARCHIVED",
  completed: "COMPLETED",
};

const ROLE_STATUS_MAP: Record<string, RoleStatus> = {
  OPEN: "open",
  CLOSED: "closed",
  CASTING: "casting",
  FILLED: "filled",
};

const ROLE_STATUS_TO_PRISMA: Record<RoleStatus, string> = {
  open: "OPEN",
  closed: "CLOSED",
  casting: "CASTING",
  filled: "FILLED",
};

const APPLICATION_STATUS_MAP: Record<string, ApplicationStatus> = {
  SUBMITTED: "submitted",
  AUDITION_VIEWED: "audition_viewed",
  REVIEWING: "reviewing",
  AUDITION_REQUESTED: "audition_requested",
  CALLBACK: "callback",
  REJECTED: "rejected",
  ACCEPTED: "accepted",
};

const APPLICATION_STATUS_TO_PRISMA: Record<ApplicationStatus, string> = {
  submitted: "SUBMITTED",
  audition_viewed: "AUDITION_VIEWED",
  reviewing: "REVIEWING",
  audition_requested: "AUDITION_REQUESTED",
  callback: "CALLBACK",
  rejected: "REJECTED",
  accepted: "ACCEPTED",
};

const AUDITION_STATUS_MAP: Record<string, AuditionStatus> = {
  REQUESTED: "requested",
  SUBMITTED: "submitted",
  DECLINED: "declined",
  WITHDRAWN: "withdrawn",
  ACCEPTED: "accepted",
  COMPLETED: "accepted",
};

const AUDITION_STATUS_TO_PRISMA: Record<AuditionStatus, string> = {
  requested: "REQUESTED",
  submitted: "SUBMITTED",
  declined: "DECLINED",
  withdrawn: "WITHDRAWN",
  accepted: "ACCEPTED",
};

const NOTIFICATION_CATEGORY_MAP: Record<string, string> = {
  APPLICATIONS: "applications",
  AUDITIONS: "auditions",
  PROJECTS: "projects",
  MESSAGES: "messages",
  SYSTEM: "system",
  BILLING: "billing",
};

export function mapProjectStatus(status: string): ProjectStatus {
  return PROJECT_STATUS_MAP[status] ?? "active";
}

export function toPrismaProjectStatus(status: ProjectStatus): string {
  return PROJECT_STATUS_TO_PRISMA[status];
}

export function mapRoleStatus(status: string): RoleStatus {
  return ROLE_STATUS_MAP[status] ?? "open";
}

export function toPrismaRoleStatus(status: RoleStatus): string {
  return ROLE_STATUS_TO_PRISMA[status];
}

export function mapApplicationStatus(status: string): ApplicationStatus {
  return APPLICATION_STATUS_MAP[status] ?? "submitted";
}

export function toPrismaApplicationStatus(status: ApplicationStatus): string {
  return APPLICATION_STATUS_TO_PRISMA[status];
}

export function mapAuditionStatus(status: string): AuditionStatus {
  return AUDITION_STATUS_MAP[status] ?? "requested";
}

export function toPrismaAuditionStatus(status: AuditionStatus): string {
  return AUDITION_STATUS_TO_PRISMA[status];
}

export function mapNotificationCategory(category: string): string {
  return NOTIFICATION_CATEGORY_MAP[category] ?? "system";
}

export function mapMediaType(type: string): "video" | "audio" | "document" {
  if (type === "AUDIO") return "audio";
  if (type === "DOCUMENT") return "document";
  return "video";
}

export function formatPlayingAge(min?: number | null, max?: number | null): string {
  if (min && max) return `${min}-${max}`;
  if (min) return `${min}+`;
  if (max) return `up to ${max}`;
  return "";
}

export function isPremiumActive(
  membership: string,
  trialEndsAt: Date | null | undefined,
): boolean {
  if (membership.toUpperCase() === "PREMIUM") {
    if (!trialEndsAt) return true;
    return trialEndsAt > new Date();
  }
  return false;
}

export function membershipLabel(
  membership: string,
  trialEndsAt: Date | null | undefined,
): string {
  return isPremiumActive(membership, trialEndsAt) ? "Premium" : "Free";
}

export function resolveProfilePhotoUrl(
  profile:
    | {
        profilePhotoUrl: string | null;
        headshots: { url: string | null; featured: boolean }[];
      }
    | null
    | undefined,
): string | undefined {
  if (!profile) return undefined;
  const featuredUrl = profile.headshots.find((h) => h.featured && h.url)?.url;
  const firstUrl = profile.headshots.find((h) => h.url)?.url;
  return featuredUrl ?? firstUrl ?? profile.profilePhotoUrl ?? undefined;
}
