import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin-access";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!isAdminEmail(session.user.email)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-border/60 bg-bg-primary/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Fore Cast Admin
            </p>
            <h1 className="text-lg font-semibold text-text-primary">Analytics</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/analytics"
              className="font-medium text-text-primary hover:text-accent"
            >
              Dashboard
            </Link>
            <Link
              href={session.user.role === "CASTING" ? "/casting" : "/actor"}
              className="text-text-secondary hover:text-text-primary"
            >
              Back to app
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
