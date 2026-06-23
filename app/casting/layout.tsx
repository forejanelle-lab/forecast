import { auth } from "@/auth";
import { CastingOnboardingGuard } from "@/components/auth/casting-onboarding-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AuditionSubmissionsProvider } from "@/components/providers/audition-submissions-provider";
import { CastingProfileProvider } from "@/components/providers/casting-profile-provider";
import { MessagesReadProvider } from "@/components/providers/messages-read-provider";
import { getOnboardingComplete } from "@/lib/onboarding";
import { getConversationsForUser } from "@/lib/data/conversations";
import { getInitials } from "@/lib/user";
import { redirect } from "next/navigation";

export default async function CastingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const displayName = session?.user?.name ?? "Casting Director";
  const userId = session?.user?.id;

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const onboardingComplete = await getOnboardingComplete(
    session.user.id,
    session.user.role,
  );

  if (!onboardingComplete) {
    redirect("/auth/casting-onboarding");
  }

  const conversations = await getConversationsForUser(session.user.id, "CASTING");

  return (
    <CastingOnboardingGuard userId={userId} onboardingComplete={onboardingComplete}>
      <CastingProfileProvider displayName={displayName}>
        <AuditionSubmissionsProvider>
          <MessagesReadProvider initialConversations={conversations}>
            <DashboardShell
              role="casting"
              userName={displayName}
              userInitials={getInitials(displayName)}
            >
              {children}
            </DashboardShell>
          </MessagesReadProvider>
        </AuditionSubmissionsProvider>
      </CastingProfileProvider>
    </CastingOnboardingGuard>
  );
}
