"use client";

import { Badge } from "@/components/ui/badge";
import {
  getEffectiveRoleStatus,
  subscribeRoleAcceptance,
} from "@/lib/role-acceptance-storage";
import { roleSubmissionsTag } from "@/lib/role-submissions-status";
import type { RoleStatus } from "@/types";
import { useSyncExternalStore } from "react";

export function RoleAcceptanceBadge({
  roleId,
  fallbackStatus,
  className,
}: {
  roleId: string;
  fallbackStatus: RoleStatus;
  className?: string;
}) {
  const status = useSyncExternalStore(
    subscribeRoleAcceptance,
    () => getEffectiveRoleStatus(roleId, fallbackStatus),
    () => fallbackStatus,
  );
  const tag = roleSubmissionsTag(status);

  return (
    <Badge variant={tag.variant} className={className}>
      {tag.label}
    </Badge>
  );
}
