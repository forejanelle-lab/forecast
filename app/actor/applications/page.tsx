import { auth } from "@/auth";
import { ActorSubmissionsContent } from "@/components/actor/actor-submissions-content";
import {
  getApplicationsForActor,
  getAuditionsForActor,
} from "@/lib/data/projects";
import { redirect } from "next/navigation";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const [applications, auditions] = await Promise.all([
    getApplicationsForActor(session.user.id),
    getAuditionsForActor(session.user.id),
  ]);

  return (
    <ActorSubmissionsContent
      initialApplications={applications}
      initialAuditions={auditions}
    />
  );
}
