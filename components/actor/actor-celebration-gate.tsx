"use client";

import { AuditionCelebration } from "@/components/actor/audition-celebration";
import type { AuditionCelebrationData } from "@/components/actor/audition-celebration";
import { BookedCelebration } from "@/components/actor/booked-celebration";
import { useCallback, useEffect, useState } from "react";

type CelebrationPhase = "idle" | "booked" | "audition";

type AuditionCelebrationResponse = {
  pending?: boolean;
  requestedCount?: number;
  audition?: AuditionCelebrationData;
};

export function ActorCelebrationGate() {
  const [phase, setPhase] = useState<CelebrationPhase>("idle");
  const [auditionCelebration, setAuditionCelebration] =
    useState<AuditionCelebrationResponse | null>(null);

  const loadAuditionCelebration = useCallback(async () => {
    try {
      const response = await fetch("/api/actor/audition-celebration");
      const data = (await response.json()) as AuditionCelebrationResponse;
      if (data.pending && data.audition) {
        setAuditionCelebration(data);
        setPhase("audition");
        return;
      }
      setPhase("idle");
    } catch {
      setPhase("idle");
    }
  }, []);

  useEffect(() => {
    fetch("/api/actor/celebration")
      .then((response) => response.json())
      .then((data: { pending?: boolean }) => {
        if (data.pending) {
          setPhase("booked");
          return;
        }
        void loadAuditionCelebration();
      })
      .catch(() => {
        void loadAuditionCelebration();
      });
  }, [loadAuditionCelebration]);

  const handleBookedComplete = useCallback(() => {
    setPhase("idle");
    fetch("/api/actor/celebration", { method: "POST" }).catch(() => {});
    void loadAuditionCelebration();
  }, [loadAuditionCelebration]);

  const handleAuditionDismiss = useCallback(() => {
    setPhase("idle");
    setAuditionCelebration(null);
    fetch("/api/actor/audition-celebration", { method: "POST" }).catch(() => {});
  }, []);

  if (phase === "booked") {
    return <BookedCelebration onComplete={handleBookedComplete} />;
  }

  if (phase === "audition" && auditionCelebration?.audition) {
    return (
      <AuditionCelebration
        audition={auditionCelebration.audition}
        requestedCount={auditionCelebration.requestedCount ?? 1}
        onDismiss={handleAuditionDismiss}
      />
    );
  }

  return null;
}
