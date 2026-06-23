const STORAGE_KEY = "forecast-actor-trial";

export interface ActorTrialData {
  referralName: string;
  referralEmail: string;
  trialStartedAt: string;
  trialEndsAt: string;
  membership: "PREMIUM";
}

export function readActorTrial(): ActorTrialData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActorTrialData;
  } catch {
    return null;
  }
}

export function writeActorTrial(data: ActorTrialData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function hasActorTrialReferral(): boolean {
  return readActorTrial() !== null;
}

export function isActorTrialActive(): boolean {
  const trial = readActorTrial();
  if (!trial) return false;
  return new Date(trial.trialEndsAt) > new Date();
}

export function syncActorTrialFromServer(data: {
  referredName: string;
  referredEmail: string;
  trialStartedAt: string;
  trialEndsAt: string;
  membership: "PREMIUM";
}): ActorTrialData {
  const trialData: ActorTrialData = {
    referralName: data.referredName,
    referralEmail: data.referredEmail,
    trialStartedAt: data.trialStartedAt,
    trialEndsAt: data.trialEndsAt,
    membership: data.membership,
  };

  writeActorTrial(trialData);
  return trialData;
}

export function activateActorTrial(referralName: string, referralEmail: string): ActorTrialData {
  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt);
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  return syncActorTrialFromServer({
    referredName: referralName.trim(),
    referredEmail: referralEmail.trim().toLowerCase(),
    trialStartedAt: trialStartedAt.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
    membership: "PREMIUM",
  });
}

export function getActorMembershipLabel(): string {
  const trial = readActorTrial();
  if (trial && isActorTrialActive()) return "Premium";
  return "Free";
}
