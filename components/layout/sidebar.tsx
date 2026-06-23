"use client";

import { Avatar } from "@/components/ui/avatar";
import { useActorProfileOptional } from "@/components/providers/actor-profile-provider";
import { useAuditionSubmissionsOptional } from "@/components/providers/audition-submissions-provider";
import { useCastingProfileOptional } from "@/components/providers/casting-profile-provider";
import { useMessagesReadOptional } from "@/components/providers/messages-read-provider";
import { Tooltip } from "@/components/ui/tooltip";
import { CASTING_ANALYTICS_LOCKED_TOOLTIP, CASTING_SEARCH_ACTORS_LOCKED_TOOLTIP } from "@/lib/casting-analytics-lock";
import { buildSupportMailtoUrl } from "@/lib/support";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { SIDEBAR_WIDTH } from "@/lib/layout";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Film,
  Home,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Search,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useSyncExternalStore } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
  disabledTooltip?: string;
}

const iconClass = "h-3.5 w-3.5";

const actorNav: NavItem[] = [
  { label: "Dashboard", href: "/actor", icon: <Home className={iconClass} /> },
  { label: "Breakdowns", href: "/actor/search", icon: <Search className={iconClass} /> },
  { label: "Submissions", href: "/actor/applications", icon: <Briefcase className={iconClass} /> },
  { label: "Auditions", href: "/actor/auditions", icon: <Film className={iconClass} /> },
  { label: "Messages", href: "/actor/messages", icon: <MessageSquare className={iconClass} /> },
];

const castingNav: NavItem[] = [
  { label: "Dashboard", href: "/casting", icon: <Home className={iconClass} /> },
  { label: "Projects", href: "/projects", icon: <Briefcase className={iconClass} /> },
  { label: "Review Auditions", href: "/casting/submissions", icon: <Film className={iconClass} /> },
  { label: "Messages", href: "/casting/messages", icon: <MessageSquare className={iconClass} /> },
  { label: "Casting Analytics", href: "/casting/analytics", icon: <BarChart3 className={iconClass} />, disabled: true, disabledTooltip: CASTING_ANALYTICS_LOCKED_TOOLTIP },
  { label: "Search Actors", href: "/casting/search", icon: <Search className={iconClass} />, disabled: true, disabledTooltip: CASTING_SEARCH_ACTORS_LOCKED_TOOLTIP },
];

interface SidebarProps {
  role: "actor" | "casting";
  userName?: string;
  userInitials?: string;
  goldUserName?: boolean;
}

export function Sidebar({
  role,
  userName = "User",
  userInitials = "?",
  goldUserName = false,
}: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "actor" ? actorNav : castingNav;
  const actorProfile = useActorProfileOptional();
  const castingProfile = useCastingProfileOptional();
  const messagesRead = useMessagesReadOptional();
  const auditionSubmissions = useAuditionSubmissionsOptional();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const sidebarInitials =
    role === "actor" && actorProfile
      ? actorProfile.initials
      : role === "casting" && castingProfile
        ? castingProfile.initials
        : userInitials;
  const sidebarPhotoUrl =
    role === "actor" && actorProfile
      ? actorProfile.profilePhotoUrl
      : role === "casting" && castingProfile
        ? castingProfile.settings.profilePhotoUrl
        : null;
  const sidebarDisplayName = mounted
    ? role === "actor" && actorProfile
      ? actorProfile.displayName
      : userName
    : userName;
  const profileHref = role === "actor" ? "/actor/profile" : "/casting/settings";
  const isProfileActive =
    role === "actor"
      ? pathname === "/actor/profile"
      : pathname.startsWith("/casting/settings");
  const unreadMessageCount = messagesRead?.unreadCount ?? 0;
  const showUnreadBadge = mounted && unreadMessageCount > 0;
  const auditionCount =
    role === "actor" ? (auditionSubmissions?.auditionCount ?? 0) : 0;
  const showAuditionBadge = mounted && role === "actor" && auditionCount > 0;
  const sidebarPhoto = mounted ? sidebarPhotoUrl : null;

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-full flex-col bg-bg-sidebar border-r border-border/60"
      style={{ width: SIDEBAR_WIDTH }}
    >
      <Logo variant="sidebar" />

      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {nav.map((item) => {
          const isActive =
            !item.disabled &&
            (pathname === item.href ||
              (item.href !== `/${role}` && pathname.startsWith(item.href)));

          if (item.disabled) {
            return (
              <Tooltip
                key={item.href}
                content={item.disabledTooltip ?? CASTING_ANALYTICS_LOCKED_TOOLTIP}
                side="right"
                className="w-full"
              >
                <span
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary/50 cursor-not-allowed"
                  aria-disabled="true"
                >
                  <span className="relative shrink-0 text-text-secondary/50">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </span>
              </Tooltip>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-bg-secondary text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60",
              )}
            >
              <span
                className={cn(
                  "relative shrink-0",
                  isActive ? "text-accent" : "text-text-secondary",
                )}
              >
                {item.icon}
                {item.label === "Messages" && showUnreadBadge && (
                  <span
                    className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent ring-2 ring-bg-sidebar"
                    aria-hidden
                  />
                )}
              </span>
              <span className="truncate">{item.label}</span>
              {item.label === "Auditions" && showAuditionBadge && (
                <span
                  className="ml-auto flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white"
                  aria-label={`${auditionCount} auditions`}
                >
                  {auditionCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 px-2 py-2 space-y-0.5">
        <Link
          href={profileHref}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors",
            isProfileActive
              ? "bg-bg-secondary border-border shadow-sm"
              : "bg-bg-secondary border-border/60 hover:border-border hover:bg-bg-secondary/80",
          )}
        >
          <Avatar
            initials={sidebarInitials}
            imageUrl={sidebarPhoto}
            size="sm"
            className="ring-0"
          />
          <span
            className={cn(
              "text-xs truncate min-w-0",
              goldUserName
                ? "font-semibold text-gradient-gold"
                : "font-medium text-text-primary",
            )}
          >
            {sidebarDisplayName}
          </span>
        </Link>
        <a
          href={buildSupportMailtoUrl()}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60 transition-colors"
        >
          <LifeBuoy className={iconClass} />
          Support
        </a>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary/60 transition-colors"
        >
          <LogOut className={iconClass} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
