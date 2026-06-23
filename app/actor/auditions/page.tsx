import { auth } from "@/auth";
import { AuditionsContent } from "@/components/pages/auditions-content";
import { getAuditionsForActor } from "@/lib/data/projects";
import { redirect } from "next/navigation";

export default async function AuditionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const auditions = await getAuditionsForActor(session.user.id);

  return <AuditionsContent auditions={auditions} />;
}
