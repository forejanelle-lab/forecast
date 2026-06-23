import { auth } from "@/auth";
import { SearchRolesContent } from "@/components/pages/search-roles-content";
import { getActorProfileByUserId } from "@/lib/data/actors";
import {
  getActiveProjectsForActors,
  getOpenRolesForActors,
} from "@/lib/data/projects";
import { redirect } from "next/navigation";

export default async function ActorSearchPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const [roles, projects, actorProfile] = await Promise.all([
    getOpenRolesForActors(),
    getActiveProjectsForActors(),
    getActorProfileByUserId(session.user.id),
  ]);

  return (
    <SearchRolesContent
      roles={roles}
      projects={projects}
      actorProfile={
        actorProfile
          ? {
              playingAge: actorProfile.playingAge,
              gender: actorProfile.gender ?? "",
            }
          : null
      }
    />
  );
}
