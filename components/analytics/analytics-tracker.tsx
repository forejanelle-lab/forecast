"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

const SESSION_KEY = "forecast-analytics-session";
const DEVICE_KEY = "forecast-analytics-device";

function randomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateId(key: string): string {
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = randomId();
  localStorage.setItem(key, id);
  return id;
}

function AnalyticsTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/api/")) return;

    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    if (lastTracked.current === path) return;
    lastTracked.current = path;

    const sessionId = getOrCreateId(SESSION_KEY);
    const deviceId = getOrCreateId(DEVICE_KEY);

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        referrer: document.referrer || null,
        sessionId,
        deviceId,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerInner />
    </Suspense>
  );
}
