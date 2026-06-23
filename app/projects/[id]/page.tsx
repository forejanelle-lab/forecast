import { auth } from "@/auth";
import { ProjectDetailHeader } from "@/components/casting/project-detail-header";
import { Card } from "@/components/ui/card";
import { ProjectRolesList } from "@/components/casting/project-roles-list";
import {
  getProjectByIdForCasting,
  getRolesForProject,
} from "@/lib/data/projects";
import { formatDateOrPlaceholder } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id } = await params;
  const project = await getProjectByIdForCasting(id, session.user.id);
  const roles = await getRolesForProject(id);

  if (!project) notFound();

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      <ProjectDetailHeader project={project} />

      <Card padding="sm">
        <p className="text-sm text-text-secondary leading-relaxed mb-3">
          {project.description}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs mb-4">
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wide">
              Union
            </p>
            <p className="text-text-primary font-medium mt-0.5">{project.unionStatus}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wide">
              Shoot dates
            </p>
            <p className="text-text-primary font-medium mt-0.5">{project.shootDates}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wide">
              Location
            </p>
            <p className="text-text-primary font-medium mt-0.5">{project.location}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs border-t border-border/60 pt-3">
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wide">
              Submissions
            </p>
            <p className="text-text-primary font-semibold mt-0.5">
              {project.submissionCount}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wide">
              Open roles
            </p>
            <p className="text-text-primary font-semibold mt-0.5">{project.roleCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wide">
              Casting end date
            </p>
            <p className="text-text-primary font-semibold mt-0.5">
              {formatDateOrPlaceholder(project.submissionDeadline, "No deadline")}
            </p>
          </div>
        </div>
      </Card>

      <ProjectRolesList projectId={id} initialRoles={roles} />
    </div>
  );
}
