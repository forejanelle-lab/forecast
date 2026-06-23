"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PreviewImage } from "@/components/ui/preview-image";
import { PopularActorStar } from "@/components/casting/popular-actor-star";
import { RequestAuditionProjectsModal } from "@/components/casting/request-audition-projects-modal";
import { Tooltip } from "@/components/ui/tooltip";
import type { Project, Role, SearchableCastingActor } from "@/types";
import { cn } from "@/lib/utils";
import { getMediaFileKind } from "@/lib/media-file-kind";
import type { ActorMediaItem } from "@/types";
import {
  ArrowLeft,
  Clapperboard,
  ExternalLink,
  Eye,
  Film,
  MapPin,
  Mic,
  Ruler,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface CastingActorProfileContentProps {
  actor: SearchableCastingActor;
  backHref: string;
  backLabel: string;
  castingProjects: Project[];
  rolesByProject: Record<string, Role[]>;
  reviewContext?: {
    projectId?: string;
    roleId?: string;
    submissionId?: string;
  };
  auditionRequestedRoleIds?: Set<string>;
}

function SectionHeader({
  title,
  icon,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 mb-3", className)}>
      {icon && (
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
          {icon}
        </div>
      )}
      <h2 className="text-sm font-semibold tracking-tight text-text-primary">{title}</h2>
    </div>
  );
}

function MetaChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-bg-sidebar/50 px-2.5 py-1 text-xs text-text-secondary">
      <span className="text-text-secondary/70">{icon}</span>
      {label}
    </span>
  );
}

function CastingActorMediaCard({ item }: { item: ActorMediaItem }) {
  const fileKind = item.fileName ? getMediaFileKind(item.fileName) : item.type;
  const isVideo = item.type === "video" || fileKind === "video";
  const isAudio = item.type === "audio" || fileKind === "audio";
  const isImage =
    fileKind === "image" ||
    (item.previewUrl && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(item.previewUrl));

  return (
    <div
      className="group rounded-xl border border-border/60 bg-bg-sidebar/40 overflow-hidden hover:border-accent/30 hover:shadow-sm transition-all"
    >
      <div className="aspect-video bg-bg-sidebar relative overflow-hidden">
        {item.previewUrl && isVideo ? (
          <video
            src={item.previewUrl}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-cover bg-black"
          />
        ) : item.previewUrl && isAudio ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
            <Mic className="h-8 w-8 text-text-secondary/50" />
            <audio src={item.previewUrl} controls className="w-full max-w-xs" />
          </div>
        ) : item.previewUrl && isImage ? (
          <PreviewImage
            src={item.previewUrl}
            alt={item.label}
            width={320}
            height={180}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-secondary/50">
            {isVideo ? (
              <Film className="h-8 w-8" />
            ) : isAudio ? (
              <Mic className="h-8 w-8" />
            ) : (
              <Film className="h-8 w-8" />
            )}
          </div>
        )}
        {item.duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-white font-medium">
            {item.duration}
          </span>
        )}
      </div>
      <div className="px-2.5 py-2 border-t border-border/40">
        <p className="text-xs font-medium text-text-primary truncate">{item.label}</p>
        {item.fileName && (
          <p className="text-[10px] text-text-secondary truncate mt-0.5">
            {item.fileName}
          </p>
        )}
        {item.previewUrl && (
          <a
            href={item.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-accent hover:text-accent-hover mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            Open file
          </a>
        )}
      </div>
    </div>
  );
}

export function CastingActorProfileContent({
  actor,
  backHref,
  backLabel,
  castingProjects,
  rolesByProject,
  reviewContext,
  auditionRequestedRoleIds = new Set(),
}: CastingActorProfileContentProps) {
  const [auditionOpen, setAuditionOpen] = useState(false);
  const [selectedHeadshotId, setSelectedHeadshotId] = useState<string | null>(null);

  const popular = actor.popular || actor.castingProfileViews >= 10;
  const headshotsWithUrl = actor.headshots.filter((h) => h.previewUrl);

  const featuredHeadshot =
    headshotsWithUrl.find((h) => h.featured) ?? headshotsWithUrl[0];
  const displayHeadshotUrl =
    selectedHeadshotId
      ? headshotsWithUrl.find((h) => h.id === selectedHeadshotId)?.previewUrl
      : featuredHeadshot?.previewUrl ?? actor.photoUrl;

  const hasActiveRoles = useMemo(() => {
    return castingProjects.some((project) => {
      if (project.status !== "active") return false;
      const roles = rolesByProject[project.id] ?? [];
      return roles.some((role) => role.status === "open");
    });
  }, [castingProjects, rolesByProject]);

  const requestAuditionButton = hasActiveRoles ? (
    <Button
      size="sm"
      className="h-9 text-xs gap-1.5 shadow-sm bg-gradient-to-r from-[#c8a86b] via-[#d4b87a] to-[#b58d4b] text-text-primary font-semibold border border-accent/30 hover:brightness-105"
      onClick={() => setAuditionOpen(true)}
    >
      <Send className="h-3.5 w-3.5" />
      Request audition
    </Button>
  ) : (
    <Tooltip
      content="Create an active project with open roles to request auditions."
      side="left"
    >
      <span className="inline-flex shrink-0">
        <Button size="sm" className="h-9 text-xs gap-1.5" disabled>
          <Send className="h-3.5 w-3.5" />
          Request audition
        </Button>
      </span>
    </Tooltip>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {backLabel}
      </Link>

      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-[24px] border border-border/60 bg-bg-secondary shadow-[var(--shadow-card)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#fffefb_0%,#faf6ee_50%,#f5f0ff_100%)]" />
        <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
            <div className="shrink-0 mx-auto sm:mx-0">
              <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-2xl overflow-hidden ring-2 ring-white/80 shadow-lg bg-bg-sidebar">
                {displayHeadshotUrl ? (
                  <PreviewImage
                    src={displayHeadshotUrl}
                    alt={actor.name}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/25 to-accent/5 text-2xl font-bold text-accent">
                    {actor.headshot}
                  </div>
                )}
                {actor.featured && (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow-sm">
                    <Sparkles className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                {popular && <PopularActorStar />}
                {actor.verified && (
                  <Badge variant="accent" className="text-[10px] px-2 py-0.5">
                    Verified
                  </Badge>
                )}
                {actor.membership === "Premium" && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-accent/30 text-accent">
                    Premium
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
                {actor.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                {actor.location && (
                  <MetaChip icon={<MapPin className="h-3 w-3" />} label={actor.location} />
                )}
                {actor.playingAge && (
                  <MetaChip icon={<User className="h-3 w-3" />} label={actor.playingAge} />
                )}
                {actor.unionStatus && (
                  <MetaChip icon={<Clapperboard className="h-3 w-3" />} label={actor.unionStatus} />
                )}
                {actor.height && (
                  <MetaChip icon={<Ruler className="h-3 w-3" />} label={actor.height} />
                )}
                {actor.gender && (
                  <MetaChip icon={<User className="h-3 w-3" />} label={actor.gender} />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                  <Eye className="h-3.5 w-3.5 text-accent/80" />
                  <span className="font-medium text-text-primary tabular-nums">
                    {actor.castingProfileViews.toLocaleString()}
                  </span>
                  profile views
                </span>
              </div>
            </div>

            <div className="flex shrink-0 justify-center sm:justify-end sm:items-start">
              {requestAuditionButton}
            </div>
          </div>
        </div>
      </section>

      {/* Headshots strip */}
      {headshotsWithUrl.length > 0 && (
        <Card padding="sm" className="border-accent/10">
          <SectionHeader
            title="Headshots"
            icon={<User className="h-3.5 w-3.5" />}
          />
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
            {headshotsWithUrl.map((headshot) => {
              const selected = selectedHeadshotId === headshot.id ||
                (!selectedHeadshotId && headshot.id === featuredHeadshot?.id);
              return (
                <button
                  key={headshot.id}
                  type="button"
                  onClick={() => setSelectedHeadshotId(headshot.id)}
                  className={cn(
                    "relative shrink-0 w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-200",
                    selected
                      ? "border-accent shadow-md ring-2 ring-accent/20"
                      : "border-border/60 hover:border-accent/40 opacity-90 hover:opacity-100",
                  )}
                >
                  <PreviewImage
                    src={headshot.previewUrl!}
                    alt={headshot.label}
                    width={112}
                    height={149}
                    className="h-full w-full object-cover"
                  />
                  {headshot.featured && (
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-medium text-white">
                      Featured
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Card padding="sm" className="border-accent/10">
        <SectionHeader
          title="Media"
          icon={<Film className="h-3.5 w-3.5" />}
        />
        {actor.media.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actor.media.map((item) => (
              <CastingActorMediaCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary py-4 text-center rounded-xl border border-dashed border-border/60 bg-bg-sidebar/30">
            No demo reels or materials uploaded yet.
          </p>
        )}
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="sm" className="border-accent/10">
            <SectionHeader title="About" />
            <p className="text-sm text-text-secondary leading-relaxed">
              {actor.bio?.trim() || "No bio provided yet."}
            </p>
          </Card>

          {actor.credits.length > 0 && (
            <Card padding="sm" className="border-accent/10">
              <SectionHeader
                title="Credits"
                icon={<Clapperboard className="h-3.5 w-3.5" />}
              />
              <ul className="divide-y divide-border/50 rounded-xl border border-border/50 overflow-hidden">
                {actor.credits.map((credit) => (
                  <li
                    key={credit.id}
                    className="flex items-center justify-between gap-4 px-3 py-2.5 bg-bg-sidebar/30 hover:bg-bg-sidebar/60 transition-colors"
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
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {actor.skills.length > 0 && (
            <Card padding="sm" className="border-accent/10">
              <SectionHeader title="Skills" />
              <div className="flex flex-wrap gap-1.5">
                {actor.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-bg-sidebar/50"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {actor.languages.length > 0 && (
            <Card padding="sm" className="border-accent/10">
              <SectionHeader title="Languages" />
              <div className="flex flex-wrap gap-1.5">
                {actor.languages.map((lang) => (
                  <Badge
                    key={lang}
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-bg-sidebar/50"
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {actor.links.length > 0 && (
            <Card padding="sm" className="border-accent/10">
              <SectionHeader
                title="Links"
                icon={<ExternalLink className="h-3.5 w-3.5" />}
              />
              <ul className="space-y-1">
                {actor.links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-text-primary hover:bg-bg-sidebar/70 hover:text-accent transition-colors group"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-text-secondary group-hover:text-accent" />
                      <span className="truncate font-medium">{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {reviewContext?.submissionId && (
            <Card padding="sm" className="border-accent/10 bg-accent/5">
              <p className="text-xs text-text-secondary mb-3">
                Reviewing this actor from a role submission.
              </p>
              <Link href={backHref}>
                <Button size="sm" variant="secondary" className="h-8 text-xs w-full">
                  Back to submission
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>

      {auditionOpen && (
        <RequestAuditionProjectsModal
          actorId={actor.id}
          actorName={actor.name}
          projects={castingProjects}
          rolesByProject={rolesByProject}
          auditionRequestedRoleIds={auditionRequestedRoleIds}
          onClose={() => setAuditionOpen(false)}
        />
      )}
    </div>
  );
}
