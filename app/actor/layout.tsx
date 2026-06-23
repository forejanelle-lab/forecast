import { auth } from "@/auth";
import { ActorCelebrationGate } from "@/components/actor/actor-celebration-gate";
import { ActorOnboardingGuard } from "@/components/auth/actor-onboarding-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ActorProfileProvider } from "@/components/providers/actor-profile-provider";
import { AuditionSubmissionsProvider } from "@/components/providers/audition-submissions-provider";
import { ActorMembershipProvider } from "@/components/providers/actor-membership-provider";
import { MessagesReadProvider } from "@/components/providers/messages-read-provider";
import { getAuditionsForActor, getActorMembership } from "@/lib/data/projects";
import { getConversationsForUser } from "@/lib/data/conversations";
import { getOnboardingComplete } from "@/lib/onboarding";
import { getInitials } from "@/lib/user";
import { redirect } from "next/navigation";

export default async function ActorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const onboardingComplete = await getOnboardingComplete(
    session.user.id,
    session.user.role,
  );

  if (!onboardingComplete) {
    redirect("/auth/actor-onboarding");
  }

  const initials = getInitials(session.user.name);
  const auditions = await getAuditionsForActor(session.user.id);
  const actorMembership = await getActorMembership(session.user.id);

  const conversations = await getConversationsForUser(session.user.id, "ACTOR");

  return (
    <ActorProfileProvider
      initials={initials}
      displayName={session.user.name ?? "Actor"}
    >
      <ActorMembershipProvider
        membership={actorMembership.membership}
        isPremium={actorMembership.isPremium}
        trialEndsAt={actorMembership.trialEndsAt ?? null}
      >
        <ActorOnboardingGuard
        userId={session.user.id}
        onboardingComplete={onboardingComplete}
      >
        <MessagesReadProvider initialConversations={conversations}>
          <AuditionSubmissionsProvider initialAuditions={auditions}>
            <DashboardShell
              role="actor"
              userName={session.user.name ?? "Actor"}
              userInitials={initials}
            >
              <ActorCelebrationGate />
              {children}
            </DashboardShell>
          </AuditionSubmissionsProvider>
        </MessagesReadProvider>
      </ActorOnboardingGuard>
      </ActorMembershipProvider>
    </ActorProfileProvider>
  );
}
