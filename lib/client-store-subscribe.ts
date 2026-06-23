const listeners = new Set<() => void>();

export function subscribeClientStore(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function emitClientStoreChange() {
  for (const listener of listeners) {
    listener();
  }
}
