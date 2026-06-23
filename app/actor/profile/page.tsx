import { auth } from "@/auth";
import { ProfileContent, type ProfileInitialData } from "@/components/pages/profile-content";
import { getActorProfileByUserId } from "@/lib/data/actors";
import { getActorMembership } from "@/lib/data/projects";
import { redirect } from "next/navigation";

function mapProfileInitial(
  profile: NonNullable<Awaited<ReturnType<typeof getActorProfileByUserId>>>,
  membership: string,
): ProfileInitialData {
  return {
    location: profile.location,
    playingAgeMin:
      profile.playingAgeMin != null ? String(profile.playingAgeMin) : "",
    playingAgeMax:
      profile.playingAgeMax != null ? String(profile.playingAgeMax) : "",
    height: profile.height ?? "",
    gender: profile.gender ?? "",
    unionStatus: profile.unionStatus,
    bio: profile.bio,
    membership,
    credits: profile.credits,
    skills: profile.skills,
    languages: profile.languages,
    links: profile.links,
    headshots: profile.headshots,
    media: profile.media,
  };
}

export default async function ActorProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const [profile, membershipInfo] = await Promise.all([
    getActorProfileByUserId(session.user.id),
    getActorMembership(session.user.id),
  ]);

  const initialProfile = profile
    ? mapProfileInitial(profile, membershipInfo.membership)
    : null;

  return <ProfileContent userId={session.user.id} initialProfile={initialProfile} />;
}
