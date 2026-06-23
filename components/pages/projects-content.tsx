"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Project } from "@/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

function sortByDueDateDesc(items: Project[]) {
  return [...items].sort((a, b) =>
    b.submissionDeadline.localeCompare(a.submissionDeadline),
  );
}

function ProjectListHeader() {
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_4.5rem] sm:grid-cols-[minmax(0,1fr)_4rem_4.5rem_5rem] gap-x-3 gap-y-0 items-center pb-2 border-b border-border/60 text-[10px] font-semibold text-text-secondary uppercase tracking-wide"
    >
      <span>Project</span>
      <span className="text-center">Roles</span>
      <span className="text-center">Subs</span>
      <span className="text-right">Status</span>
    </div>
  );
}

function ProjectRow({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_4.5rem] sm:grid-cols-[minmax(0,1fr)_4rem_4.5rem_5rem] gap-x-3 items-center py-2 hover:bg-bg-sidebar/50 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {project.title}
        </p>
        <p className="text-xs text-text-secondary truncate">
          {project.location} · {project.projectType}
          {project.unionStatus ? ` · ${project.unionStatus}` : ""}
        </p>
      </div>
      <p className="text-sm font-medium text-text-primary text-center tabular-nums">
        {project.roleCount}
      </p>
      <p className="text-sm font-medium text-text-primary text-center tabular-nums">
        {project.submissionCount}
      </p>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge
          variant={project.status === "active" ? "success" : "outline"}
          className="text-[10px] px-2 py-0.5"
        >
          {project.status}
        </Badge>
        <span className="text-[10px] text-text-secondary whitespace-nowrap">
          {project.submissionDeadline
            ? `Due ${formatDate(project.submissionDeadline)}`
            : "No deadline"}
        </span>
      </div>
    </Link>
  );
}

export function ProjectsContent({ projects }: { projects: Project[] }) {
  const [archivedOpen, setArchivedOpen] = useState(false);

  const activeProjects = useMemo(
    () =>
      sortByDueDateDesc(
        projects.filter((p) => p.status === "active" || p.status === "draft"),
      ),
    [projects],
  );

  const archivedProjects = useMemo(
    () =>
      sortByDueDateDesc(
        projects.filter((p) => p.status === "completed" || p.status === "archived"),
      ),
    [projects],
  );

  return (
    <div className="space-y-4">
      <Card padding="sm">
        <ProjectListHeader />
        {activeProjects.length === 0 ? (
          <p className="text-sm text-text-secondary py-8 text-center">
            No projects yet. Create your first project to start casting.
          </p>
        ) : (
          <div className="divide-y divide-border/60">
            {activeProjects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        )}
      </Card>

      {archivedProjects.length > 0 && (
        <Card padding="sm">
          <button
            type="button"
            onClick={() => setArchivedOpen((open) => !open)}
            className={cn(
              "flex w-full items-center justify-between gap-3 text-left",
              archivedOpen ? "mb-0" : "pb-2 border-b border-border/60",
            )}
            aria-expanded={archivedOpen}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-text-primary">
                Archived projects
              </span>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                {archivedProjects.length}
              </Badge>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-text-secondary shrink-0 transition-transform duration-200",
                archivedOpen && "rotate-180",
              )}
            />
          </button>

          {archivedOpen && (
            <div className="animate-fade-in">
              <ProjectListHeader />
              <div className="divide-y divide-border/60">
                {archivedProjects.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
