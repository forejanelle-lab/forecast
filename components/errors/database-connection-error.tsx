import Link from "next/link";
import { DATABASE_CONNECTION_HELP } from "@/lib/db-errors";

export function DatabaseConnectionError({
  detail,
}: {
  detail?: string;
}) {
  return (
    <div className="mx-auto max-w-lg p-8 animate-fade-in">
      <h1 className="text-xl font-semibold text-text-primary mb-2">
        Database connection failed
      </h1>
      <p className="text-sm text-text-secondary mb-4">
        Fore Cast could not reach your Supabase database. This usually means{" "}
        <code className="text-xs bg-bg-sidebar px-1 py-0.5 rounded">DATABASE_URL</code>{" "}
        in <code className="text-xs bg-bg-sidebar px-1 py-0.5 rounded">.env</code> is
        outdated or uses the wrong host.
      </p>
      {detail && (
        <pre className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg p-3 mb-4 whitespace-pre-wrap break-words">
          {detail}
        </pre>
      )}
      <pre className="text-xs text-text-secondary bg-bg-sidebar/50 border border-border/60 rounded-lg p-3 mb-6 whitespace-pre-wrap">
        {DATABASE_CONNECTION_HELP}
      </pre>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/auth/signin"
          className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-xs font-medium text-white"
        >
          Back to sign in
        </Link>
        <a
          href="https://supabase.com/dashboard/project/_/settings/database"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-medium text-text-primary hover:bg-bg-sidebar"
        >
          Open Supabase database settings
        </a>
      </div>
    </div>
  );
}
