import { auth } from "@/auth";
import { CastingSubmissionsContent } from "@/components/casting/casting-submissions-content";
import { getBookingOfferSentKeysForCasting } from "@/lib/casting-submission-actions";
import { getAuditionsForCasting } from "@/lib/data/projects";
import { getBookedActorsByRoleForCasting } from "@/lib/role-booking";
import { redirect } from "next/navigation";

export default async function CastingSubmissionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const auditions = await getAuditionsForCasting(session.user.id);
  const bookedActorsByRole = await getBookedActorsByRoleForCasting(session.user.id);
  const bookingOfferSentKeys = await getBookingOfferSentKeysForCasting(session.user.id);

  return (
    <CastingSubmissionsContent
      initialAuditions={auditions}
      bookedActorsByRole={bookedActorsByRole}
      bookingOfferSentKeys={bookingOfferSentKeys}
    />
  );
}
