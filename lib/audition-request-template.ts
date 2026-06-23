import type { RoleAuditionPackage } from "@/types";

export function buildAuditionRequestTemplate({
  actorName,
  characterName,
  projectTitle,
  castingDirector,
  auditionPackage,
}: {
  actorName: string;
  characterName: string;
  projectTitle: string;
  castingDirector: string;
  auditionPackage: RoleAuditionPackage;
}) {
  return `Hi ${actorName},

Thank you for your submission for ${characterName} in ${projectTitle}. We'd love to invite you to submit a self tape audition.

${auditionPackage.instructions}

Please upload your audition through Fore Cast by the deadline below. Reply here if you have any questions.

Best,
${castingDirector}`;
}
