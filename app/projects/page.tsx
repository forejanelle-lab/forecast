import { auth } from "@/auth";
import { ProjectsContent } from "@/components/pages/projects-content";
import { Button } from "@/components/ui/button";
import { getProjectsForCastingUser } from "@/lib/data/projects";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const projects = await getProjectsForCastingUser(session.user.id);

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Projects</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage your casting projects, roles, and submissions.
          </p>
        </div>
        <Link href="/projects/new">
          <Button size="sm" className="gap-2 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        </Link>
      </div>

      <ProjectsContent projects={projects} />
    </div>
  );
}
