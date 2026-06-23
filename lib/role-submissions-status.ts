import type { RoleStatus } from "@/types";

export function roleAcceptsSubmissions(status: RoleStatus): boolean {
  return status === "open";
}

export function roleSubmissionsTag(status: RoleStatus) {
  if (roleAcceptsSubmissions(status)) {
    return {
      label: "Accepting submissions",
      variant: "success" as const,
    };
  }

  return {
    label: "Not accepting submissions",
    variant: "warning" as const,
  };
}
