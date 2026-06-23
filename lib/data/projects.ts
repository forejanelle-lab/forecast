import { syncAuditionsFromApplications } from "@/lib/audition-sync";
import { applicationHasBookingOfferSent } from "@/lib/application-booking-offer";
import {
  formatDateOnly,
  formatPlayingAge,
  formatTimestamp,
  getInitials,
  inferRegion,
  isPremiumActive,
  mapApplicationStatus,
  mapAuditionStatus,
  mapNotificationCategory,
  mapProjectStatus,
  mapRoleStatus,
  membershipLabel,
  resolveProfilePhotoUrl,
} from "@/lib/prisma-mappers";
import { cache } from "react";
import { countRolesAcceptingApplications } from "@/lib/role-acceptance-server";
import { computeProjectHealthScore } from "@/lib/casting-project-health";
import {
  countPendingAuditionReviews,
  countReviewedSubmissions,
  countAwaitingActorAuditionResponse,
} from "@/lib/casting-project-metrics";
import { parseRoleAuditionFiles } from "@/lib/role-audition-files";
import {
  repairLegacyClosedProjectStatuses,
  syncAllProjectLifecycleStatuses,
} from "@/lib/project-lifecycle";
import { prisma } from "@/lib/prisma";
import {
  formatMonthKey,
  getMonthRangeForKey,
  getPreviousMonthRangeFor,
  getTodayRange,
  parseMonthKey,
  percentChange,
  prismaCreatedAtRange,
  type DateRange,
} from "@/lib/date-ranges";
import type {
  Application,
  Audition,
  AuditionSubmission,
  Notification,
  Project,
  Role,
  RoleSubmission,
  RoleSubmissionItem,
} from "@/types";

type ProjectWithRelations = Awaited<ReturnType<typeof fetchProjectsRaw>>[number];

const syncExpiredProjectStatuses = cache(syncAllProjectLifecycleStatuses);

async function fetchProjectsRaw(userId: string) {
  return prisma.project.findMany({
    where: { createdById: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      roles: {
        include: {
          applications: { select: { id: true } },
        },
      },
    },
  });
}

export function mapProjectRow(
  project: ProjectWithRelations,
  castingOffice?: string | null,
): Project {
  const roleCount = project.roles.length;
  const submissionCount = project.roles.reduce(
    (sum, role) => sum + role.applications.length,
    0,
  );

  return {
    id: project.id,
    title: project.title,
    status: mapProjectStatus(project.status),
    productionCompany: project.productionCompany,
    castingOffice: castingOffice ?? project.productionCompany,
    projectType: project.projectType,
    unionStatus: project.unionStatus ?? "",
    location: project.location ?? "",
    region: inferRegion(project.location),
    castingDirector: project.createdBy.name ?? "Casting Director",
    submissionDeadline: formatDateOnly(project.submissionDeadline),
    shootDates: project.shootDates ?? "",
    compensation: project.compensation ?? "",
    description: project.description ?? "",
    roleCount,
    submissionCount,
  };
}

export async function getProjectsForCastingUser(userId: string): Promise<Project[]> {
  await syncExpiredProjectStatuses();

  const profile = await prisma.castingProfile.findUnique({
    where: { userId },
    select: { officeName: true, company: true },
  });
  const office = profile?.officeName ?? profile?.company;

  const projects = await fetchProjectsRaw(userId);
  return projects.map((p) => mapProjectRow(p, office));
}

export async function getProjectByIdForCasting(
  projectId: string,
  userId: string,
): Promise<Project | null> {
  await syncExpiredProjectStatuses();

  const project = await prisma.project.findFirst({
    where: { id: projectId, createdById: userId },
    include: {
      createdBy: { select: { name: true } },
      roles: { include: { applications: { select: { id: true } } } },
    },
  });

  if (!project) return null;

  const profile = await prisma.castingProfile.findUnique({
    where: { userId },
    select: { officeName: true, company: true },
  });

  return mapProjectRow(project, profile?.officeName ?? profile?.company);
}

export async function getProjectByIdForActors(projectId: string): Promise<Project | null> {
  await syncExpiredProjectStatuses();

  const project = await prisma.project.findFirst({
    where: { id: projectId, status: "ACTIVE" },
    include: {
      createdBy: {
        select: {
          name: true,
          castingProfile: { select: { officeName: true, company: true } },
        },
      },
      roles: { include: { applications: { select: { id: true } } } },
    },
  });

  if (!project) return null;

  return mapProjectRow(
    project as ProjectWithRelations,
    project.createdBy.castingProfile?.officeName ??
      project.createdBy.castingProfile?.company,
  );
}

export async function getActiveProjectsForActors(): Promise<Project[]> {
  await syncExpiredProjectStatuses();

  const projects = await prisma.project.findMany({
    where: { status: "ACTIVE" },
    orderBy: { submissionDeadline: "asc" },
    include: {
      createdBy: {
        select: {
          name: true,
          castingProfile: { select: { officeName: true, company: true } },
        },
      },
      roles: { include: { applications: { select: { id: true } } } },
    },
  });

  return projects.map((p) =>
    mapProjectRow(
      p as ProjectWithRelations,
      p.createdBy.castingProfile?.officeName ??
        p.createdBy.castingProfile?.company,
    ),
  );
}

export function mapRoleRow(
  role: {
    id: string;
    projectId: string;
    characterName: string;
    playingAge: string | null;
    gender: string | null;
    ethnicity: string | null;
    roleType: string | null;
    compensation: string | null;
    shootDates: string | null;
    submissionDeadline: Date | null;
    description: string | null;
    auditionInstructions: string | null;
    auditionFiles?: unknown;
    status: string;
    createdAt: Date;
    project?: { title: string };
    applications?: { id: string }[];
  },
): Role {
  return {
    id: role.id,
    projectId: role.projectId,
    projectTitle: role.project?.title ?? "",
    characterName: role.characterName,
    playingAge: role.playingAge ?? "",
    gender: role.gender ?? "",
    ethnicity: role.ethnicity ?? "",
    roleType: role.roleType ?? "",
    compensation: role.compensation ?? "",
    shootDates: role.shootDates ?? "",
    submissionDeadline: formatDateOnly(role.submissionDeadline),
    postedAt: formatDateOnly(role.createdAt),
    description: role.description ?? "",
    auditionInstructions: role.auditionInstructions ?? "",
    auditionFiles: parseRoleAuditionFiles(role.auditionFiles),
    submissionCount: role.applications?.length ?? 0,
    status: mapRoleStatus(role.status),
  };
}

export async function getRolesForProject(projectId: string): Promise<Role[]> {
  const roles = await prisma.role.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { title: true } },
      applications: { select: { id: true } },
    },
  });
  return roles.map(mapRoleRow);
}

export async function getOpenRolesForActors(): Promise<Role[]> {
  await syncExpiredProjectStatuses();

  const roles = await prisma.role.findMany({
    where: { status: "OPEN", project: { status: "ACTIVE" } },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { title: true } },
      applications: { select: { id: true } },
    },
  });
  return roles.map(mapRoleRow);
}

export async function getRoleById(roleId: string): Promise<Role | null> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      project: { select: { title: true } },
      applications: { select: { id: true } },
    },
  });
  return role ? mapRoleRow(role) : null;
}

export function mapApplicationRow(
  app: {
    id: string;
    roleId: string;
    status: string;
    createdAt: Date;
    notes?: string | null;
    role: {
      characterName: string;
      project: { title: string; productionCompany: string };
    };
    submissionItems?: {
      label: string;
      fileName: string;
      fileUrl: string | null;
      fileType: string | null;
    }[];
  },
): Application {
  const items = app.submissionItems?.map((item) => ({
    label: item.label,
    fileName: item.fileName,
    type: (item.fileType as RoleSubmissionItem["type"]) ?? "document",
    fileUrl: item.fileUrl ?? undefined,
  }));

  return {
    id: app.id,
    roleId: app.roleId,
    roleName: app.role.characterName,
    projectTitle: app.role.project.title,
    status: mapApplicationStatus(app.status),
    submittedAt: formatTimestamp(app.createdAt),
    productionCompany: app.role.project.productionCompany,
    note: app.notes ?? undefined,
    items: items?.length ? items : undefined,
  };
}

export async function getApplicationsForActor(actorId: string): Promise<Application[]> {
  const apps = await prisma.application.findMany({
    where: { actorId },
    orderBy: { createdAt: "desc" },
    include: {
      role: {
        include: { project: { select: { title: true, productionCompany: true } } },
      },
    },
  });
  return apps.map(mapApplicationRow);
}

export function mapRoleSubmission(
  app: {
    id: string;
    roleId: string;
    actorId: string;
    status: string;
    createdAt: Date;
    notes: string | null;
    bookingOfferSentAt?: Date | null;
    actor: { name: string | null };
    submissionItems: {
      label: string;
      fileName: string;
      fileType: string | null;
      fileUrl: string | null;
    }[];
  },
): RoleSubmission {
  const items: RoleSubmissionItem[] = app.submissionItems.map((item) => ({
    label: item.label,
    fileName: item.fileName,
    type: (item.fileType as RoleSubmissionItem["type"]) ?? "document",
    fileUrl: item.fileUrl ?? undefined,
  }));

  const headshotUrl = items.find((item) => item.type === "image" && item.fileUrl)?.fileUrl;

  return {
    id: app.id,
    roleId: app.roleId,
    actorId: app.actorId,
    actorName: app.actor.name ?? "Actor",
    actorInitials: getInitials(app.actor.name),
    actorPhotoUrl: headshotUrl,
    submittedAt: formatTimestamp(app.createdAt),
    status: mapApplicationStatus(app.status),
    items,
    note: app.notes ?? undefined,
    auditionRequested: false,
    bookingOfferSent: applicationHasBookingOfferSent(app),
  };
}

export async function getSubmissionsForRole(roleId: string): Promise<RoleSubmission[]> {
  const apps = await prisma.application.findMany({
    where: { roleId },
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: {
          name: true,
          actorProfile: {
            select: {
              unionStatus: true,
              playingAgeMin: true,
              playingAgeMax: true,
              profilePhotoUrl: true,
              headshots: {
                orderBy: { sortOrder: "asc" },
                select: { url: true, featured: true },
              },
            },
          },
        },
      },
      submissionItems: true,
    },
  });
  const actorIds = apps.map((app) => app.actorId);
  const auditionRequestedActorIds = new Set(
    (
      await prisma.audition.findMany({
        where: { roleId, actorId: { in: actorIds } },
        select: { actorId: true },
      })
    ).map((audition) => audition.actorId),
  );

  return apps.map((app) => {
    const submission = mapRoleSubmission(app);
    const profile = app.actor.actorProfile;
    const profilePhotoUrl = resolveProfilePhotoUrl(profile);
    return {
      ...submission,
      actorPhotoUrl: profilePhotoUrl ?? submission.actorPhotoUrl,
      unionStatus: profile?.unionStatus ?? undefined,
      playingAge: formatPlayingAge(profile?.playingAgeMin, profile?.playingAgeMax),
      auditionRequested: auditionRequestedActorIds.has(app.actorId),
      bookingOfferSent: applicationHasBookingOfferSent(app),
    };
  });
}

export async function getApplicationForActorRole(
  actorId: string,
  roleId: string,
): Promise<Application | null> {
  const app = await prisma.application.findUnique({
    where: { roleId_actorId: { roleId, actorId } },
    include: {
      submissionItems: true,
      role: {
        include: { project: { select: { title: true, productionCompany: true } } },
      },
    },
  });
  return app ? mapApplicationRow(app) : null;
}

export async function getAppliedRoleIdsForActor(
  actorId: string,
  roleIds?: string[],
): Promise<string[]> {
  const applications = await prisma.application.findMany({
    where: {
      actorId,
      ...(roleIds?.length ? { roleId: { in: roleIds } } : {}),
    },
    select: { roleId: true },
  });
  return applications.map((application) => application.roleId);
}

export async function getAuditionRoleIdsForActor(
  actorId: string,
  roleIds?: string[],
): Promise<string[]> {
  const auditions = await prisma.audition.findMany({
    where: {
      actorId,
      ...(roleIds?.length ? { roleId: { in: roleIds } } : {}),
    },
    select: { roleId: true },
  });
  return auditions.map((audition) => audition.roleId);
}

export async function actorHasAuditionForRole(
  actorId: string,
  roleId: string,
): Promise<boolean> {
  const audition = await prisma.audition.findFirst({
    where: { actorId, roleId },
    select: { id: true },
  });
  return audition != null;
}

export async function markApplicationReviewedIfNeeded(
  applicationId: string,
  castingUserId: string,
): Promise<void> {
  const existing = await prisma.application.findFirst({
    where: {
      id: applicationId,
      role: { project: { createdById: castingUserId } },
    },
  });
  if (!existing) return;

  if (existing.status !== "SUBMITTED" && existing.status !== "AUDITION_VIEWED") {
    return;
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { status: "REVIEWING" },
  });
}

const auditionProjectSelect = {
  title: true,
  location: true,
  shootDates: true,
  submissionDeadline: true,
};

export function mapAuditionRow(
  audition: {
    id: string;
    roleId: string;
    actorId: string;
    status: string;
    deadline: Date | null;
    location: string | null;
    instructions: string | null;
    scenes: string[];
    uploadRequirements: string[];
    requestedAt: Date;
    role: {
      characterName: string;
      projectId: string;
      auditionFiles?: unknown;
      project: {
        title: string;
        location?: string | null;
        shootDates?: string | null;
        submissionDeadline?: Date | null;
      };
    };
    actor: {
      name: string | null;
      actorProfile?: {
        profilePhotoUrl: string | null;
        headshots: { url: string | null; featured: boolean }[];
      } | null;
    };
    casting: { name: string | null };
    submissionItems: {
      label: string;
      fileName: string;
      fileUrl: string | null;
      createdAt: Date;
    }[];
  },
): Audition {
  let submission: AuditionSubmission | undefined;
  if (audition.submissionItems.length > 0) {
    const latestItemAt = audition.submissionItems.reduce(
      (latest, item) =>
        item.createdAt > latest ? item.createdAt : latest,
      audition.submissionItems[0].createdAt,
    );
    submission = {
      submittedAt: formatTimestamp(latestItemAt),
      items: audition.submissionItems.map((item) => ({
        label: item.label,
        fileName: item.fileName,
        fileUrl: item.fileUrl ?? undefined,
      })),
    };
  }

  const actorPhotoUrl = resolveProfilePhotoUrl(audition.actor.actorProfile);

  return {
    id: audition.id,
    roleId: audition.roleId,
    projectId: audition.role.projectId,
    actorId: audition.actorId,
    actorName: audition.actor.name ?? "Actor",
    actorInitials: getInitials(audition.actor.name),
    actorPhotoUrl,
    roleName: audition.role.characterName,
    projectTitle: audition.role.project.title,
    shootDates: audition.role.project.shootDates ?? "",
    projectLocation: audition.role.project.location ?? "",
    submissionDeadline: formatDateOnly(audition.role.project.submissionDeadline),
    status: mapAuditionStatus(audition.status),
    deadline: formatDateOnly(audition.deadline),
    location: audition.location ?? "",
    castingDirector: audition.casting.name ?? "Casting Director",
    requestedAt: formatTimestamp(audition.requestedAt),
    instructions: audition.instructions ?? "",
    scenes: audition.scenes,
    uploadRequirements: audition.uploadRequirements,
    materials: parseRoleAuditionFiles(audition.role.auditionFiles),
    submission,
  };
}

const auditionActorSelect = {
  name: true,
  actorProfile: {
    select: {
      profilePhotoUrl: true,
      headshots: {
        orderBy: { sortOrder: "asc" as const },
        select: { url: true, featured: true },
      },
    },
  },
};

export async function getAuditionsForActor(actorId: string): Promise<Audition[]> {
  await syncAuditionsFromApplications(actorId);

  const auditions = await prisma.audition.findMany({
    where: { actorId },
    orderBy: { requestedAt: "desc" },
    include: {
      role: { include: { project: { select: auditionProjectSelect } } },
      actor: { select: auditionActorSelect },
      casting: { select: { name: true } },
      submissionItems: true,
    },
  });
  return auditions.map(mapAuditionRow);
}

export async function getAuditionsForCasting(castingId: string): Promise<Audition[]> {
  const auditions = await prisma.audition.findMany({
    where: { castingId },
    orderBy: { requestedAt: "desc" },
    include: {
      role: { include: { project: { select: auditionProjectSelect } } },
      actor: { select: auditionActorSelect },
      casting: { select: { name: true } },
      submissionItems: true,
    },
  });
  return auditions.map(mapAuditionRow);
}

export async function getAuditionById(id: string): Promise<Audition | null> {
  const audition = await prisma.audition.findUnique({
    where: { id },
    include: {
      role: { include: { project: { select: auditionProjectSelect } } },
      actor: { select: auditionActorSelect },
      casting: { select: { name: true } },
      submissionItems: true,
    },
  });
  return audition ? mapAuditionRow(audition) : null;
}

export function mapNotificationRow(
  n: {
    id: string;
    category: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
  },
): Notification {
  return {
    id: n.id,
    category: mapNotificationCategory(n.category) as Notification["category"],
    title: n.title,
    message: n.message,
    timestamp: formatTimestamp(n.createdAt),
    read: n.read,
  };
}

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map(mapNotificationRow);
}

export async function getActorMembership(userId: string) {
  const profile = await prisma.actorProfile.findUnique({
    where: { userId },
    select: { membership: true, trialStartedAt: true, trialEndsAt: true },
  });

  if (!profile) return { membership: "Free", isPremium: false };

  const isPremium = isPremiumActive(profile.membership, profile.trialEndsAt);
  return {
    membership: membershipLabel(profile.membership, profile.trialEndsAt),
    isPremium,
    trialEndsAt: profile.trialEndsAt?.toISOString() ?? null,
  };
}

export type ActorDashboardStats = {
  applicationsSubmitted: number;
  applicationsChange: number;
  auditionsReceived: number;
  auditionsChange: number;
  callbackRate: number;
  callbackChange: number;
  profileViews: number;
  profileViewsChange: number;
};

/** Matches actor submissions list: role applications + active audition requests. */
async function countActorSubmissionsForRange(
  actorId: string,
  range: DateRange,
): Promise<number> {
  const dateFilter = prismaCreatedAtRange(range);

  const activeAuditionRoleIds = await prisma.audition.findMany({
    where: {
      actorId,
      status: { in: ["REQUESTED", "SUBMITTED"] },
    },
    select: { roleId: true },
  });

  const activeRoleIds = new Set(activeAuditionRoleIds.map((audition) => audition.roleId));

  const applicationsInRange = await prisma.application.findMany({
    where: {
      actorId,
      createdAt: dateFilter,
    },
    select: { roleId: true, status: true },
  });

  const applicationCount = applicationsInRange.filter(
    (application) =>
      application.status !== "AUDITION_REQUESTED" ||
      !activeRoleIds.has(application.roleId),
  ).length;

  const auditionCount = await prisma.audition.count({
    where: {
      actorId,
      status: { in: ["REQUESTED", "SUBMITTED"] },
      requestedAt: dateFilter,
    },
  });

  return applicationCount + auditionCount;
}

export async function getActorDashboardStats(
  actorId: string,
  monthKey?: string | null,
): Promise<ActorDashboardStats> {
  const now = new Date();
  const effectiveKey =
    monthKey ?? formatMonthKey(now.getFullYear(), now.getMonth());
  const selectedMonth = parseMonthKey(effectiveKey) ?? now;
  const currentMonth = getMonthRangeForKey(effectiveKey, now);
  const previousMonth = getPreviousMonthRangeFor(selectedMonth);

  const [
    submissionsThisMonth,
    submissionsLastMonth,
    auditionsThisMonth,
    auditionsLastMonth,
    profileViewsThisMonth,
    profileViewsLastMonth,
  ] = await Promise.all([
    countActorSubmissionsForRange(actorId, currentMonth),
    countActorSubmissionsForRange(actorId, previousMonth),
    prisma.audition.count({
      where: {
        actorId,
        requestedAt: prismaCreatedAtRange(currentMonth),
      },
    }),
    prisma.audition.count({
      where: {
        actorId,
        requestedAt: prismaCreatedAtRange(previousMonth),
      },
    }),
    prisma.profileView.count({
      where: {
        actorUserId: actorId,
        createdAt: prismaCreatedAtRange(currentMonth),
      },
    }),
    prisma.profileView.count({
      where: {
        actorUserId: actorId,
        createdAt: prismaCreatedAtRange(previousMonth),
      },
    }),
  ]);

  const auditionRateThisMonth =
    submissionsThisMonth > 0
      ? Math.round((auditionsThisMonth / submissionsThisMonth) * 100)
      : 0;
  const auditionRateLastMonth =
    submissionsLastMonth > 0
      ? Math.round((auditionsLastMonth / submissionsLastMonth) * 100)
      : 0;

  return {
    applicationsSubmitted: submissionsThisMonth,
    applicationsChange: percentChange(
      submissionsThisMonth,
      submissionsLastMonth,
    ),
    auditionsReceived: auditionsThisMonth,
    auditionsChange: percentChange(auditionsThisMonth, auditionsLastMonth),
    callbackRate: auditionRateThisMonth,
    callbackChange: percentChange(auditionRateThisMonth, auditionRateLastMonth),
    profileViews: profileViewsThisMonth,
    profileViewsChange: percentChange(
      profileViewsThisMonth,
      profileViewsLastMonth,
    ),
  };
}

export async function getCastingDashboardStats(castingId: string) {
  const { stats } = await getCastingDashboardData(castingId);
  return stats;
}

export async function getCastingProjectPerformance(castingId: string) {
  const { projectPerformance } = await getCastingDashboardData(castingId);
  return projectPerformance;
}

/** Single round-trip for casting home — stats + performance table share one query. */
export const getCastingDashboardData = cache(async function getCastingDashboardData(
  castingId: string,
) {
  await repairLegacyClosedProjectStatuses();
  await syncAllProjectLifecycleStatuses();

  const projects = await prisma.project.findMany({
    where: { createdById: castingId },
    orderBy: { updatedAt: "desc" },
    include: {
      roles: {
        include: {
          applications: { select: { id: true, status: true, actorId: true } },
          auditions: { select: { status: true, actorId: true } },
        },
      },
    },
  });

  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const openRoles = projects
    .filter((p) => p.status === "ACTIVE")
    .reduce((sum, p) => sum + countRolesAcceptingApplications(p), 0);
  const totalSubmissions = projects.reduce(
    (sum, p) =>
      sum + p.roles.reduce((roleSum, r) => roleSum + r.applications.length, 0),
    0,
  );

  const submissionsToday = await prisma.application.count({
    where: {
      createdAt: prismaCreatedAtRange(getTodayRange()),
      role: { project: { createdById: castingId } },
    },
  });

  const stats = {
    activeProjects,
    openRoles,
    totalSubmissions,
    submissionsToday,
    hiredThisMonth: 0,
    avgResponseTime: "—",
  };

  const projectPerformance = projects.map((project) => {
    const roleCount = project.roles.length;
    const openRoleCount = countRolesAcceptingApplications(project);
    const submissions = project.roles.reduce(
      (sum, role) => sum + role.applications.length,
      0,
    );
    const reviewed = project.roles.reduce(
      (sum, role) =>
        sum + countReviewedSubmissions(role.applications, role.auditions),
      0,
    );
    const auditions = project.roles.reduce(
      (sum, role) => sum + countAwaitingActorAuditionResponse(role.auditions),
      0,
    );
    const pendingAuditionReview = project.roles.reduce(
      (sum, role) =>
        sum +
        countPendingAuditionReviews(role.auditions, role.applications),
      0,
    );
    const rolesBooked = project.roles.filter(
      (role) =>
        role.applications.some((app) => app.status === "ACCEPTED") ||
        role.auditions.some((audition) => audition.status === "ACCEPTED"),
    ).length;
    const deadline = formatDateOnly(project.submissionDeadline);
    const status = mapProjectStatus(project.status);

    const performanceScore = computeProjectHealthScore({
      submissions,
      reviewed,
      auditions,
      pendingAuditionReview,
      roleCount,
      openRoles: openRoleCount,
      rolesBooked,
      deadline,
      status,
    });

    return {
      id: project.id,
      title: project.title,
      roles: roleCount,
      submissions,
      reviewed,
      auditions,
      pendingAuditionReview,
      rolesBooked,
      status,
      deadline,
      performanceScore,
      openRoles: openRoleCount,
    };
  });

  return { stats, projectPerformance };
});
