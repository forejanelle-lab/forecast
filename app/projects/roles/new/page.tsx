import { auth } from "@/auth";
import { getProjectsForCastingUser } from "@/lib/data/projects";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import NewRolePage from "./new-role-page";

export default async function NewRoleRoutePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const projects = await getProjectsForCastingUser(session.user.id);

  return (
    <Suspense fallback={<div className="text-sm text-text-secondary animate-fade-in">Loading…</div>}>
      <NewRolePage projects={projects} />
    </Suspense>
  );
}
