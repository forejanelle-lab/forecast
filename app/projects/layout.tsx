import { auth } from "@/auth";
import { CastingOnboardingGuard } from "@/components/auth/casting-onboarding-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MessagesReadProvider } from "@/components/providers/messages-read-provider";
import { getOnboardingComplete } from "@/lib/onboarding";
import { getInitials } from "@/lib/user";
import { redirect } from "next/navigation";

export default async function ProjectsLayout({
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
    redirect("/auth/casting-onboarding");
  }

  return (
    <CastingOnboardingGuard
      userId={session.user.id}
      onboardingComplete={onboardingComplete}
    >
      <MessagesReadProvider>
        <DashboardShell
          role="casting"
          userName={session.user.name ?? "Casting Director"}
          userInitials={getInitials(session.user.name)}
        >
          {children}
        </DashboardShell>
      </MessagesReadProvider>
    </CastingOnboardingGuard>
  );
}
