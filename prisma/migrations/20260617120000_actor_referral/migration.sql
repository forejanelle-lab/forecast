-- Actor referral (onboarding trial step) + trial dates on actor profile

ALTER TABLE "ActorProfile" ADD COLUMN IF NOT EXISTS "trialStartedAt" TIMESTAMP(3);
ALTER TABLE "ActorProfile" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "ActorReferral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredName" TEXT NOT NULL,
    "referredEmail" TEXT NOT NULL,
    "trialStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActorReferral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ActorReferral_referrerId_key" ON "ActorReferral"("referrerId");
CREATE INDEX IF NOT EXISTS "ActorReferral_referredEmail_idx" ON "ActorReferral"("referredEmail");

ALTER TABLE "ActorReferral" DROP CONSTRAINT IF EXISTS "ActorReferral_referrerId_fkey";
ALTER TABLE "ActorReferral" ADD CONSTRAINT "ActorReferral_referrerId_fkey"
  FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
