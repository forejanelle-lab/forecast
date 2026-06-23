import { auth } from "@/auth";
import { CastingActorProfileContent } from "@/components/casting/casting-actor-profile-content";
import {
  getActorProfileByUserId,
  recordProfileView,
} from "@/lib/data/actors";
import { getAuditionRequestedRoleIdsForActor } from "@/lib/casting-submission-actions";
import {
  getProjectsForCastingUser,
  getRoleById,
  getRolesForProject,
  markApplicationReviewedIfNeeded,
} from "@/lib/data/projects";
import { notFound } from "next/navigation";

export default async function CastingActorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    projectId?: string;
    roleId?: string;
    submissionId?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await auth();
  const actor = await getActorProfileByUserId(id);

  if (!actor) notFound();

  if (session?.user?.id && session.user.id !== id) {
    await recordProfileView(id, session.user.id);
  }

  const castingProjects = session?.user
    ? await getProjectsForCastingUser(session.user.id)
    : [];

  const rolesByProject: Record<string, Awaited<ReturnType<typeof getRolesForProject>>> = {};
  for (const project of castingProjects) {
    rolesByProject[project.id] = await getRolesForProject(project.id);
  }

  const role = query.roleId ? await getRoleById(query.roleId) : undefined;
  const auditionRequestedRoleIds = session?.user
    ? await getAuditionRequestedRoleIdsForActor(id, session.user.id)
    : new Set<string>();

  if (query.submissionId && session?.user?.id) {
    await markApplicationReviewedIfNeeded(query.submissionId, session.user.id);
  }

  let backHref = "/casting/search";
  let backLabel = "Back to search";

  if (query.projectId && query.roleId && role) {
    backHref = `/projects/${query.projectId}/roles/${query.roleId}`;
    backLabel = `Back to ${role.characterName} submissions`;
  }

  return (
    <CastingActorProfileContent
      actor={actor}
      backHref={backHref}
      backLabel={backLabel}
      castingProjects={castingProjects}
      rolesByProject={rolesByProject}
      reviewContext={{
        projectId: query.projectId,
        roleId: query.roleId,
        submissionId: query.submissionId,
      }}
      auditionRequestedRoleIds={auditionRequestedRoleIds}
    />
  );
}
