"use client";

import { useCallback } from "react";
import { trackBusinessEvent, type ClientAnalyticsMetadata } from "@/lib/analytics/client";
import type { BusinessAnalyticsEventType } from "@prisma/client";

export function useAnalytics() {
  const trackEvent = useCallback(
    (eventType: BusinessAnalyticsEventType, metadata?: ClientAnalyticsMetadata) => {
      void trackBusinessEvent(eventType, metadata);
    },
    [],
  );

  return { trackEvent };
}
