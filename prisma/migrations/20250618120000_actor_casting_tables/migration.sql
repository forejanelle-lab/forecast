-- Actor & casting profile tables, messaging, and audition submission items

-- Application status values used in the app
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'AUDITION_VIEWED';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'AUDITION_REQUESTED';

-- Audition status alignment
ALTER TYPE "AuditionStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';

-- Actor profile extensions
ALTER TABLE "ActorProfile" ADD COLUMN IF NOT EXISTS "locations" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "ActorProfile" ADD COLUMN IF NOT EXISTS "height" TEXT;
ALTER TABLE "ActorProfile" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "ActorProfile" ADD COLUMN IF NOT EXISTS "profilePhotoUrl" TEXT;
ALTER TABLE "ActorProfile" ADD COLUMN IF NOT EXISTS "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- Casting profile extensions
ALTER TABLE "CastingProfile" ADD COLUMN IF NOT EXISTS "officeName" TEXT;
ALTER TABLE "CastingProfile" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE "CastingProfile" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "CastingProfile" ADD COLUMN IF NOT EXISTS "profilePhotoUrl" TEXT;
ALTER TABLE "CastingProfile" ADD COLUMN IF NOT EXISTS "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- Audition request details
ALTER TABLE "Audition" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "Audition" ADD COLUMN IF NOT EXISTS "scenes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Audition" ADD COLUMN IF NOT EXISTS "uploadRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Audition" ADD COLUMN IF NOT EXISTS "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Actor media enums
CREATE TYPE "ActorMediaType" AS ENUM ('VIDEO', 'AUDIO', 'DOCUMENT');
CREATE TYPE "ActorMediaCategory" AS ENUM ('MATERIAL', 'VIDEO');

-- Actor headshots (up to 2 in onboarding)
CREATE TABLE "ActorHeadshot" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "fileName" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActorHeadshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActorHeadshot_actorId_idx" ON "ActorHeadshot"("actorId");

ALTER TABLE "ActorHeadshot" ADD CONSTRAINT "ActorHeadshot_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "ActorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Actor media (demo reels, videos, audio, documents)
CREATE TABLE "ActorMedia" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "ActorMediaType" NOT NULL,
    "category" "ActorMediaCategory" NOT NULL DEFAULT 'MATERIAL',
    "url" TEXT,
    "fileName" TEXT,
    "duration" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActorMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActorMedia_actorId_idx" ON "ActorMedia"("actorId");

ALTER TABLE "ActorMedia" ADD CONSTRAINT "ActorMedia_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "ActorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Actor profile links (IMDb, website, demo reel links)
CREATE TABLE "ActorLink" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActorLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActorLink_actorId_idx" ON "ActorLink"("actorId");

ALTER TABLE "ActorLink" ADD CONSTRAINT "ActorLink_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "ActorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Audition self-tape submission files
CREATE TABLE "AuditionSubmissionItem" (
    "id" TEXT NOT NULL,
    "auditionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditionSubmissionItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditionSubmissionItem_auditionId_idx" ON "AuditionSubmissionItem"("auditionId");

ALTER TABLE "AuditionSubmissionItem" ADD CONSTRAINT "AuditionSubmissionItem_auditionId_fkey"
  FOREIGN KEY ("auditionId") REFERENCES "Audition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Casting ↔ actor conversations per project
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "castingUserId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversation_projectId_actorUserId_key" ON "Conversation"("projectId", "actorUserId");
CREATE INDEX "Conversation_actorUserId_idx" ON "Conversation"("actorUserId");
CREATE INDEX "Conversation_castingUserId_idx" ON "Conversation"("castingUserId");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_castingUserId_fkey"
  FOREIGN KEY ("castingUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Thread messages inside a conversation
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConversationMessage_conversationId_idx" ON "ConversationMessage"("conversationId");
CREATE INDEX "ConversationMessage_senderId_idx" ON "ConversationMessage"("senderId");

ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
