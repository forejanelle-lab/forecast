export type UserRole = "actor" | "casting";

export type ProjectStatus = "active" | "archived" | "completed" | "draft";

export type RoleStatus = "open" | "closed" | "casting" | "filled";

export type ApplicationStatus =
  | "submitted"
  | "audition_viewed"
  | "reviewing"
  | "audition_requested"
  | "callback"
  | "rejected"
  | "accepted";

export type AuditionStatus =
  | "requested"
  | "submitted"
  | "declined"
  | "withdrawn"
  | "accepted";

export interface AuditionSubmissionItem {
  fileName: string;
  label: string;
  fileUrl?: string;
}

export interface AuditionSubmission {
  submittedAt: string;
  items: AuditionSubmissionItem[];
}

export interface Actor {
  id: string;
  name: string;
  headshot: string;
  playingAge: string;
  location: string;
  unionStatus: string;
  skills: string[];
  featured?: boolean;
  verified?: boolean;
}

export interface CastingActorProfile extends Actor {
  bio: string;
  photoUrl?: string;
  height?: string;
  playingAgeMin?: number | null;
  playingAgeMax?: number | null;
  gender?: string;
  membership?: string;
  credits: ActorCredit[];
  languages: string[];
  links: ActorLink[];
  headshots: ActorHeadshot[];
  media: ActorMediaItem[];
}

export interface SearchableCastingActor extends CastingActorProfile {
  castingProfileViews: number;
  popular: boolean;
}

export interface ActorHeadshot {
  id: string;
  label: string;
  initials: string;
  featured?: boolean;
  previewUrl?: string;
  fileName?: string;
}

export interface ActorMediaItem {
  id: string;
  label: string;
  type: "video" | "audio" | "document";
  duration?: string;
  previewUrl?: string;
  fileName?: string;
}

export interface ActorCredit {
  id: string;
  title: string;
  role: string;
  type: string;
  year: string;
}

export interface ActorLink {
  id: string;
  label: string;
  url: string;
}

export interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  productionCompany: string;
  castingOffice: string;
  projectType: string;
  unionStatus: string;
  location: string;
  region: "LA" | "NY" | "Atlanta";
  castingDirector: string;
  submissionDeadline: string;
  shootDates: string;
  compensation: string;
  description: string;
  roleCount: number;
  submissionCount: number;
}

export interface Role {
  id: string;
  projectId: string;
  projectTitle: string;
  characterName: string;
  playingAge: string;
  gender: string;
  ethnicity: string;
  roleType: string;
  compensation: string;
  shootDates: string;
  submissionDeadline: string;
  postedAt: string;
  description: string;
  auditionInstructions: string;
  auditionFiles?: RoleAuditionFile[];
  submissionCount: number;
  status: RoleStatus;
}

export interface RoleAuditionFile {
  label: string;
  fileName: string;
  type: RoleSubmissionItem["type"];
  fileUrl?: string;
}

export interface RoleAuditionPackage {
  instructions: string;
  scenes: string[];
  uploadRequirements: string[];
  files: RoleAuditionFile[];
}

export interface RoleSubmissionItem {
  label: string;
  fileName: string;
  type: "video" | "audio" | "image" | "document";
  fileUrl?: string;
}

export interface RoleSubmission {
  id: string;
  roleId: string;
  actorId: string;
  actorName: string;
  actorInitials: string;
  actorPhotoUrl?: string;
  submittedAt: string;
  status: ApplicationStatus;
  items: RoleSubmissionItem[];
  note?: string;
  unionStatus?: string;
  playingAge?: string;
  auditionRequested?: boolean;
  bookingOfferSent?: boolean;
}

export interface Application {
  id: string;
  roleId: string;
  roleName: string;
  projectTitle: string;
  status: ApplicationStatus;
  submittedAt: string;
  productionCompany: string;
  note?: string;
  items?: RoleSubmissionItem[];
}

export interface Audition {
  id: string;
  roleId?: string;
  projectId?: string;
  actorId?: string;
  actorName?: string;
  actorInitials?: string;
  actorPhotoUrl?: string;
  roleName: string;
  projectTitle: string;
  status: AuditionStatus;
  deadline: string;
  location: string;
  castingDirector: string;
  requestedAt: string;
  instructions: string;
  scenes?: string[];
  uploadRequirements?: string[];
  materials?: RoleAuditionFile[];
  submission?: AuditionSubmission;
  shootDates?: string;
  projectLocation?: string;
  submissionDeadline?: string;
}

export interface ConversationMessage {
  id: string;
  from: "casting" | "actor";
  body: string;
  timestamp: string;
}

export interface Message {
  id: string;
  sender: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  avatar: string;
  projectId: string;
  projectTitle: string;
  productionCompany: string;
  projectStatus: ProjectStatus;
  submissionDeadline: string;
  castingDirectorReachedOut: boolean;
  actorId?: string;
  actorName?: string;
  actorPhotoUrl?: string;
  castingDirectorName?: string;
  castingDirectorPhotoUrl?: string;
  thread: ConversationMessage[];
}

export interface Notification {
  id: string;
  category: "applications" | "auditions" | "projects" | "messages" | "system" | "billing";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
