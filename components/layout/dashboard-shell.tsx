import { Sidebar } from "@/components/layout/sidebar";
import { SIDEBAR_CONTENT_GAP, SIDEBAR_WIDTH } from "@/lib/layout";

interface DashboardShellProps {
  children: React.ReactNode;
  role: "actor" | "casting";
  userName?: string;
  userInitials?: string;
}

export function DashboardShell({
  children,
  role,
  userName,
  userInitials,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-bg-secondary">
      <Sidebar
        role={role}
        userName={userName}
        userInitials={userInitials}
        goldUserName={role === "actor"}
      />
      <main
        className="py-8 pr-8"
        style={{ paddingLeft: SIDEBAR_WIDTH + SIDEBAR_CONTENT_GAP }}
      >
        {children}
      </main>
    </div>
  );
}
