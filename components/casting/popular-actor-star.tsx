"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { Star } from "lucide-react";

const POPULAR_ACTOR_TOOLTIP =
  "This actor has received a lot of profile visits from casting directors.";

export function PopularActorStar() {
  return (
    <Tooltip content={POPULAR_ACTOR_TOOLTIP}>
      <Star
        className="h-3.5 w-3.5 shrink-0 fill-[#c8a86b] text-[#c8a86b]"
        aria-label="Popular actor"
      />
    </Tooltip>
  );
}
