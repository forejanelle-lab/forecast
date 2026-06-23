"use client";

import { createClientStoreSnapshot } from "@/lib/client-store-snapshot";
import { emitClientStoreChange } from "@/lib/client-store-subscribe";
import {
  buildInitialSubmissionsState,
  buildServerSubmissionsState,
  writeStoredSubmissions,
} from "@/lib/audition-submission-storage";
import type {
  Audition,
  AuditionStatus,
  AuditionSubmission,
  AuditionSubmissionItem,
} from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

interface AuditionSubmissionsContextValue {
  getSubmission: (auditionId: string) => AuditionSubmission | undefined;
  isSubmitted: (auditionId: string, status: AuditionStatus) => boolean;
  submitAudition: (auditionId: string, items: AuditionSubmissionItem[]) => void;
  auditionCount: number;
}

const AuditionSubmissionsContext = createContext<AuditionSubmissionsContextValue | null>(
  null,
);

export function AuditionSubmissionsProvider({
  children,
  initialAuditions = [],
}: {
  children: React.ReactNode;
  initialAuditions?: Audition[];
}) {
  const submissionsStore = useMemo(
    () =>
      createClientStoreSnapshot({
        buildServerSnapshot: () => buildServerSubmissionsState(initialAuditions),
        buildClientSnapshot: () => buildInitialSubmissionsState(initialAuditions),
      }),
    [initialAuditions],
  );

  const submissions = useSyncExternalStore(
    submissionsStore.subscribe,
    submissionsStore.getSnapshot,
    submissionsStore.getServerSnapshot,
  );

  const getSubmission = useCallback(
    (auditionId: string) => submissions[auditionId],
    [submissions],
  );

  const isSubmitted = useCallback(
    (auditionId: string, status: AuditionStatus) =>
      status === "submitted" || !!submissions[auditionId],
    [submissions],
  );

  const submitAudition = useCallback(
    (auditionId: string, items: AuditionSubmissionItem[]) => {
      const submission: AuditionSubmission = {
        submittedAt: new Date().toISOString(),
        items,
      };
      const current = buildInitialSubmissionsState(initialAuditions);
      const next = { ...current, ...submissions, [auditionId]: submission };
      writeStoredSubmissions(next);
      emitClientStoreChange();
    },
    [initialAuditions, submissions],
  );

  const value = useMemo(
    () => ({
      getSubmission,
      isSubmitted,
      submitAudition,
      auditionCount: initialAuditions.filter(
        (audition) =>
          audition.status === "requested" && !isSubmitted(audition.id, audition.status),
      ).length,
    }),
    [getSubmission, isSubmitted, submitAudition, initialAuditions, submissions],
  );

  return (
    <AuditionSubmissionsContext.Provider value={value}>
      {children}
    </AuditionSubmissionsContext.Provider>
  );
}

export function useAuditionSubmissions() {
  const context = useContext(AuditionSubmissionsContext);
  if (!context) {
    throw new Error(
      "useAuditionSubmissions must be used within AuditionSubmissionsProvider",
    );
  }
  return context;
}

export function useAuditionSubmissionsOptional() {
  return useContext(AuditionSubmissionsContext);
}
