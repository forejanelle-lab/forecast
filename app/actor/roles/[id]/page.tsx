import { auth } from "@/auth";
import { ActorSubmissionDetails } from "@/components/actor/actor-application-view";
import { ActorRoleSubmitSection } from "@/components/actor/actor-role-submit-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleAcceptanceBadge } from "@/components/role/role-acceptance-badge";
import { formatRoleMetaLine } from "@/lib/role-display";
import {
  actorHasAuditionForRole,
  getApplicationForActorRole,
  getProjectByIdForActors,
  getRoleById,
} from "@/lib/data/projects";
import { formatDate } from "@/lib/utils";
import { Calendar, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function ActorRolePostingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id } = await params;
  const { from } = await searchParams;
  const role = await getRoleById(id);

  if (!role) notFound();

  const project = await getProjectByIdForActors(role.projectId);
  const existingApplication = await getApplicationForActorRole(session.user.id, id);
  const hasAudition = await actorHasAuditionForRole(session.user.id, id);
  const fromSubmissions = from === "submissions";
  const roleMeta = formatRoleMetaLine(role);

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl">
      <div>
        <Link
          href={fromSubmissions ? "/actor/applications" : "/actor"}
          className="text-xs text-text-secondary hover:text-accent transition-colors mb-2 inline-block"
        >
          {fromSubmissions ? "← Back to Submissions" : "← Back to Dashboard"}
        </Link>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            {role.roleType}
          </Badge>
          <RoleAcceptanceBadge
            roleId={role.id}
            fallbackStatus={role.status}
            className="text-[10px] px-2 py-0.5"
          />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          {role.characterName}
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">{role.projectTitle}</p>
      </div>

      {fromSubmissions && existingApplication && (
        <ActorSubmissionDetails application={existingApplication} />
      )}

      {project && !fromSubmissions && (
        <Card padding="sm">
          <CardHeader className="mb-2">
            <CardTitle className="text-sm">Project Details</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs mb-3">
            <div>
              <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                Location
              </p>
              <p className="text-text-primary font-medium mt-0.5">{project.location}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                Shoot dates
              </p>
              <p className="text-text-primary font-medium mt-0.5">{project.shootDates}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-secondary uppercase tracking-wide">
                Casting end date
              </p>
              <p className="text-text-primary font-medium mt-0.5">
                {formatDate(project.submissionDeadline)}
              </p>
            </div>
          </div>
          {project.description?.trim() && (
            <p className="text-xs text-text-secondary leading-relaxed">
              {project.description}
            </p>
          )}
        </Card>
      )}

      <Card padding="sm">
        <CardHeader className="mb-2">
          <CardTitle className="text-sm">Role Details</CardTitle>
          <Users className="h-3.5 w-3.5 text-text-secondary" />
        </CardHeader>
        {roleMeta && (
          <p className="text-xs text-text-primary font-medium mb-2">{roleMeta}</p>
        )}
        {role.description?.trim() && (
          <p className="text-xs text-text-secondary leading-relaxed mb-3">
            {role.description}
          </p>
        )}
        {!fromSubmissions && (
          <div className="grid sm:grid-cols-2 gap-2 mb-3 text-xs">
            <div className="rounded-lg bg-bg-sidebar px-3 py-2">
              <p className="text-[10px] text-text-secondary mb-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Location
              </p>
              <p className="font-medium text-text-primary">
                {project?.location ?? "—"}
              </p>
            </div>
            <div className="rounded-lg bg-bg-sidebar px-3 py-2">
              <p className="text-[10px] text-text-secondary mb-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Shoot dates
              </p>
              <p className="font-medium text-text-primary">{project?.shootDates ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-bg-sidebar px-3 py-2">
              <p className="text-[10px] text-text-secondary mb-0.5">Gender</p>
              <p className="font-medium text-text-primary">{role.gender}</p>
            </div>
            <div className="rounded-lg bg-bg-sidebar px-3 py-2">
              <p className="text-[10px] text-text-secondary mb-0.5">Ethnicity</p>
              <p className="font-medium text-text-primary">{role.ethnicity}</p>
            </div>
          </div>
        )}
        <ActorRoleSubmitSection
          role={role}
          existingApplication={existingApplication ?? undefined}
          hasAudition={hasAudition}
        />
      </Card>
    </div>
  );
}
