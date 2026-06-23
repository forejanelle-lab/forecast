import {
  formatPlayingAge,
  getInitials,
  mapMediaType,
  membershipLabel,
  resolveProfilePhotoUrl,
} from "@/lib/prisma-mappers";
import { formatFullName } from "@/lib/user";
import {
  getMissingActorProfileFields,
  isActorProfileComplete,
} from "@/lib/actor-profile-completeness";
import { ACTOR_MAX_HEADSHOTS, ACTOR_MAX_MEDIA } from "@/lib/actor-options";
import { prisma } from "@/lib/prisma";
import type {
  ActorCredit,
  ActorHeadshot,
  ActorLink,
  ActorMediaItem,
  CastingActorProfile,
  SearchableCastingActor,
} from "@/types";

const actorProfileInclude = {
  user: { select: { id: true, name: true, firstName: true, lastName: true } },
  credits: { orderBy: { year: "desc" as const } },
  headshots: { orderBy: { sortOrder: "asc" as const } },
  media: { orderBy: { sortOrder: "asc" as const } },
  links: { orderBy: { sortOrder: "asc" as const } },
};

function mapActorProfile(
  profile: {
    id: string;
    bio: string | null;
    location: string | null;
    locations: string[];
    height: string | null;
    gender: string | null;
    unionStatus: string | null;
    membership: string;
    trialEndsAt: Date | null;
    featured: boolean;
    verified: boolean;
    playingAgeMin: number | null;
    playingAgeMax: number | null;
    skills: string[];
    languages: string[];
    profilePhotoUrl: string | null;
    demoReelUrl: string | null;
    user: {
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
    };
    credits: { id: string; title: string; role: string; type: string; year: number }[];
    headshots: {
      id: string;
      label: string;
      url: string | null;
      fileName: string | null;
      featured: boolean;
    }[];
    media: {
      id: string;
      label: string;
      type: string;
      url: string | null;
      fileName: string | null;
      duration: string | null;
    }[];
    links: { id: string; label: string; url: string }[];
  },
): CastingActorProfile {
  const name =
    formatFullName(
      profile.user.firstName,
      profile.user.lastName,
      profile.user.name,
    ) || "Actor";
  const initials = getInitials(name);
  const location =
    profile.location?.trim() ||
    profile.locations.filter(Boolean).join(", ") ||
    "";

  const headshots: ActorHeadshot[] = profile.headshots.map((h) => ({
    id: h.id,
    label: h.label,
    initials,
    featured: h.featured,
    previewUrl: h.url ?? undefined,
    fileName: h.fileName ?? undefined,
  }));

  const photoUrl = resolveProfilePhotoUrl(profile);

  const media: ActorMediaItem[] = profile.media.map((m) => ({
    id: m.id,
    label: m.label,
    type: mapMediaType(m.type),
    duration: m.duration ?? undefined,
    previewUrl: m.url ?? undefined,
    fileName: m.fileName ?? undefined,
  }));

  const credits: ActorCredit[] = profile.credits.map((c) => ({
    id: c.id,
    title: c.title,
    role: c.role,
    type: c.type,
    year: String(c.year),
  }));

  const links: ActorLink[] = profile.links.map((l) => ({
    id: l.id,
    label: l.label,
    url: l.url,
  }));

  return {
    id: profile.user.id,
    name,
    headshot: initials,
    playingAge: formatPlayingAge(profile.playingAgeMin, profile.playingAgeMax),
    playingAgeMin: profile.playingAgeMin,
    playingAgeMax: profile.playingAgeMax,
    location,
    unionStatus: profile.unionStatus ?? "",
    height: profile.height ?? "",
    skills: profile.skills,
    featured: profile.featured,
    verified: profile.verified,
    bio: profile.bio ?? "",
    photoUrl,
    gender: profile.gender ?? undefined,
    membership: membershipLabel(profile.membership, profile.trialEndsAt),
    languages: profile.languages,
    credits,
    links,
    headshots,
    media,
  };
}

export async function getActiveActorAccountCount(): Promise<number> {
  return prisma.user.count({ where: { role: "ACTOR" } });
}

export async function getActorProfileCompleteness(userId: string) {
  const profile = await prisma.actorProfile.findUnique({
    where: { userId },
    include: {
      credits: { select: { id: true } },
      headshots: { select: { id: true } },
      media: { select: { id: true } },
    },
  });

  if (!profile) {
    return {
      complete: false,
      missingFields: getMissingActorProfileFields({
        hasProfilePhoto: false,
      }),
    };
  }

  const input = {
    bio: profile.bio,
    location: profile.location,
    playingAgeMin: profile.playingAgeMin,
    playingAgeMax: profile.playingAgeMax,
    height: profile.height,
    unionStatus: profile.unionStatus,
    skills: profile.skills,
    languages: profile.languages,
    credits: profile.credits,
    headshots: profile.headshots,
    media: profile.media,
    hasProfilePhoto: Boolean(
      profile.profilePhotoUrl || profile.headshots.length > 0,
    ),
  };

  const missingFields = getMissingActorProfileFields(input);

  return {
    complete: isActorProfileComplete(input),
    missingFields,
  };
}

export async function getActorProfileByUserId(userId: string): Promise<SearchableCastingActor | null> {
  const profile = await prisma.actorProfile.findUnique({
    where: { userId },
    include: actorProfileInclude,
  });

  if (!profile) return null;

  const viewCount = await prisma.profileView.count({
    where: { actorUserId: userId },
  });

  const mapped = mapActorProfile(profile);
  return {
    ...mapped,
    castingProfileViews: viewCount,
    popular: viewCount >= 10 || profile.featured,
  };
}

export async function searchActors(query?: string): Promise<SearchableCastingActor[]> {
  const profiles = await prisma.actorProfile.findMany({
    where: {
      onboardingComplete: true,
      ...(query?.trim()
        ? {
            OR: [
              { user: { name: { contains: query.trim(), mode: "insensitive" } } },
              { location: { contains: query.trim(), mode: "insensitive" } },
              { skills: { has: query.trim() } },
            ],
          }
        : {}),
    },
    include: actorProfileInclude,
    take: 50,
    orderBy: { updatedAt: "desc" },
  });

  const userIds = profiles.map((p) => p.user.id);
  const viewCounts = await prisma.profileView.groupBy({
    by: ["actorUserId"],
    where: { actorUserId: { in: userIds } },
    _count: { id: true },
  });

  const viewMap = new Map(
    viewCounts.map((v) => [v.actorUserId, v._count.id]),
  );

  return profiles.map((profile) => {
    const views = viewMap.get(profile.user.id) ?? 0;
    const mapped = mapActorProfile(profile);
    return {
      ...mapped,
      castingProfileViews: views,
      popular: views >= 10 || profile.featured,
    };
  });
}

export async function recordProfileView(actorUserId: string, viewerUserId?: string) {
  await prisma.profileView.create({
    data: {
      actorUserId,
      viewerUserId: viewerUserId ?? null,
    },
  });
}

export async function updateActorProfile(
  userId: string,
  data: {
    bio?: string;
    location?: string;
    locations?: string[];
    height?: string;
    gender?: string;
    playingAgeMin?: number | null;
    playingAgeMax?: number | null;
    unionStatus?: string;
    skills?: string[];
    languages?: string[];
    profilePhotoUrl?: string | null;
  },
) {
  const location =
    data.location ?? (data.locations?.length ? data.locations[0] : undefined);

  return prisma.actorProfile.update({
    where: { userId },
    data: {
      ...data,
      ...(location !== undefined && { location }),
    },
    include: actorProfileInclude,
  });
}

function toPrismaMediaType(type?: string): "VIDEO" | "AUDIO" | "DOCUMENT" {
  const upper = type?.toUpperCase() ?? "";
  if (upper === "AUDIO") return "AUDIO";
  if (upper === "DOCUMENT") return "DOCUMENT";
  return "VIDEO";
}

export async function updateCastingProfile(
  userId: string,
  data: {
    officeName?: string;
    company?: string;
    phoneNumber?: string;
    address?: string;
    profilePhotoUrl?: string | null;
  },
) {
  return prisma.castingProfile.update({
    where: { userId },
    data,
  });
}

export async function getCastingProfile(userId: string) {
  return prisma.castingProfile.findUnique({ where: { userId } });
}

export async function persistActorOnboardingProfile(
  userId: string,
  data: {
    bio?: string;
    locations?: string[];
    playingAgeMin?: number | null;
    playingAgeMax?: number | null;
    height?: string;
    gender?: string;
    unionStatus?: string;
    skills?: string[];
    languages?: string[];
    profilePhotoUrl?: string | null;
    headshots?: { label: string; url?: string; fileName?: string; featured?: boolean }[];
    videos?: { label: string; url?: string; fileName?: string }[];
    materials?: {
      label: string;
      type?: string;
      url?: string;
      fileName?: string;
    }[];
    credits?: { title: string; role: string; type: string; year: number }[];
    links?: { label: string; url: string }[];
  },
) {
  const profile = await prisma.actorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Actor profile not found");

  const locations = data.locations ?? [];
  const location = locations[0] ?? undefined;

  await prisma.actorProfile.update({
    where: { userId },
    data: {
      bio: data.bio,
      locations,
      location,
      playingAgeMin: data.playingAgeMin,
      playingAgeMax: data.playingAgeMax,
      height: data.height,
      gender: data.gender,
      unionStatus: data.unionStatus,
      skills: data.skills ?? [],
      languages: data.languages ?? [],
      profilePhotoUrl: data.profilePhotoUrl,
    },
  });

  if (data.headshots !== undefined) {
    await prisma.actorHeadshot.deleteMany({ where: { actorId: profile.id } });
    const headshots = data.headshots.slice(0, ACTOR_MAX_HEADSHOTS);
    if (headshots.length > 0) {
      await prisma.actorHeadshot.createMany({
        data: headshots.map((h, index) => ({
          actorId: profile.id,
          label: h.label,
          url: h.url,
          fileName: h.fileName,
          featured: h.featured ?? index === 0,
          sortOrder: index,
        })),
      });
    }
  }

  const mediaItems = [
    ...(data.videos ?? []).map((v) => ({ ...v, kind: "video" as const })),
    ...(data.materials ?? []).map((m) => ({ ...m, kind: "material" as const })),
  ].slice(0, ACTOR_MAX_MEDIA);

  if (data.videos !== undefined || data.materials !== undefined) {
    await prisma.actorMedia.deleteMany({ where: { actorId: profile.id } });
    if (mediaItems.length > 0) {
      await prisma.actorMedia.createMany({
        data: mediaItems.map((item, index) => {
          if (item.kind === "video") {
            return {
              actorId: profile.id,
              label: item.label,
              type: "VIDEO",
              category: "VIDEO",
              url: item.url,
              fileName: item.fileName,
              sortOrder: index,
            };
          }
          return {
            actorId: profile.id,
            label: item.label,
            type: toPrismaMediaType(item.type),
            category: "MATERIAL",
            url: item.url,
            fileName: item.fileName,
            sortOrder: index,
          };
        }),
      });
    }

    await prisma.actorProfile.update({
      where: { userId },
      data: { demoReelUrl: null },
    });
  }

  if (data.credits) {
    await prisma.credit.deleteMany({ where: { actorId: profile.id } });
    if (data.credits.length > 0) {
      await prisma.credit.createMany({
        data: data.credits.map((credit) => ({
          actorId: profile.id,
          title: credit.title,
          role: credit.role,
          type: credit.type,
          year: credit.year,
        })),
      });
    }
  }

  if (data.links) {
    await prisma.actorLink.deleteMany({ where: { actorId: profile.id } });
    if (data.links.length > 0) {
      await prisma.actorLink.createMany({
        data: data.links.map((link, index) => ({
          actorId: profile.id,
          label: link.label,
          url: link.url,
          sortOrder: index,
        })),
      });
    }
  }
}

export async function persistCastingOnboardingProfile(
  userId: string,
  data: {
    officeName?: string;
    phoneNumber?: string;
    address?: string;
    profilePhotoUrl?: string | null;
  },
) {
  return prisma.castingProfile.update({
    where: { userId },
    data: {
      officeName: data.officeName,
      company: data.officeName,
      phoneNumber: data.phoneNumber,
      address: data.address,
      profilePhotoUrl: data.profilePhotoUrl,
    },
  });
}
