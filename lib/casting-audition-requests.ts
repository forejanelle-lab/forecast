export interface AuditionRequestPayload {
  roleId: string;
  actorId: string;
  deadline?: string;
  location?: string;
  instructions?: string;
  scenes?: string[];
  uploadRequirements?: string[];
}

export async function postAuditionRequest(
  payload: AuditionRequestPayload,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/auditions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      return { ok: false, error: data.error ?? "Failed to send audition request." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to send audition request." };
  }
}
