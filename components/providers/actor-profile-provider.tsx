"use client";

import { createClientStoreSnapshot } from "@/lib/client-store-snapshot";
import { emitClientStoreChange } from "@/lib/client-store-subscribe";
import {
  fileToDataUrl,
  readStoredDisplayName,
  readStoredProfilePhoto,
  writeStoredDisplayName,
  writeStoredProfilePhoto,
} from "@/lib/actor-profile-storage";
import {
  readStoredActorSettings,
  writeStoredActorSettings,
} from "@/lib/actor-settings-storage";
import { getInitials } from "@/lib/user";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

interface ActorProfileSnapshot {
  displayName: string;
  profilePhotoUrl: string | null;
  profilePhotoFileName: string | null;
}

interface ActorProfileContextValue {
  initials: string;
  displayName: string;
  profilePhotoUrl: string | null;
  profilePhotoFileName: string | null;
  setProfilePhotoFromFile: (file: File) => Promise<void>;
  setDisplayName: (name: string) => void;
}

const ActorProfileContext = createContext<ActorProfileContextValue | null>(null);

function readClientProfileSnapshot(fallbackName: string): ActorProfileSnapshot {
  const settings = readStoredActorSettings();
  const storedPhoto = readStoredProfilePhoto();
  const storedName = readStoredDisplayName();
  const displayName = storedName ?? fallbackName;
  const profilePhotoUrl =
    settings.profilePhotoUrl ?? storedPhoto?.dataUrl ?? null;
  const profilePhotoFileName =
    settings.profilePhotoFileName ?? storedPhoto?.fileName ?? null;
  return {
    displayName,
    profilePhotoUrl,
    profilePhotoFileName,
  };
}

function buildServerProfileSnapshot(fallbackName: string): ActorProfileSnapshot {
  return {
    displayName: fallbackName,
    profilePhotoUrl: null,
    profilePhotoFileName: null,
  };
}

export function ActorProfileProvider({
  children,
  initials: initialsProp,
  displayName: displayNameProp,
}: {
  children: React.ReactNode;
  initials?: string;
  displayName?: string;
}) {
  const fallbackName = displayNameProp ?? "Actor";
  const profileStore = useMemo(
    () =>
      createClientStoreSnapshot({
        buildServerSnapshot: () => buildServerProfileSnapshot(fallbackName),
        buildClientSnapshot: () => readClientProfileSnapshot(fallbackName),
      }),
    [fallbackName],
  );

  const profile = useSyncExternalStore(
    profileStore.subscribe,
    profileStore.getSnapshot,
    profileStore.getServerSnapshot,
  );

  const initials = useMemo(
    () => initialsProp ?? getInitials(profile.displayName),
    [initialsProp, profile.displayName],
  );

  const setProfilePhotoFromFile = useCallback(async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    writeStoredProfilePhoto(dataUrl, file.name);
    const settings = readStoredActorSettings();
    writeStoredActorSettings({
      ...settings,
      profilePhotoUrl: dataUrl,
      profilePhotoFileName: file.name,
    });
    emitClientStoreChange();
  }, []);

  const setDisplayName = useCallback((name: string) => {
    writeStoredDisplayName(name);
    emitClientStoreChange();
  }, []);

  const value = useMemo(
    () => ({
      initials,
      displayName: profile.displayName,
      profilePhotoUrl: profile.profilePhotoUrl,
      profilePhotoFileName: profile.profilePhotoFileName,
      setProfilePhotoFromFile,
      setDisplayName,
    }),
    [
      initials,
      profile.displayName,
      profile.profilePhotoUrl,
      profile.profilePhotoFileName,
      setProfilePhotoFromFile,
      setDisplayName,
    ],
  );

  return (
    <ActorProfileContext.Provider value={value}>
      {children}
    </ActorProfileContext.Provider>
  );
}

export function useActorProfile() {
  const context = useContext(ActorProfileContext);
  if (!context) {
    throw new Error("useActorProfile must be used within ActorProfileProvider");
  }
  return context;
}

export function useActorProfileOptional() {
  return useContext(ActorProfileContext);
}
