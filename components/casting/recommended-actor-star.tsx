"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { Star } from "lucide-react";

const DEFAULT_RECOMMENDED_TOOLTIP =
  "Recommended based on previous submissions and casting profile activity.";

export function RecommendedActorStar({ reasons }: { reasons?: string[] }) {
  const content =
    reasons && reasons.length > 0
      ? `Recommended: ${reasons.join(". ")}.`
      : DEFAULT_RECOMMENDED_TOOLTIP;

  return (
    <Tooltip content={content}>
      <Star
        className="h-3.5 w-3.5 shrink-0 fill-[#c8a86b] text-[#c8a86b]"
        aria-label="Recommended actor"
      />
    </Tooltip>
  );
}
