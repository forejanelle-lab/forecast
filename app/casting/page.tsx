import { auth } from "@/auth";
import { CastingDashboardContent } from "@/components/casting/dashboard/casting-dashboard-content";
import { EmailVerificationBanner } from "@/components/auth/email-verification-banner";
import {
  getCastingDashboardData,
} from "@/lib/data/projects";

export default async function CastingDashboard() {
  const session = await auth();
  const userName = session?.user?.name ?? "Casting Director";
  const directorName = userName.split(" ")[0];

  const dashboardData = session?.user
    ? await getCastingDashboardData(session.user.id)
    : null;
  const stats = dashboardData?.stats ?? null;
  const projectPerformance = dashboardData?.projectPerformance ?? [];

  return (
    <div className="space-y-6">
      {session?.user && !session.user.isEmailVerified && (
        <EmailVerificationBanner email={session.user.email} />
      )}
      <CastingDashboardContent
        directorName={directorName}
        stats={stats}
        projectPerformance={projectPerformance}
      />
    </div>
  );
}
