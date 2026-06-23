CREATE TYPE "BusinessAnalyticsEventType" AS ENUM (
  'SIGNUP',
  'LOGIN',
  'ACTOR_REGISTRATION',
  'CASTING_REGISTRATION',
  'PROFILE_COMPLETION',
  'PROJECT_CREATION',
  'ROLE_CREATION',
  'APPLICATION_SUBMITTED',
  'AUDITION_REQUEST_SENT',
  'MESSAGE_SENT',
  'PREMIUM_UPGRADE'
);

CREATE TABLE IF NOT EXISTS "BusinessAnalyticsEvent" (
  "id" TEXT NOT NULL,
  "eventType" "BusinessAnalyticsEventType" NOT NULL,
  "userId" TEXT,
  "userRole" "UserRole",
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BusinessAnalyticsEvent_eventType_idx" ON "BusinessAnalyticsEvent"("eventType");
CREATE INDEX IF NOT EXISTS "BusinessAnalyticsEvent_createdAt_idx" ON "BusinessAnalyticsEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "BusinessAnalyticsEvent_eventType_createdAt_idx" ON "BusinessAnalyticsEvent"("eventType", "createdAt");
