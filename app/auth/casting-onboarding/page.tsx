import { auth } from "@/auth";
import { CastingOnboardingForm } from "@/components/auth/casting-onboarding-form";
import { CastingOnboardingRedirect } from "@/components/auth/casting-onboarding-redirect";
import { getOnboardingComplete } from "@/lib/onboarding";
import { redirect } from "next/navigation";

export default async function CastingOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "CASTING") {
    redirect("/actor");
  }

  const onboardingComplete = await getOnboardingComplete(
    session.user.id,
    session.user.role,
  );

  if (onboardingComplete) {
    redirect("/casting");
  }

  const displayName = session.user.name ?? "Casting Director";

  return (
    <CastingOnboardingRedirect
      userId={session.user.id}
      onboardingComplete={onboardingComplete}
    >
      <CastingOnboardingForm
        userId={session.user.id}
        displayName={displayName}
      />
    </CastingOnboardingRedirect>
  );
}
