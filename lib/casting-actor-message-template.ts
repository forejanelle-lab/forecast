export function buildCastingActorMessageTemplate({
  actorName,
  roleName,
  projectTitle,
  castingDirector,
}: {
  actorName: string;
  roleName: string;
  projectTitle: string;
  castingDirector: string;
}) {
  return `Hi ${actorName},

Thank you for submitting your audition materials for ${roleName} in ${projectTitle}. We wanted to reach out with a quick note as we review submissions.

[Add your message here — availability, callback details, or follow-up questions.]

Best,
${castingDirector}`;
}

export const CASTING_ACTOR_MESSAGE_PLACEHOLDER =
  "Share callback details, availability questions, or next steps...";
