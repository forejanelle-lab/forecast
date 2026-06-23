"use client";

import { Input } from "@/components/ui/input";
import {
  isPostedToday,
  isRoleFitForActor,
  matchesSearchQuery,
} from "@/lib/role-match";
import { cn, formatDate } from "@/lib/utils";
import type { Project, Role } from "@/types";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type RegionFilter = "" | "NY" | "Atlanta" | "LA";

interface SearchRolesProps {
  title?: string;
  subtitle?: string;
  roles: Role[];
  projects: Project[];
  actorProfile: { playingAge: string; gender: string } | null;
}

interface TableRow {
  projectId: string;
  postedAt: string;
  projectTitle: string;
  location: string;
  projectType: string;
  castingName: string;
}

export function SearchRolesContent({
  title = "Breakdowns",
  subtitle = "Browse project breakdowns and roles that match your profile.",
  roles,
  projects,
  actorProfile,
}: SearchRolesProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [postedToday, setPostedToday] = useState(false);
  const [fitForMe, setFitForMe] = useState(false);
  const [region, setRegion] = useState<RegionFilter>("");

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const tableRows = useMemo(() => {
    let filteredRoles = roles;

    if (postedToday) {
      filteredRoles = filteredRoles.filter((role) => isPostedToday(role.postedAt));
    }
    if (fitForMe && actorProfile) {
      filteredRoles = filteredRoles.filter((role) =>
        isRoleFitForActor(role, actorProfile),
      );
    }
    if (region) {
      filteredRoles = filteredRoles.filter((role) => {
        const project = projectMap.get(role.projectId);
        return project?.region === region;
      });
    }

    const rolesByProject = new Map<string, Role[]>();
    for (const role of filteredRoles) {
      const existing = rolesByProject.get(role.projectId) ?? [];
      existing.push(role);
      rolesByProject.set(role.projectId, existing);
    }

    const rows: TableRow[] = [];

    for (const [projectId, projectRoles] of rolesByProject.entries()) {
      const project = projectMap.get(projectId);
      if (!project || project.status !== "active") continue;

      const roleNames = projectRoles.map((role) => role.characterName);
      if (
        !matchesSearchQuery(
          query,
          project.title,
          project.productionCompany,
          roleNames,
        )
      ) {
        continue;
      }

      const postedAt = projectRoles.reduce(
        (latest, role) => (role.postedAt > latest ? role.postedAt : latest),
        projectRoles[0].postedAt,
      );

      rows.push({
        projectId,
        postedAt,
        projectTitle: project.title,
        location: project.location,
        projectType: project.projectType,
        castingName: project.castingDirector,
      });
    }

    return rows.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
  }, [query, postedToday, fitForMe, region, roles, projectMap, actorProfile]);

  return (
    <div className="space-y-4 animate-fade-in max-w-none">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
      </div>

      <Input
        icon
        placeholder="Search by project..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-9 text-sm"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPostedToday((active) => !active)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
            postedToday
              ? "bg-text-primary text-white border-text-primary"
              : "bg-bg-secondary border-border text-text-secondary hover:text-text-primary",
          )}
        >
          Roles posted today
        </button>
        <button
          type="button"
          onClick={() => setFitForMe((active) => !active)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
            fitForMe
              ? "bg-accent text-white border-accent"
              : "bg-bg-secondary border-border text-text-secondary hover:text-text-primary",
          )}
        >
          Roles for me
        </button>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as RegionFilter)}
          className="h-7 rounded-full border border-border bg-bg-secondary px-3 text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">All Regions</option>
          <option value="NY">NY</option>
          <option value="Atlanta">Atlanta</option>
          <option value="LA">LA</option>
        </select>
      </div>

      <div className="-mx-8 -mr-8">
        {tableRows.length === 0 ? (
          <p className="text-xs text-text-secondary py-6 text-center px-8">
            {projects.length === 0
              ? "No open projects yet. Check back when casting directors post roles."
              : "No projects match your search or filters."}
          </p>
        ) : (
          <table className="w-full text-xs table-fixed">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[26%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th className="py-2 pl-8 pr-3 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  Posted Date
                </th>
                <th className="py-2 px-3 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  Project Title
                </th>
                <th className="py-2 px-3 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  Location
                </th>
                <th className="py-2 px-3 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  Project Type
                </th>
                <th className="py-2 px-3 pr-8 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  Casting Name
                </th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr
                  key={row.projectId}
                  onClick={() => router.push(`/actor/projects/${row.projectId}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/actor/projects/${row.projectId}`);
                    }
                  }}
                  tabIndex={0}
                  role="link"
                  aria-label={`View roles for ${row.projectTitle}`}
                  className="border-b border-border/40 hover:bg-bg-sidebar/60 transition-colors cursor-pointer"
                >
                  <td className="py-2 pl-8 pr-3 text-text-secondary leading-tight">
                    {formatDate(row.postedAt)}
                  </td>
                  <td className="py-2 px-3 font-medium text-text-primary leading-tight">
                    {row.projectTitle}
                  </td>
                  <td className="py-2 px-3 text-text-secondary leading-tight">
                    {row.location}
                  </td>
                  <td className="py-2 px-3 text-text-secondary leading-tight">
                    {row.projectType}
                  </td>
                  <td className="py-2 px-3 pr-8 text-text-primary leading-tight">
                    {row.castingName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
