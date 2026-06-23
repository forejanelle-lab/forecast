"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleAuditionMaterialsSection } from "@/components/actor/role-audition-materials-section";
import { AuditionActions } from "@/components/actor/audition-actions";
import { AuditionStatusBadge } from "@/components/actor/audition-status-badge";
import { AuditionUploadSection } from "@/components/actor/audition-upload-section";
import { formatAuditionInstructionsForDisplay } from "@/lib/audition-instructions-format";
import { isAuditionOpenForSubmission } from "@/lib/audition-status";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Audition } from "@/types";
import {
  Calendar,
  Clapperboard,
  MapPin,
  User,
} from "lucide-react";
import Link from "next/link";

export function AuditionRequestPageContent({ audition }: { audition: Audition }) {
  const canSubmit = isAuditionOpenForSubmission(audition);
  const projectHref = audition.projectId
    ? `/actor/projects/${audition.projectId}`
    : null;
  const instructions = formatAuditionInstructionsForDisplay(audition.instructions);
  const materials = audition.materials ?? [];

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl">
      <div>
        <Link
          href="/actor/auditions"
          className="text-xs text-text-secondary hover:text-accent transition-colors mb-2 inline-block"
        >
          ← Back to Auditions
        </Link>
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <AuditionStatusBadge audition={audition} />
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            {audition.location}
          </Badge>
        </div>
        {projectHref ? (
          <Link
            href={projectHref}
            className="text-xl font-semibold tracking-tight text-text-primary hover:text-accent transition-colors"
          >
            {audition.projectTitle}
          </Link>
        ) : (
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            {audition.projectTitle}
          </h1>
        )}
        <p className="text-sm text-text-secondary mt-0.5">{audition.roleName}</p>
        <p className="text-[11px] text-text-secondary mt-1">
          Requested {formatDateTime(audition.requestedAt)}
          {audition.deadline && (
            <>
              {" "}
              · Due {formatDate(audition.deadline)}
            </>
          )}
        </p>
      </div>

      <Card padding="sm">
        <CardHeader className="mb-2">
          <CardTitle className="text-sm">Project Details</CardTitle>
          <Clapperboard className="h-3.5 w-3.5 text-text-secondary" />
        </CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
          {audition.projectLocation && (
            <div>
              <p className="text-[10px] text-text-secondary uppercase tracking-wide flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Location
              </p>
              <p className="text-text-primary font-medium mt-0.5">
                {audition.projectLocation}
              </p>
            </div>
          )}
          {audition.shootDates && (
            <div>
              <p className="text-[10px] text-text-secondary uppercase tracking-wide flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Shoot dates
              </p>
              <p className="text-text-primary font-medium mt-0.5">{audition.shootDates}</p>
            </div>
          )}
          {audition.submissionDeadline && (
            <div>
              <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                Casting end date
              </p>
              <p className="text-text-primary font-medium mt-0.5">
                {formatDate(audition.submissionDeadline)}
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card padding="sm">
        <CardHeader className="mb-2">
          <CardTitle className="text-sm">Audition Details</CardTitle>
          <Calendar className="h-3.5 w-3.5 text-text-secondary" />
        </CardHeader>
        <div className="grid sm:grid-cols-2 gap-2">
          <div className="rounded-lg bg-bg-sidebar px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-0.5 flex items-center gap-1">
              <User className="h-3 w-3" /> Casting Director
            </p>
            <p className="text-sm font-medium text-text-primary">{audition.castingDirector}</p>
          </div>
          <div className="rounded-lg bg-bg-sidebar px-3 py-2">
            <p className="text-[10px] text-text-secondary mb-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Audition location
            </p>
            <p className="text-sm font-medium text-text-primary">{audition.location}</p>
          </div>
          {audition.deadline && (
            <div className="rounded-lg bg-bg-sidebar px-3 py-2 sm:col-span-2">
              <p className="text-[10px] text-text-secondary mb-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Audition due date
              </p>
              <p className="text-sm font-medium text-text-primary">
                {formatDate(audition.deadline)}
              </p>
            </div>
          )}
        </div>
      </Card>

      {instructions && (
        <Card padding="sm">
          <CardHeader className="mb-2">
            <CardTitle className="text-sm">Instructions from Casting</CardTitle>
          </CardHeader>
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {instructions}
          </p>
        </Card>
      )}

      <RoleAuditionMaterialsSection auditionId={audition.id} materials={materials} />

      {audition.uploadRequirements && audition.uploadRequirements.length > 0 && (
        <Card padding="sm">
          <CardHeader className="mb-2">
            <CardTitle className="text-sm">Upload Requirements</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
            {audition.uploadRequirements.map((req) => (
              <li
                key={req}
                className="px-3 py-2 text-xs text-text-secondary leading-relaxed"
              >
                {req}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <AuditionUploadSection audition={audition} />

      <AuditionActions
        auditionId={audition.id}
        status={audition.status}
        canAct={canSubmit}
      />
    </div>
  );
}
