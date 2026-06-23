"use client";

import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function NotificationsBell() {
  const mounted = useMounted();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllRead = useCallback(async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const updateDropdownPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open, updateDropdownPosition]);

  const handleBellClick = () => {
    markAllRead();
    setOpen((prev) => !prev);
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleBellClick}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open &&
        mounted &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[90] cursor-default"
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
            />
            <div
              className="fixed z-[100] w-80 max-w-[calc(100vw-1rem)] rounded-[20px] border border-border bg-bg-secondary shadow-[var(--shadow-card)] overflow-hidden animate-fade-in"
              style={{
                top: dropdownStyle.top,
                right: dropdownStyle.right,
              }}
            >
              <div className="px-4 py-3 border-b border-border/60">
                <p className="font-semibold text-sm">Notifications</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <p className="px-4 py-3 text-xs text-text-secondary">Loading...</p>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-text-secondary">No notifications yet.</p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "px-4 py-3 border-b border-border/40 hover:bg-bg-sidebar transition-colors cursor-pointer",
                        !n.read && "bg-accent/5",
                      )}
                    >
                      <p className="text-sm font-medium text-text-primary">{n.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
