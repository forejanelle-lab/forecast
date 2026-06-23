import type { ApplicationStatus } from "@/types";

export function shouldAutoMarkReviewed(status: ApplicationStatus): boolean {
  return status === "submitted" || status === "audition_viewed";
}

export function autoReviewStatus(status: ApplicationStatus): ApplicationStatus {
  return shouldAutoMarkReviewed(status) ? "reviewing" : status;
}

export async function persistApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<boolean> {
  const response = await fetch(`/api/applications/${applicationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return response.ok;
}

export async function sendActorBooking({
  applicationId,
  auditionId,
  message,
}: {
  applicationId?: string;
  auditionId?: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, auditionId, message }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      return { ok: false, error: data.error ?? "Failed to book actor." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to book actor." };
  }
}

export async function persistAuditionReviewStatus(
  auditionId: string,
  status: ApplicationStatus,
): Promise<boolean> {
  const response = await fetch(`/api/auditions/${auditionId}/review-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return response.ok;
}
