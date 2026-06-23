import { auth } from "@/auth";
import { ActorDashboardClient } from "@/components/actor/actor-dashboard-client";
import { getActorProfileCompleteness } from "@/lib/data/actors";
import {
  getApplicationsForActor,
  getActorDashboardStats,
  getAuditionsForActor,
  getActorMembership,
} from "@/lib/data/projects";
import { redirect } from "next/navigation";

export default async function ActorDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const [stats, applications, auditions, membership, profileCompleteness] =
    await Promise.all([
      getActorDashboardStats(session.user.id),
      getApplicationsForActor(session.user.id),
      getAuditionsForActor(session.user.id),
      getActorMembership(session.user.id),
      getActorProfileCompleteness(session.user.id),
    ]);

  return (
    <ActorDashboardClient
      userName={session.user.name ?? "Actor"}
      userEmail={session.user.email}
      isEmailVerified={session.user.isEmailVerified}
      stats={stats}
      applications={applications}
      auditions={auditions}
      isPremium={membership.isPremium}
      missingProfileFields={profileCompleteness.missingFields}
    />
  );
}
