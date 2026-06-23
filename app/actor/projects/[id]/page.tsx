import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProjectRoleList } from "@/components/actor/project-role-list";
import { getActorProfileByUserId } from "@/lib/data/actors";
import {
  getAppliedRoleIdsForActor,
  getAuditionRoleIdsForActor,
  getProjectByIdForActors,
  getRolesForProject,
} from "@/lib/data/projects";
import { isProjectOpenForActorSubmissions } from "@/lib/project-lifecycle";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ActorProjectRolesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const project = await getProjectByIdForActors(id);

  if (!project) notFound();

  const roles = await getRolesForProject(id);
  const actorProfile = session?.user
    ? await getActorProfileByUserId(session.user.id)
    : null;
  const roleIds = roles.map((role) => role.id);
  const appliedRoleIds = session?.user
    ? await getAppliedRoleIdsForActor(session.user.id, roleIds)
    : [];
  const auditionRoleIds = session?.user
    ? await getAuditionRoleIdsForActor(session.user.id, roleIds)
    : [];

  const submissionsOpen = isProjectOpenForActorSubmissions(
    project.status,
    project.submissionDeadline,
  );

  return (
    <div className="space-y-4 animate-fade-in max-w-3xl">
      <div>
        <Link
          href="/actor/search"
          className="text-xs text-text-secondary hover:text-accent transition-colors mb-2 inline-block"
        >
          ← Back to Breakdowns
        </Link>
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <Badge variant="success" className="text-[10px] px-2 py-0.5">
            {project.region}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            {project.projectType}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
            {project.unionStatus}
          </Badge>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          {project.title}
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          {project.productionCompany} · {project.castingDirector}
        </p>
      </div>

      <Card padding="sm">
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
              Casting End Date
            </p>
            <p className="text-text-primary font-medium mt-0.5">
              {formatDate(project.submissionDeadline)}
            </p>
          </div>
        </div>
        {project.description?.trim() && (
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            {project.description}
          </p>
        )}

        <div className="border-t border-border/60 pt-3">
          <h2 className="text-sm font-semibold text-text-primary mb-2">Roles</h2>
          <ProjectRoleList
            roles={roles}
            projectTitle={project.title}
            submissionsOpen={submissionsOpen}
            appliedRoleIds={appliedRoleIds}
            auditionRoleIds={auditionRoleIds}
            actorProfile={
              actorProfile
                ? {
                    playingAge: actorProfile.playingAge,
                    gender: actorProfile.gender ?? "",
                  }
                : null
            }
          />
        </div>
      </Card>
    </div>
  );
}
