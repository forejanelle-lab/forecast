import { auth } from "@/auth";
import { CastingSettingsContent } from "@/components/casting/casting-settings-content";

export default async function CastingSettingsPage() {
  const session = await auth();
  const email = session?.user?.email ?? "rachel@forecast.com";
  const displayName = session?.user?.name ?? "Rachel Morrison";

  return (
    <CastingSettingsContent email={email} displayName={displayName} />
  );
}
