"use client";

import { DatabaseConnectionError } from "@/components/errors/database-connection-error";
import { isDatabaseConnectionError } from "@/lib/db-errors";

export default function CastingError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  if (isDatabaseConnectionError(error)) {
    return <DatabaseConnectionError detail={error.message} />;
  }

  return (
    <div className="p-8 text-sm text-text-secondary">
      <p className="font-medium text-text-primary mb-2">Something went wrong</p>
      <p>{error.message}</p>
    </div>
  );
}
