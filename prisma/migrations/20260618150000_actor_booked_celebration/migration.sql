ALTER TABLE "ActorProfile" ADD COLUMN IF NOT EXISTS "pendingBookedCelebration" BOOLEAN NOT NULL DEFAULT false;
