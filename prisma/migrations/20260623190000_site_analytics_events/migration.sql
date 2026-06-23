CREATE TABLE IF NOT EXISTS "SiteAnalyticsEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL DEFAULT 'pageview',
  "path" TEXT NOT NULL,
  "referrer" TEXT,
  "country" TEXT,
  "sessionId" TEXT NOT NULL,
  "deviceId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'app',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SiteAnalyticsEvent_createdAt_idx" ON "SiteAnalyticsEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "SiteAnalyticsEvent_path_idx" ON "SiteAnalyticsEvent"("path");
CREATE INDEX IF NOT EXISTS "SiteAnalyticsEvent_sessionId_idx" ON "SiteAnalyticsEvent"("sessionId");
CREATE INDEX IF NOT EXISTS "SiteAnalyticsEvent_country_idx" ON "SiteAnalyticsEvent"("country");
