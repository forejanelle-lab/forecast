"use client";

import { createClientStoreSnapshot } from "@/lib/client-store-snapshot";
import { emitClientStoreChange } from "@/lib/client-store-subscribe";
import {
  defaultCastingSettings,
  profilePhotoFromFile,
  readStoredCastingSettings,
  writeStoredCastingSettings,
  type CastingSettingsData,
} from "@/lib/casting-settings-storage";
import { getInitials } from "@/lib/user";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

interface CastingProfileContextValue {
  displayName: string;
  initials: string;
  settings: CastingSettingsData;
  updateSettings: (patch: Partial<CastingSettingsData>) => void;
  setProfilePhotoFromFile: (file: File) => Promise<void>;
}

const CastingProfileContext = createContext<CastingProfileContextValue | null>(null);

const settingsStore = createClientStoreSnapshot({
  buildServerSnapshot: () => ({ ...defaultCastingSettings }),
  buildClientSnapshot: () => readStoredCastingSettings(),
});

export function CastingProfileProvider({
  children,
  displayName,
}: {
  children: React.ReactNode;
  displayName: string;
}) {
  const settings = useSyncExternalStore(
    settingsStore.subscribe,
    settingsStore.getSnapshot,
    settingsStore.getServerSnapshot,
  );

  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const updateSettings = useCallback((patch: Partial<CastingSettingsData>) => {
    const next = { ...readStoredCastingSettings(), ...patch };
    writeStoredCastingSettings(next);
    emitClientStoreChange();
  }, []);

  const setProfilePhotoFromFile = useCallback(async (file: File) => {
    const { dataUrl, fileName } = await profilePhotoFromFile(file);
    updateSettings({
      profilePhotoUrl: dataUrl,
      profilePhotoFileName: fileName,
    });
  }, [updateSettings]);

  const value = useMemo(
    () => ({
      displayName,
      initials,
      settings,
      updateSettings,
      setProfilePhotoFromFile,
    }),
    [displayName, initials, settings, updateSettings, setProfilePhotoFromFile],
  );

  return (
    <CastingProfileContext.Provider value={value}>
      {children}
    </CastingProfileContext.Provider>
  );
}

export function useCastingProfile() {
  const context = useContext(CastingProfileContext);
  if (!context) {
    throw new Error("useCastingProfile must be used within CastingProfileProvider");
  }
  return context;
}

export function useCastingProfileOptional() {
  return useContext(CastingProfileContext);
}
