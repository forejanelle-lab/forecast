export function buildBookingMessageTemplate({
  actorName,
  characterName,
  projectTitle,
  castingDirector,
  shootDates,
}: {
  actorName: string;
  characterName: string;
  projectTitle: string;
  castingDirector: string;
  shootDates?: string;
}) {
  const scheduleLine = shootDates
    ? `Our team will follow up shortly with offer details, shoot schedule (${shootDates}), and onboarding paperwork.`
    : "Our team will follow up shortly with offer details, shoot schedule, and onboarding paperwork.";

  return `Hi ${actorName},

Congratulations! We'd like to book you for ${characterName} in ${projectTitle}.

We're thrilled with your work and would love to have you join the production. ${scheduleLine}

Please reply to confirm your availability and let us know if you have any questions.

Warm congratulations again,
${castingDirector}`;
}

export const BOOKING_MESSAGE_PLACEHOLDER =
  "Congratulations! We'd like to offer you the role of...";
