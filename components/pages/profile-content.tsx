"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShareProfileModal } from "@/components/actor/share-profile-modal";
import { MultiSelect } from "@/components/ui/multi-select";
import { PreviewImage } from "@/components/ui/preview-image";
import { useActorProfile } from "@/components/providers/actor-profile-provider";
import {
  actorHeadshotsToStored,
  actorMediaToStored,
  buildProfileStateFromSettings,
  formatPlayingAge,
  hasStoredActorSettings,
  readStoredActorSettings,
  writeStoredActorSettings,
} from "@/lib/actor-settings-storage";
import { ACTOR_GENDER_OPTIONS, ACTOR_LANGUAGE_OPTIONS, ACTOR_MAX_HEADSHOTS, ACTOR_MAX_MEDIA, ACTOR_SKILL_OPTIONS, ACTOR_UNION_STATUS_OPTIONS } from "@/lib/actor-options";
import { getActorMembershipLabel } from "@/lib/actor-trial-storage";
import { emitClientStoreChange } from "@/lib/client-store-subscribe";
import type {
  ActorCredit,
  ActorHeadshot,
  ActorLink,
  ActorMediaItem,
} from "@/types";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Film,
  Globe,
  MapPin,
  Mic,
  Pencil,
  Plus,
  Trash2,
  Upload,
  User,
  Clapperboard,
  Ruler,
} from "lucide-react";
import { useRef, useState } from "react";

type SectionId =
  | "profile"
  | "credits"
  | "skills"
  | "languages"
  | "links"
  | "headshots"
  | "media";

interface ProfileState {
  name: string;
  location: string;
  playingAgeMin: string;
  playingAgeMax: string;
  height: string;
  gender: string;
  unionStatus: string;
  bio: string;
  membership: string;
  initials: string;
  credits: ActorCredit[];
  skills: string[];
  languages: string[];
  links: ActorLink[];
  headshots: ActorHeadshot[];
  media: ActorMediaItem[];
}

export interface ProfileInitialData {
  location: string;
  playingAgeMin: string;
  playingAgeMax: string;
  height: string;
  gender: string;
  unionStatus: string;
  bio: string;
  membership: string;
  credits: ActorCredit[];
  skills: string[];
  languages: string[];
  links: ActorLink[];
  headshots: ActorHeadshot[];
  media: ActorMediaItem[];
}

const emptyProfileFields = {
  location: "",
  playingAgeMin: "",
  playingAgeMax: "",
  height: "",
  gender: "",
  unionStatus: "",
  bio: "",
  membership: "Free",
  credits: [] as ActorCredit[],
  skills: [] as string[],
  languages: [] as string[],
  links: [] as ActorLink[],
  headshots: [] as ActorHeadshot[],
  media: [] as ActorMediaItem[],
};

function buildInitialProfileState(
  displayName: string,
  initials: string,
  initialProfile?: ProfileInitialData | null,
): ProfileState {
  if (hasStoredActorSettings()) {
    const settings = readStoredActorSettings();
    const built = buildProfileStateFromSettings(displayName, initials, settings);
    return {
      name: displayName,
      location: built.location || initialProfile?.location || "",
      playingAgeMin:
        settings.playingAgeMin || initialProfile?.playingAgeMin || "",
      playingAgeMax:
        settings.playingAgeMax || initialProfile?.playingAgeMax || "",
      height: built.height || initialProfile?.height || "",
      gender: settings.gender || initialProfile?.gender || "",
      bio: built.bio || initialProfile?.bio || "",
      unionStatus: settings.unionStatus || initialProfile?.unionStatus || "",
      membership: initialProfile?.membership ?? getActorMembershipLabel(),
      initials: initials.slice(0, 2).toUpperCase(),
      credits: initialProfile?.credits ?? [],
      skills: built.skills,
      languages: built.languages,
      links: initialProfile?.links ?? [],
      headshots: built.headshots,
      media: built.media,
    };
  }

  if (initialProfile) {
    return {
      name: displayName,
      initials: initials.slice(0, 2).toUpperCase(),
      ...initialProfile,
    };
  }

  return {
    name: displayName,
    initials: initials.slice(0, 2).toUpperCase(),
    ...emptyProfileFields,
  };
}

function stripPersistableUrl(url?: string | null): string | undefined {
  if (!url || url.startsWith("blob:")) return undefined;
  return url;
}

function buildProfilePatchBody(
  section: SectionId,
  draft: ProfileState,
  profilePhotoUrl: string | null,
): Record<string, unknown> {
  const locations = draft.location
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const storedHeadshots = actorHeadshotsToStored(draft.headshots);
  const { materials, videos } = actorMediaToStored(draft.media);
  const photoUrl = stripPersistableUrl(profilePhotoUrl);

  switch (section) {
    case "profile":
      return {
        bio: draft.bio,
        locations,
        location: locations[0] ?? draft.location,
        height: draft.height,
        gender: draft.gender,
        unionStatus: draft.unionStatus,
        playingAgeMin: draft.playingAgeMin ? Number(draft.playingAgeMin) : null,
        playingAgeMax: draft.playingAgeMax ? Number(draft.playingAgeMax) : null,
        ...(photoUrl !== undefined && { profilePhotoUrl: photoUrl }),
      };
    case "skills":
      return { skills: draft.skills };
    case "languages":
      return { languages: draft.languages };
    case "credits":
      return {
        credits: draft.credits.map((credit) => ({
          title: credit.title,
          role: credit.role,
          type: credit.type,
          year: Number(credit.year) || new Date().getFullYear(),
        })),
      };
    case "links":
      return {
        links: draft.links.map((link) => ({
          label: link.label,
          url: link.url,
        })),
      };
    case "headshots":
      return {
        headshots: storedHeadshots.map((h) => ({
          label: h.label,
          url: stripPersistableUrl(h.previewUrl),
          fileName: h.fileName,
          featured: h.featured,
        })),
      };
    case "media":
      return {
        videos: videos.map((v) => ({
          label: v.label,
          url: stripPersistableUrl(v.previewUrl),
          fileName: v.fileName,
        })),
        materials: materials.map((m) => ({
          label: m.label,
          url: stripPersistableUrl(m.previewUrl),
          fileName: m.fileName,
          type: m.type,
        })),
      };
    default:
      return {};
  }
}

function mapApiProfileToState(
  profile: {
    location: string;
    playingAgeMin?: number | null;
    playingAgeMax?: number | null;
    height?: string;
    gender?: string;
    unionStatus: string;
    bio: string;
    skills: string[];
    languages: string[];
    credits: ActorCredit[];
    links: ActorLink[];
    headshots: ActorHeadshot[];
    media: ActorMediaItem[];
  },
  displayName: string,
  initials: string,
  membership: string,
): ProfileState {
  return {
    name: displayName,
    location: profile.location,
    playingAgeMin:
      profile.playingAgeMin != null ? String(profile.playingAgeMin) : "",
    playingAgeMax:
      profile.playingAgeMax != null ? String(profile.playingAgeMax) : "",
    height: profile.height ?? "",
    gender: profile.gender ?? "",
    unionStatus: profile.unionStatus,
    bio: profile.bio,
    membership,
    initials: initials.slice(0, 2).toUpperCase(),
    skills: profile.skills,
    languages: profile.languages,
    credits: profile.credits,
    links: profile.links,
    headshots: profile.headshots,
    media: profile.media,
  };
}

const inputClass =
  "w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50";

const labelClass = "text-[10px] font-medium text-text-secondary mb-1 block";

function revokePreviewUrl(url?: string) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

function defaultLabelFromFile(file: File): string {
  return file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") || "Untitled";
}

function inferMediaType(file: File): ActorMediaItem["type"] {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

function ProfileAvatar({
  initials,
  photoUrl,
  onClick,
  size = "md",
}: {
  initials: string;
  photoUrl?: string | null;
  onClick?: () => void;
  size?: "md" | "lg";
}) {
  const isLarge = size === "lg";
  const boxClass = isLarge
    ? "h-32 w-32 rounded-[20px]"
    : "h-14 w-14 rounded-xl";
  const imageSize = isLarge ? 128 : 56;
  const initialsClass = isLarge
    ? "text-4xl font-bold text-accent-hover"
    : "text-lg font-bold text-accent-hover";

  const content = photoUrl ? (
    <PreviewImage
      src={photoUrl}
      alt="Profile photo"
      width={imageSize}
      height={imageSize}
      className={cn(boxClass, "object-cover")}
    />
  ) : (
    <span className={initialsClass}>{initials}</span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group relative flex shrink-0 items-center justify-center overflow-hidden border border-border/60 bg-gradient-to-br from-accent/30 to-accent/10 hover:border-accent/50 transition-colors",
          boxClass,
        )}
        aria-label="Update profile photo"
      >
        {content}
        <span
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Upload className="h-4 w-4 text-white" />
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-accent/30 to-accent/10",
        boxClass,
      )}
    >
      {content}
    </div>
  );
}

function HeadshotThumb({
  headshot,
  size = "sm",
  onClick,
}: {
  headshot: ActorHeadshot;
  size?: "sm" | "md";
  onClick?: () => void;
}) {
  const sizeClass = size === "sm" ? "h-8 w-8 rounded-lg" : "h-7 w-7 rounded-md";
  const content = headshot.previewUrl ? (
    <PreviewImage
      src={headshot.previewUrl}
      alt={headshot.label}
      width={size === "sm" ? 32 : 28}
      height={size === "sm" ? 32 : 28}
      className={cn(sizeClass, "object-cover")}
    />
  ) : (
    <span className="text-[10px] font-semibold text-accent">{headshot.initials}</span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          sizeClass,
          "shrink-0 flex items-center justify-center bg-bg-sidebar overflow-hidden border border-border/60 hover:border-accent/50 transition-colors",
        )}
        aria-label="Upload headshot"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        "shrink-0 flex items-center justify-center bg-bg-sidebar overflow-hidden",
      )}
    >
      {content}
    </div>
  );
}

function SectionHeader({
  title,
  editing,
  onEdit,
  onSave,
  onCancel,
}: {
  title: string;
  editing: boolean;
  onEdit?: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      {editing ? (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" className="h-7 px-3 text-xs" onClick={onSave}>
            Save
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={onEdit ?? (() => undefined)}
        >
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
      )}
    </div>
  );
}

export function ProfileContent({
  userId,
  initialProfile = null,
}: {
  userId: string;
  initialProfile?: ProfileInitialData | null;
}) {
  const {
    initials: profileInitials,
    displayName,
    profilePhotoUrl,
    profilePhotoFileName,
    setProfilePhotoFromFile,
    setDisplayName,
  } = useActorProfile();

  const [shareOpen, setShareOpen] = useState(false);
  const profileShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/casting/actors/${userId}`
      : `/casting/actors/${userId}`;

  const [data, setData] = useState<ProfileState>(() =>
    buildInitialProfileState(displayName, profileInitials, initialProfile),
  );

  const [editing, setEditing] = useState<SectionId | null>(null);
  const [draft, setDraft] = useState<ProfileState | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const headshotInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [headshotUploadTargetId, setHeadshotUploadTargetId] = useState<string | null>(
    null,
  );
  const [mediaUploadTargetId, setMediaUploadTargetId] = useState<string | null>(null);

  const openProfilePhotoUpload = () => {
    profilePhotoInputRef.current?.click();
  };

  const applyHeadshotFile = (file: File, targetId: string | null) => {
    const previewUrl = URL.createObjectURL(file);
    const label = defaultLabelFromFile(file);
    setDraft((prev) => {
      if (!prev) return prev;
      if (targetId) {
        const existing = prev.headshots.find((h) => h.id === targetId);
        revokePreviewUrl(existing?.previewUrl);
        return {
          ...prev,
          headshots: prev.headshots.map((h) =>
            h.id === targetId
              ? {
                  ...h,
                  previewUrl,
                  fileName: file.name,
                  label: h.label.trim() ? h.label : label,
                }
              : h,
          ),
        };
      }
      if (prev.headshots.length >= ACTOR_MAX_HEADSHOTS) return prev;
      return {
        ...prev,
        headshots: [
          ...prev.headshots,
          {
            id: crypto.randomUUID(),
            label,
            initials: profileInitials.slice(0, 2).toUpperCase(),
            previewUrl,
            fileName: file.name,
          },
        ],
      };
    });
  };

  const applyMediaFile = (file: File, targetId: string | null) => {
    const previewUrl = URL.createObjectURL(file);
    const label = defaultLabelFromFile(file);
    const type = inferMediaType(file);
    setDraft((prev) => {
      if (!prev) return prev;
      if (targetId) {
        const existing = prev.media.find((m) => m.id === targetId);
        revokePreviewUrl(existing?.previewUrl);
        return {
          ...prev,
          media: prev.media.map((m) =>
            m.id === targetId
              ? {
                  ...m,
                  previewUrl,
                  fileName: file.name,
                  type,
                  label: m.label.trim() ? m.label : label,
                }
              : m,
          ),
        };
      }
      if (prev.media.length >= ACTOR_MAX_MEDIA) return prev;
      return {
        ...prev,
        media: [
          ...prev.media,
          {
            id: crypto.randomUUID(),
            label,
            type,
            previewUrl,
            fileName: file.name,
          },
        ],
      };
    });
  };

  const openHeadshotUpload = (targetId: string | null) => {
    const count = (editing ? draft?.headshots : data.headshots)?.length ?? 0;
    if (!targetId && count >= ACTOR_MAX_HEADSHOTS) return;
    setHeadshotUploadTargetId(targetId);
    headshotInputRef.current?.click();
  };

  const openMediaUpload = (targetId: string | null) => {
    const count = (editing ? draft?.media : data.media)?.length ?? 0;
    if (!targetId && count >= ACTOR_MAX_MEDIA) return;
    setMediaUploadTargetId(targetId);
    mediaInputRef.current?.click();
  };

  const startEdit = (section: SectionId) => {
    setDraft(structuredClone(data));
    setEditing(section);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditing(null);
  };

  const saveEdit = async () => {
    if (!draft || !editing) {
      setEditing(null);
      return;
    }

    const section = editing;
    const payload = buildProfilePatchBody(section, draft, profilePhotoUrl);

    try {
      const response = await fetch("/api/actor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Failed to save actor profile:", await response.text());
        return;
      }

      const result = (await response.json()) as {
        profile?: {
          location: string;
          playingAgeMin?: number | null;
          playingAgeMax?: number | null;
          height?: string;
          unionStatus: string;
          bio: string;
          skills: string[];
          languages: string[];
          credits: ActorCredit[];
          links: ActorLink[];
          headshots: ActorHeadshot[];
          media: ActorMediaItem[];
        };
      };

      if (section === "profile") {
        setDisplayName(draft.name);
      }

      const nextData =
        result.profile
          ? mapApiProfileToState(
              result.profile,
              section === "profile" ? draft.name : displayName,
              profileInitials,
              data.membership,
            )
          : draft;

      setData(nextData);

      const locations = nextData.location
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const { materials, videos } = actorMediaToStored(nextData.media);
      const storedHeadshots = actorHeadshotsToStored(nextData.headshots);
      const existing = readStoredActorSettings();

      writeStoredActorSettings({
        ...existing,
        bio: nextData.bio,
        locations,
        playingAgeMin: nextData.playingAgeMin,
        playingAgeMax: nextData.playingAgeMax,
        height: nextData.height,
        gender: nextData.gender,
        unionStatus: nextData.unionStatus,
        skills: nextData.skills,
        languages: nextData.languages,
        headshots: storedHeadshots,
        materials,
        videos,
        profilePhotoUrl: profilePhotoUrl,
        profilePhotoFileName: profilePhotoFileName,
      });
      emitClientStoreChange();
    } catch (error) {
      console.error("Failed to save actor profile:", error);
      return;
    }

    setDraft(null);
    setEditing(null);
  };

  const d = editing ? draft! : data;

  return (
    <div className="space-y-2 animate-fade-in max-w-2xl">
      <input
        ref={profilePhotoInputRef}
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp,.heic"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setProfilePhotoFromFile(file);
          if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = "";
        }}
      />
      {editing === "profile" ? (
        <Card padding="sm" className="border-accent/10">
        <SectionHeader
          title="Profile"
          editing={true}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                initials={profileInitials}
                photoUrl={profilePhotoUrl}
                onClick={openProfilePhotoUpload}
              />
              <div className="min-w-0">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={openProfilePhotoUpload}
                >
                  <Upload className="h-3 w-3" />
                  Change photo
                </Button>
                {profilePhotoFileName && (
                  <p className="text-[10px] text-text-secondary mt-1 truncate max-w-[200px]">
                    {profilePhotoFileName}
                  </p>
                )}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="profile-name">Name</label>
                <input
                  id="profile-name"
                  className={inputClass}
                  value={d.name}
                  onChange={(e) =>
                    setDraft((prev) => prev && { ...prev, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-location">Location</label>
                <input
                  id="profile-location"
                  className={inputClass}
                  value={d.location}
                  onChange={(e) =>
                    setDraft((prev) => prev && { ...prev, location: e.target.value })
                  }
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-playing-age-min">
                  Playing age (min)
                </label>
                <input
                  id="profile-playing-age-min"
                  type="number"
                  min={1}
                  max={99}
                  className={inputClass}
                  value={d.playingAgeMin}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev && { ...prev, playingAgeMin: e.target.value },
                    )
                  }
                  placeholder="25"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-playing-age-max">
                  Playing age (max)
                </label>
                <input
                  id="profile-playing-age-max"
                  type="number"
                  min={1}
                  max={99}
                  className={inputClass}
                  value={d.playingAgeMax}
                  onChange={(e) =>
                    setDraft((prev) =>
                      prev && { ...prev, playingAgeMax: e.target.value },
                    )
                  }
                  placeholder="35"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-height">Height</label>
                <input
                  id="profile-height"
                  className={inputClass}
                  value={d.height}
                  onChange={(e) =>
                    setDraft((prev) => prev && { ...prev, height: e.target.value })
                  }
                  placeholder="5'10&quot;"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-gender">Gender</label>
                <select
                  id="profile-gender"
                  className={inputClass}
                  value={d.gender}
                  onChange={(e) =>
                    setDraft((prev) => prev && { ...prev, gender: e.target.value })
                  }
                >
                  <option value="">Select gender</option>
                  {d.gender &&
                    !ACTOR_GENDER_OPTIONS.includes(
                      d.gender as typeof ACTOR_GENDER_OPTIONS[number],
                    ) && (
                      <option value={d.gender}>{d.gender}</option>
                    )}
                  {ACTOR_GENDER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-union">Union status</label>
                <select
                  id="profile-union"
                  className={inputClass}
                  value={d.unionStatus}
                  onChange={(e) =>
                    setDraft((prev) => prev && { ...prev, unionStatus: e.target.value })
                  }
                >
                  <option value="">Select union status</option>
                  {d.unionStatus &&
                    !ACTOR_UNION_STATUS_OPTIONS.includes(d.unionStatus) && (
                      <option value={d.unionStatus}>{d.unionStatus}</option>
                    )}
                  {ACTOR_UNION_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="profile-bio">Bio</label>
              <textarea
                id="profile-bio"
                rows={3}
                className={cn(inputClass, "resize-none")}
                value={d.bio}
                onChange={(e) =>
                  setDraft((prev) => prev && { ...prev, bio: e.target.value })
                }
              />
            </div>
          </div>
        </Card>
      ) : (
          <section
            className="relative overflow-hidden rounded-2xl border border-border/60 bg-bg-secondary shadow-[var(--shadow-soft)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#fffefb_0%,#faf6ee_50%,#f5f0ff_100%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

            <div className="relative p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="shrink-0 mx-auto sm:mx-0">
                  <button
                    type="button"
                    onClick={openProfilePhotoUpload}
                    className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden ring-2 ring-white/80 shadow-md bg-bg-sidebar"
                  >
                    {profilePhotoUrl ? (
                      <PreviewImage
                        src={profilePhotoUrl}
                        alt={displayName}
                        width={128}
                        height={128}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/25 to-accent/5 text-2xl font-bold text-accent">
                        {profileInitials}
                      </div>
                    )}
                  </button>
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-accent/30 text-accent">
                      {data.membership}
                    </Badge>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                    {displayName}
                  </h1>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2">
                    {data.location && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-bg-sidebar/50 px-2 py-0.5 text-[11px] text-text-secondary">
                        <MapPin className="h-3 w-3 text-text-secondary/70" />
                        {data.location}
                      </span>
                    )}
                    {formatPlayingAge(data.playingAgeMin, data.playingAgeMax) && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-bg-sidebar/50 px-2 py-0.5 text-[11px] text-text-secondary">
                        <User className="h-3 w-3 text-text-secondary/70" />
                        {formatPlayingAge(data.playingAgeMin, data.playingAgeMax)}
                      </span>
                    )}
                    {data.unionStatus && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-bg-sidebar/50 px-2 py-0.5 text-[11px] text-text-secondary">
                        <Clapperboard className="h-3 w-3 text-text-secondary/70" />
                        {data.unionStatus}
                      </span>
                    )}
                    {data.height && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-bg-sidebar/50 px-2 py-0.5 text-[11px] text-text-secondary">
                        <Ruler className="h-3 w-3 text-text-secondary/70" />
                        {data.height}
                      </span>
                    )}
                    {data.gender && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-bg-sidebar/50 px-2 py-0.5 text-[11px] text-text-secondary">
                        <User className="h-3 w-3 text-text-secondary/70" />
                        {data.gender}
                      </span>
                    )}
                  </div>

                  {data.bio?.trim() && (
                    <p className="text-xs text-text-secondary leading-relaxed mt-3 line-clamp-3 max-w-2xl">
                      {data.bio}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-row sm:flex-col gap-2 justify-center sm:items-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setShareOpen(true)}
                  >
                    Share
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => startEdit("profile")}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </section>
      )}

      {editing !== "profile" && (
        <Card padding="sm" className="border-accent/10">
          <SectionHeader
            title="Headshots"
            editing={editing === "headshots"}
            onEdit={() => startEdit("headshots")}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
          <p className="text-[10px] text-text-secondary mb-2">
            {d.headshots.length}/{ACTOR_MAX_HEADSHOTS} max
          </p>
          {editing === "headshots" ? (
            <div className="space-y-2">
              <input
                ref={headshotInputRef}
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.webp,.heic"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) applyHeadshotFile(file, headshotUploadTargetId);
                  setHeadshotUploadTargetId(null);
                  if (headshotInputRef.current) headshotInputRef.current.value = "";
                }}
              />
              {d.headshots.map((headshot, index) => (
                <div key={headshot.id} className="flex gap-2 items-center">
                  <HeadshotThumb
                    headshot={headshot}
                    size="md"
                    onClick={() => openHeadshotUpload(headshot.id)}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <input
                      className={cn(inputClass, "text-xs")}
                      value={headshot.label}
                      onChange={(e) =>
                        setDraft((prev) => {
                          if (!prev) return prev;
                          const headshots = [...prev.headshots];
                          headshots[index] = {
                            ...headshots[index],
                            label: e.target.value,
                          };
                          return { ...prev, headshots };
                        })
                      }
                    />
                    {headshot.fileName && (
                      <p className="text-[10px] text-text-secondary truncate px-1">
                        {headshot.fileName}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-text-secondary hover:text-accent shrink-0"
                    onClick={() => openHeadshotUpload(headshot.id)}
                    aria-label="Replace headshot file"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="text-text-secondary hover:text-danger shrink-0"
                    onClick={() =>
                      setDraft((prev) => {
                        if (!prev) return prev;
                        revokePreviewUrl(headshot.previewUrl);
                        return {
                          ...prev,
                          headshots: prev.headshots.filter((h) => h.id !== headshot.id),
                        };
                      })
                    }
                    aria-label="Remove headshot"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {d.headshots.length < ACTOR_MAX_HEADSHOTS && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => openHeadshotUpload(null)}
                >
                  <Upload className="h-3 w-3" />
                  Upload headshot
                </Button>
              )}
            </div>
          ) : data.headshots.some((h) => h.previewUrl) ? (
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {data.headshots
                .filter((h) => h.previewUrl)
                .slice(0, ACTOR_MAX_HEADSHOTS)
                .map((headshot) => (
                  <div
                    key={headshot.id}
                    className="relative shrink-0 w-20 sm:w-24 aspect-[3/4] rounded-lg overflow-hidden border border-border/60"
                  >
                    <PreviewImage
                      src={headshot.previewUrl!}
                      alt={headshot.label}
                      width={96}
                      height={128}
                      className="h-full w-full object-cover"
                    />
                    {headshot.featured && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1 py-0.5 text-[8px] font-medium text-white">
                        Featured
                      </span>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-[11px] text-text-secondary py-2 text-center rounded-lg border border-dashed border-border/60 bg-bg-sidebar/30">
              No headshots yet. Add up to {ACTOR_MAX_HEADSHOTS} professional headshots.
            </p>
          )}
        </Card>
      )}

      {editing !== "profile" && (
        <Card padding="sm" className="border-accent/10">
          <SectionHeader
            title="Media"
            editing={editing === "media"}
            onEdit={() => startEdit("media")}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
          <p className="text-[10px] text-text-secondary mb-2">
            {d.media.length}/{ACTOR_MAX_MEDIA} max
          </p>
          {editing === "media" ? (
            <div className="space-y-2">
              <input
                ref={mediaInputRef}
                type="file"
                accept="video/*,audio/*,.mp4,.mov,.mp3,.wav,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) applyMediaFile(file, mediaUploadTargetId);
                  setMediaUploadTargetId(null);
                  if (mediaInputRef.current) mediaInputRef.current.value = "";
                }}
              />
              {d.media.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/60 p-2 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    {item.type === "audio" ? (
                      <Mic className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                    ) : (
                      <Film className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                    )}
                    <span className="text-[10px] text-text-secondary truncate min-w-0 flex-1">
                      {item.fileName ?? "No file uploaded"}
                    </span>
                    <button
                      type="button"
                      className="text-text-secondary hover:text-accent shrink-0"
                      onClick={() => openMediaUpload(item.id)}
                      aria-label="Replace media file"
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="text-text-secondary hover:text-danger shrink-0"
                      onClick={() =>
                        setDraft((prev) => {
                          if (!prev) return prev;
                          revokePreviewUrl(item.previewUrl);
                          return {
                            ...prev,
                            media: prev.media.filter((m) => m.id !== item.id),
                          };
                        })
                      }
                      aria-label="Remove media"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-[1fr_88px] gap-2">
                    <div>
                      <label className={labelClass}>Label</label>
                      <input
                        className={inputClass}
                        value={item.label}
                        onChange={(e) =>
                          setDraft((prev) => {
                            if (!prev) return prev;
                            const media = [...prev.media];
                            media[index] = { ...media[index], label: e.target.value };
                            return { ...prev, media };
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Type</label>
                      <select
                        className={inputClass}
                        value={item.type}
                        onChange={(e) =>
                          setDraft((prev) => {
                            if (!prev) return prev;
                            const media = [...prev.media];
                            media[index] = {
                              ...media[index],
                              type: e.target.value as ActorMediaItem["type"],
                            };
                            return { ...prev, media };
                          })
                        }
                      >
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="document">Document</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {d.media.length < ACTOR_MAX_MEDIA && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => openMediaUpload(null)}
                >
                  <Upload className="h-3 w-3" />
                  Upload media
                </Button>
              )}
            </div>
          ) : data.media.length > 0 ? (
            <div className="space-y-2">
              {data.media.slice(0, ACTOR_MAX_MEDIA).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/60 bg-bg-sidebar/40 overflow-hidden"
                >
                  <div className="h-28 bg-bg-sidebar relative overflow-hidden">
                    {item.previewUrl && item.type === "video" ? (
                      <video
                        src={item.previewUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover bg-black"
                      />
                    ) : item.previewUrl && item.type === "audio" ? (
                      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
                        <Mic className="h-8 w-8 text-text-secondary/50" />
                        <audio src={item.previewUrl} controls className="w-full max-w-xs" />
                      </div>
                    ) : item.previewUrl ? (
                      <PreviewImage
                        src={item.previewUrl}
                        alt={item.label}
                        width={320}
                        height={180}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-secondary/50">
                        <Film className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-1 border-t border-border/40">
                    <p className="text-[11px] font-medium text-text-primary truncate">
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-text-secondary py-2 text-center rounded-lg border border-dashed border-border/60 bg-bg-sidebar/30">
              No media yet. Add up to {ACTOR_MAX_MEDIA} demo reels or clips.
            </p>
          )}
        </Card>
      )}

      {editing !== "profile" && (
        <Card padding="sm" className="border-accent/10">
          <SectionHeader
            title="Credits"
            editing={editing === "credits"}
            onEdit={() => startEdit("credits")}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />

          {editing === "credits" ? (
          <div className="space-y-2">
            {d.credits.map((credit, index) => (
              <div
                key={credit.id}
                className="grid sm:grid-cols-[1fr_1fr_1fr_72px_28px] gap-2 items-end rounded-lg border border-border/60 p-2"
              >
                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    className={inputClass}
                    value={credit.title}
                    onChange={(e) =>
                      setDraft((prev) => {
                        if (!prev) return prev;
                        const credits = [...prev.credits];
                        credits[index] = { ...credits[index], title: e.target.value };
                        return { ...prev, credits };
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Role</label>
                  <input
                    className={inputClass}
                    value={credit.role}
                    onChange={(e) =>
                      setDraft((prev) => {
                        if (!prev) return prev;
                        const credits = [...prev.credits];
                        credits[index] = { ...credits[index], role: e.target.value };
                        return { ...prev, credits };
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Type</label>
                  <input
                    className={inputClass}
                    value={credit.type}
                    onChange={(e) =>
                      setDraft((prev) => {
                        if (!prev) return prev;
                        const credits = [...prev.credits];
                        credits[index] = { ...credits[index], type: e.target.value };
                        return { ...prev, credits };
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Year</label>
                  <input
                    className={inputClass}
                    value={credit.year}
                    onChange={(e) =>
                      setDraft((prev) => {
                        if (!prev) return prev;
                        const credits = [...prev.credits];
                        credits[index] = { ...credits[index], year: e.target.value };
                        return { ...prev, credits };
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="flex h-9 w-7 items-center justify-center text-text-secondary hover:text-danger"
                  onClick={() =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            credits: prev.credits.filter((c) => c.id !== credit.id),
                          }
                        : prev,
                    )
                  }
                  aria-label="Remove credit"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        credits: [
                          ...prev.credits,
                          {
                            id: crypto.randomUUID(),
                            title: "",
                            role: "",
                            type: "",
                            year: "",
                          },
                        ],
                      }
                    : prev,
                )
              }
            >
              <Plus className="h-3 w-3" />
              Add credit
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border/50 rounded-xl border border-border/50 overflow-hidden">
            {data.credits.map((credit) => (
              <li
                key={credit.id}
                    className="flex items-center justify-between gap-3 px-2.5 py-2 bg-bg-sidebar/30 hover:bg-bg-sidebar/60 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {credit.title}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">{credit.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                    {credit.type}
                  </Badge>
                  <p className="text-[10px] text-text-secondary mt-1 tabular-nums">
                    {credit.year}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        </Card>
      )}

      {editing !== "profile" && (
        <Card padding="sm" className="border-accent/10">
          <SectionHeader
            title="Skills & links"
          editing={
            editing === "skills" || editing === "languages" || editing === "links"
          }
          onEdit={() => startEdit("skills")}
          onSave={saveEdit}
          onCancel={cancelEdit}
        />

        {editing === "skills" ? (
          <div>
            <label className={labelClass} htmlFor="skills-input">Skills</label>
            <MultiSelect
              id="skills-input"
              options={ACTOR_SKILL_OPTIONS}
              value={d.skills}
              onChange={(skills) =>
                setDraft((prev) => (prev ? { ...prev, skills } : prev))
              }
              placeholder="Select your skills"
              allowOther
              otherPrompt="Enter your skill"
              otherPlaceholder="e.g. Puppetry"
            />
          </div>
        ) : editing === "languages" ? (
          <div>
            <label className={labelClass} htmlFor="languages-input">Languages</label>
            <MultiSelect
              id="languages-input"
              options={ACTOR_LANGUAGE_OPTIONS}
              value={d.languages}
              onChange={(languages) =>
                setDraft((prev) => (prev ? { ...prev, languages } : prev))
              }
              placeholder="Languages you speak"
              allowOther
              otherPrompt="Enter your language"
              otherPlaceholder="e.g. Swahili"
            />
          </div>
        ) : editing === "links" ? (
          <div className="space-y-2">
            {d.links.map((link, index) => (
              <div
                key={link.id}
                className="grid sm:grid-cols-[1fr_1fr_28px] gap-2 items-end"
              >
                <div>
                  <label className={labelClass}>Label</label>
                  <input
                    className={inputClass}
                    value={link.label}
                    onChange={(e) =>
                      setDraft((prev) => {
                        if (!prev) return prev;
                        const links = [...prev.links];
                        links[index] = { ...links[index], label: e.target.value };
                        return { ...prev, links };
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>URL</label>
                  <input
                    className={inputClass}
                    value={link.url}
                    onChange={(e) =>
                      setDraft((prev) => {
                        if (!prev) return prev;
                        const links = [...prev.links];
                        links[index] = { ...links[index], url: e.target.value };
                        return { ...prev, links };
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="flex h-9 w-7 items-center justify-center text-text-secondary hover:text-danger"
                  onClick={() =>
                    setDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            links: prev.links.filter((l) => l.id !== link.id),
                          }
                        : prev,
                    )
                  }
                  aria-label="Remove link"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        links: [
                          ...prev.links,
                          { id: crypto.randomUUID(), label: "", url: "" },
                        ],
                      }
                    : prev,
                )
              }
            >
              <Plus className="h-3 w-3" />
              Add link
            </Button>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            {data.skills.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide mb-1">
                  Skills
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.languages.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide mb-1">
                  Languages
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.languages.map((lang) => (
                    <Badge key={lang} variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                      <Globe className="h-2.5 w-2.5" />
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.links.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wide mb-1">
                  Links
                </p>
                <div className="space-y-0.5">
                  {data.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-hover"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-1 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => startEdit("skills")}
              >
                Skills
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => startEdit("languages")}
              >
                Languages
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => startEdit("links")}
              >
                Links
              </Button>
            </div>
          </div>
        )}
        </Card>
      )}

      {shareOpen && (
        <ShareProfileModal
          actorName={displayName}
          profileUrl={profileShareUrl}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
