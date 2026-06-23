"use client";

import { DatabaseConnectionError } from "@/components/errors/database-connection-error";
import { isDatabaseConnectionError } from "@/lib/db-errors";

export default function ActorError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  if (isDatabaseConnectionError(error)) {
    return <DatabaseConnectionError detail={error.message} />;
  }

  return (
    <div className="mx-auto max-w-lg p-8 animate-fade-in">
      <h1 className="text-xl font-semibold text-text-primary mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-text-secondary">{error.message}</p>
    </div>
  );
}
