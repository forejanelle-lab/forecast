"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditProjectModal } from "@/components/casting/edit-project-modal";
import type { Project } from "@/types";
import Link from "next/link";
import { useState } from "react";

interface ProjectDetailHeaderProps {
  project: Project;
}

export function ProjectDetailHeader({ project }: ProjectDetailHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <Badge variant="success" className="text-[10px] px-2 py-0.5">
              {project.status}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              {project.projectType}
            </Badge>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            {project.title}
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">{project.castingOffice}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setEditOpen(true)}
          >
            Edit Project
          </Button>
          <Link href={`/projects/roles/new?projectId=${project.id}`}>
            <Button size="sm" className="h-8 text-xs">Add Role</Button>
          </Link>
        </div>
      </div>

      {editOpen && (
        <EditProjectModal project={project} onClose={() => setEditOpen(false)} />
      )}
    </>
  );
}
