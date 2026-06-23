-- Application submission items + profile views for analytics

CREATE TABLE IF NOT EXISTS "ApplicationSubmissionItem" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationSubmissionItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ApplicationSubmissionItem_applicationId_idx"
  ON "ApplicationSubmissionItem"("applicationId");

ALTER TABLE "ApplicationSubmissionItem" DROP CONSTRAINT IF EXISTS "ApplicationSubmissionItem_applicationId_fkey";
ALTER TABLE "ApplicationSubmissionItem" ADD CONSTRAINT "ApplicationSubmissionItem_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ProfileView" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "viewerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProfileView_actorUserId_idx" ON "ProfileView"("actorUserId");
CREATE INDEX IF NOT EXISTS "ProfileView_viewerUserId_idx" ON "ProfileView"("viewerUserId");

ALTER TABLE "ProfileView" DROP CONSTRAINT IF EXISTS "ProfileView_actorUserId_fkey";
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProfileView" DROP CONSTRAINT IF EXISTS "ProfileView_viewerUserId_fkey";
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerUserId_fkey"
  FOREIGN KEY ("viewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
