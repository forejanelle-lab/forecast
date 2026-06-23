import type { Message } from "@/types";

export function isSubmissionDeadlinePassed(deadline: string): boolean {
  if (!deadline?.trim()) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = deadline.split("-").map(Number);
  if (!year || !month || !day) return false;
  const deadlineDate = new Date(year, month - 1, day);
  return deadlineDate < today;
}

/** Actors may only reply after casting has initiated the thread. */
export function canActorSendMessage(conversation: Message): boolean {
  return conversation.castingDirectorReachedOut;
}

/** Casting can message on active projects until the submission deadline. */
export function canCastingSendMessage(conversation: Message): boolean {
  if (conversation.projectStatus !== "active") return false;
  if (isSubmissionDeadlinePassed(conversation.submissionDeadline)) return false;
  return true;
}

/** Casting can always message actors they have already requested or booked on a role. */
export function canCastingMessageActorForSubmission(context: {
  projectStatus: Message["projectStatus"];
  submissionDeadline: string;
  auditionRequested?: boolean;
  bookingOfferSent?: boolean;
}): boolean {
  if (context.auditionRequested || context.bookingOfferSent) return true;
  if (context.projectStatus !== "active") return false;
  if (isSubmissionDeadlinePassed(context.submissionDeadline)) return false;
  return true;
}

export function getActorSendDisabledReason(conversation: Message): string | null {
  if (!conversation.castingDirectorReachedOut) {
    return "You can reply after a casting director messages you about this project.";
  }
  return null;
}

export function getCastingSendDisabledReason(conversation: Message): string | null {
  if (conversation.projectStatus !== "active") {
    return "This project is no longer active. Messaging is closed.";
  }
  if (isSubmissionDeadlinePassed(conversation.submissionDeadline)) {
    return "The submission deadline has passed. Messaging is closed.";
  }
  return null;
}
