CREATE TABLE "RoleAuditionMaterialFile" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mimeType" TEXT,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleAuditionMaterialFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoleAuditionMaterialFile_roleId_fileName_key" ON "RoleAuditionMaterialFile"("roleId", "fileName");
CREATE INDEX "RoleAuditionMaterialFile_roleId_idx" ON "RoleAuditionMaterialFile"("roleId");

ALTER TABLE "RoleAuditionMaterialFile" ADD CONSTRAINT "RoleAuditionMaterialFile_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
