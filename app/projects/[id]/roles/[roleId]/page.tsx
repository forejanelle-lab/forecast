import { auth } from "@/auth";
import { RoleSubmissionsContent } from "@/components/casting/role-submissions-content";
import {
  getProjectByIdForCasting,
  getRoleById,
  getSubmissionsForRole,
} from "@/lib/data/projects";
import { notFound, redirect } from "next/navigation";

export default async function RoleSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string; roleId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { id, roleId } = await params;
  const project = await getProjectByIdForCasting(id, session.user.id);
  const role = await getRoleById(roleId);
  const submissions = await getSubmissionsForRole(roleId);

  if (!project || !role || role.projectId !== id) notFound();

  return (
    <RoleSubmissionsContent
      projectId={id}
      role={role}
      submissions={submissions}
      castingDirector={project.castingDirector}
      projectStatus={project.status}
    />
  );
}
