import { mergeAuditionFilesWithLocalUrls } from "@/lib/role-audition-files";
import { defaultRoleAuditionPackage } from "@/lib/default-role-audition-package";
import { getRoleAuditionPackage } from "@/lib/role-materials-storage";
import type { RoleAuditionFile, RoleAuditionPackage } from "@/types";

export function buildRoleAuditionPackageFromRole(role: {
  id: string;
  auditionInstructions: string;
  auditionFiles?: RoleAuditionFile[];
}): RoleAuditionPackage {
  const localPkg = getRoleAuditionPackage(role.id);

  let files: RoleAuditionFile[] = localPkg.files;
  if (role.auditionFiles && role.auditionFiles.length > 0) {
    files =
      localPkg.files.length > 0
        ? mergeAuditionFilesWithLocalUrls(role.auditionFiles, localPkg.files)
        : role.auditionFiles;
  }

  const instructions =
    role.auditionInstructions.trim() ||
    localPkg.instructions ||
    defaultRoleAuditionPackage.instructions;

  return {
    ...defaultRoleAuditionPackage,
    instructions,
    files,
  };
}
