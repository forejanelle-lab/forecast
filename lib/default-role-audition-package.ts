import type { RoleAuditionPackage } from "@/types";

export const defaultRoleAuditionPackage: RoleAuditionPackage = {
  instructions:
    "Please prepare a self tape audition using the attached scenes. Focus on grounded, emotionally honest performances and keep your framing consistent across takes.",
  scenes: [
    "Scene 1 — Character introduction and emotional beat.",
    "Scene 2 — Conflict or turning point with a second character.",
  ],
  uploadRequirements: [
    "Landscape orientation, 1080p minimum",
    "Neutral background with clear lighting on your face",
    "Slate at the start with your name and role",
    "Upload via Fore Cast by the deadline below",
  ],
  files: [],
};

export { getRoleAuditionPackage } from "./role-materials-storage";
