import { subscribeClientStore } from "@/lib/client-store-subscribe";

interface SnapshotCache<T> {
  server: T;
  client: T;
  dirty: boolean;
}

export function createClientStoreSnapshot<T>({
  buildServerSnapshot,
  buildClientSnapshot,
}: {
  buildServerSnapshot: () => T;
  buildClientSnapshot: () => T;
}) {
  const cache: SnapshotCache<T> = {
    server: buildServerSnapshot(),
    client: buildServerSnapshot(),
    dirty: true,
  };

  const getServerSnapshot = () => cache.server;

  const getSnapshot = () => {
    if (cache.dirty) {
      cache.client = buildClientSnapshot();
      cache.dirty = false;
    }
    return cache.client;
  };

  const subscribe = (onStoreChange: () => void) => {
    return subscribeClientStore(() => {
      cache.dirty = true;
      onStoreChange();
    });
  };

  return { subscribe, getSnapshot, getServerSnapshot };
}
