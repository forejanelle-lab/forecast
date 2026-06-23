import { auth } from "@/auth";
import { ActorOnboardingForm } from "@/components/auth/actor-onboarding-form";
import { ActorOnboardingRedirect } from "@/components/auth/actor-onboarding-redirect";
import { getOnboardingComplete } from "@/lib/onboarding";
import { redirect } from "next/navigation";

export default async function ActorOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "ACTOR") {
    redirect("/casting");
  }

  const onboardingComplete = await getOnboardingComplete(
    session.user.id,
    session.user.role,
  );

  if (onboardingComplete) {
    redirect("/actor");
  }

  const displayName = session.user.name ?? "Actor";
  const userEmail = session.user.email ?? "";

  return (
    <ActorOnboardingRedirect
      userId={session.user.id}
      onboardingComplete={onboardingComplete}
    >
      <ActorOnboardingForm
        userId={session.user.id}
        displayName={displayName}
        userEmail={userEmail}
      />
    </ActorOnboardingRedirect>
  );
}
