export function castingSubmissionActionKey(roleId: string, actorId: string): string {
  return `${roleId}:${actorId}`;
}
