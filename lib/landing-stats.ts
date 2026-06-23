import { getActiveActorAccountCount } from "@/lib/data/actors";
import { landingStats } from "@/lib/marketing-content";

export async function getActiveActorStatValue(): Promise<string> {
  try {
    const count = await getActiveActorAccountCount();
    return (count + 20).toLocaleString("en-US");
  } catch {
    return "20";
  }
}

export async function getLandingStats() {
  const activeActorsValue = await getActiveActorStatValue();

  return [
    { value: activeActorsValue, label: "Active Actors" },
    ...landingStats.slice(1),
  ];
}
