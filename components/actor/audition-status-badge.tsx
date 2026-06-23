"use client";

import { Badge } from "@/components/ui/badge";
import { useAuditionSubmissions } from "@/components/providers/audition-submissions-provider";
import {
  auditionStatusVariant,
  getAuditionDisplayStatus,
} from "@/lib/audition-status";
import type { Audition } from "@/types";

export function AuditionStatusBadge({ audition }: { audition: Audition }) {
  const { isSubmitted } = useAuditionSubmissions();
  const displayStatus = isSubmitted(audition.id, audition.status)
    ? "submitted"
    : getAuditionDisplayStatus(audition);

  return (
    <Badge
      variant={auditionStatusVariant[displayStatus] ?? "default"}
      className="text-xs"
    >
      {displayStatus}
    </Badge>
  );
}
