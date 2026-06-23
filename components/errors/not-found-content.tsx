import Link from "next/link";

export function NotFoundContent({
  title = "Page not found",
  description = "The page you're looking for doesn't exist or may have been removed.",
  primaryHref = "/",
  primaryLabel = "Go home",
  secondaryHref,
  secondaryLabel,
}: {
  title?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-lg p-8 animate-fade-in text-center">
      <p className="text-6xl font-semibold text-text-secondary/30 mb-4">404</p>
      <h1 className="text-xl font-semibold text-text-primary mb-2">{title}</h1>
      <p className="text-sm text-text-secondary mb-6">{description}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link
          href={primaryHref}
          className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-xs font-medium text-white"
        >
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel && (
          <Link
            href={secondaryHref}
            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-medium text-text-primary hover:bg-bg-sidebar"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
