"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PopularActorStar } from "@/components/casting/popular-actor-star";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { CASTING_SEARCH_ACTORS_LOCKED_TOOLTIP } from "@/lib/casting-analytics-lock";
import type { SearchableCastingActor } from "@/types";
import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

function toggleFilterValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

interface CastingSearchActorsContentProps {
  actors: SearchableCastingActor[];
}

export function CastingSearchActorsContent({
  actors,
}: CastingSearchActorsContentProps) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedUnions, setSelectedUnions] = useState<string[]>([]);

  const filterOptions = useMemo(() => ({
    locations: [...new Set(actors.map((actor) => actor.location).filter(Boolean))].sort(),
    languages: [...new Set(actors.flatMap((actor) => actor.languages))].sort(),
    skills: [...new Set(actors.flatMap((actor) => actor.skills))].sort(),
    unions: [...new Set(actors.map((actor) => actor.unionStatus))].sort(),
  }), [actors]);

  const activeFilterCount =
    selectedLocations.length +
    selectedLanguages.length +
    selectedSkills.length +
    selectedUnions.length;

  const filteredActors = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return actors
      .filter((actor) => {
        if (
          selectedLocations.length > 0 &&
          !selectedLocations.includes(actor.location)
        ) {
          return false;
        }
        if (
          selectedUnions.length > 0 &&
          !selectedUnions.includes(actor.unionStatus)
        ) {
          return false;
        }
        if (
          selectedLanguages.length > 0 &&
          !selectedLanguages.some((lang) => actor.languages.includes(lang))
        ) {
          return false;
        }
        if (
          selectedSkills.length > 0 &&
          !selectedSkills.some((skill) => actor.skills.includes(skill))
        ) {
          return false;
        }
        if (!normalized) return true;
        return (
          actor.name.toLowerCase().includes(normalized) ||
          actor.location.toLowerCase().includes(normalized) ||
          actor.unionStatus.toLowerCase().includes(normalized) ||
          actor.skills.some((skill) => skill.toLowerCase().includes(normalized)) ||
          actor.languages.some((lang) => lang.toLowerCase().includes(normalized))
        );
      })
      .sort((a, b) => {
        if (a.popular !== b.popular) return a.popular ? -1 : 1;
        return b.castingProfileViews - a.castingProfileViews;
      });
  }, [
    actors,
    query,
    selectedLocations,
    selectedLanguages,
    selectedSkills,
    selectedUnions,
  ]);

  const clearFilters = () => {
    setSelectedLocations([]);
    setSelectedLanguages([]);
    setSelectedSkills([]);
    setSelectedUnions([]);
  };

  return (
    <Tooltip
      content={CASTING_SEARCH_ACTORS_LOCKED_TOOLTIP}
      side="bottom"
      className="w-full block"
    >
      <div
        className="space-y-6 animate-fade-in max-w-6xl pointer-events-none select-none cursor-not-allowed"
        aria-disabled="true"
      >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Search Actors</h1>
        <p className="text-text-secondary mt-1">
          Find talent with advanced filters, saved searches, and instant results.
        </p>
        <p className="text-xs text-text-secondary/80 mt-2">
          {CASTING_SEARCH_ACTORS_LOCKED_TOOLTIP}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            icon
            placeholder="Search by name, skill, language, location, or union..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          size="md"
          className="gap-2 shrink-0"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <Filter className="h-4 w-4" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <Badge variant="accent" className="text-[10px] px-1.5 py-0 ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {filtersOpen && (
        <Card padding="sm" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Advanced filters
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-accent hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <FilterChipGroup
            label="Location"
            options={filterOptions.locations}
            selected={selectedLocations}
            onToggle={(value) =>
              setSelectedLocations((prev) => toggleFilterValue(prev, value))
            }
          />
          <FilterChipGroup
            label="Languages"
            options={filterOptions.languages}
            selected={selectedLanguages}
            onToggle={(value) =>
              setSelectedLanguages((prev) => toggleFilterValue(prev, value))
            }
          />
          <FilterChipGroup
            label="Skills"
            options={filterOptions.skills}
            selected={selectedSkills}
            onToggle={(value) =>
              setSelectedSkills((prev) => toggleFilterValue(prev, value))
            }
          />
          <FilterChipGroup
            label="Union"
            options={filterOptions.unions}
            selected={selectedUnions}
            onToggle={(value) =>
              setSelectedUnions((prev) => toggleFilterValue(prev, value))
            }
          />
        </Card>
      )}

      <Card padding="sm">
        {filteredActors.length === 0 ? (
          <p className="text-sm text-text-secondary py-8 text-center">
            No actors match your search or filters.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-border/60 text-left text-[9px] font-semibold text-text-secondary uppercase tracking-wide">
                  <th className="py-2 pr-4 min-w-[200px]">Actor</th>
                  <th className="py-2 px-3 min-w-[80px]">Age range</th>
                  <th className="py-2 px-3 min-w-[120px]">Location</th>
                  <th className="py-2 pl-3 min-w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActors.map((actor) => (
                  <tr
                    key={actor.id}
                    className="border-b border-border/40 hover:bg-bg-sidebar/40 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          initials={actor.headshot}
                          imageUrl={actor.photoUrl}
                          size="sm"
                          featured={actor.featured}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {actor.popular && <PopularActorStar />}
                            <Link
                              href={`/casting/actors/${actor.id}`}
                              className="text-sm font-medium text-text-primary hover:text-accent truncate"
                            >
                              {actor.name}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-text-secondary whitespace-nowrap">
                      {actor.playingAge || "—"}
                    </td>
                    <td className="py-3 px-3 text-text-secondary">
                      {actor.location || "—"}
                    </td>
                    <td className="py-3 pl-3">
                      <Link href={`/casting/actors/${actor.id}`}>
                        <Button size="sm" variant="secondary" className="h-7 text-xs">
                          View profile
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </div>
    </Tooltip>
  );
}

function FilterChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                isSelected
                  ? "bg-text-primary text-white border-text-primary"
                  : "border-border text-text-secondary hover:text-text-primary",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
