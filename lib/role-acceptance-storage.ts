import type { RoleStatus } from "@/types";
import { roleAcceptsSubmissions } from "@/lib/role-submissions-status";

const STORAGE_KEY = "forecast-role-acceptance-status";

type Listener = () => void;
const listeners = new Set<Listener>();

function readOverrides(): Record<string, RoleStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, RoleStatus>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeOverrides(overrides: Record<string, RoleStatus>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  listeners.forEach((listener) => listener());
}

export function subscribeRoleAcceptance(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEffectiveRoleStatus(roleId: string, fallbackStatus: RoleStatus): RoleStatus {
  const override = readOverrides()[roleId];
  return override ?? fallbackStatus;
}

export function roleAcceptsSubmissionsForRole(roleId: string, fallbackStatus: RoleStatus): boolean {
  return roleAcceptsSubmissions(getEffectiveRoleStatus(roleId, fallbackStatus));
}

export function setRoleAcceptanceStatus(roleId: string, status: RoleStatus) {
  const overrides = readOverrides();
  overrides[roleId] = status;
  writeOverrides(overrides);
}

export function clearRoleAcceptanceStatus(roleId: string) {
  const overrides = readOverrides();
  if (!overrides[roleId]) return;
  delete overrides[roleId];
  writeOverrides(overrides);
}

export function mergeRolesWithAcceptanceStatus<T extends { id: string; status: RoleStatus }>(
  roles: T[],
): T[] {
  const overrides = readOverrides();
  return roles.map((role) =>
    overrides[role.id] ? { ...role, status: overrides[role.id] } : role,
  );
}

/** Cached snapshot store for useSyncExternalStore (avoids infinite re-renders). */
export function createRoleAcceptanceRolesStore<T extends { id: string; status: RoleStatus }>(
  roles: T[],
) {
  let cache: { rolesRef: T[]; overridesKey: string; snapshot: T[] } | null = null;

  const overridesKey = () => JSON.stringify(readOverrides());

  const getSnapshot = (): T[] => {
    const key = overridesKey();
    if (cache && cache.rolesRef === roles && cache.overridesKey === key) {
      return cache.snapshot;
    }
    const snapshot = mergeRolesWithAcceptanceStatus(roles);
    cache = { rolesRef: roles, overridesKey: key, snapshot };
    return snapshot;
  };

  const subscribe = (onStoreChange: () => void) =>
    subscribeRoleAcceptance(() => {
      cache = null;
      onStoreChange();
    });

  return {
    subscribe,
    getSnapshot,
    getServerSnapshot: () => roles,
  };
}
