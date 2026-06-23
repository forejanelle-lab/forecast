"use client";

import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({
  content,
  children,
  className,
  side = "top",
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const mounted = useMounted();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const gap = 8;
      let top = rect.top;
      let left = rect.left;

      switch (side) {
        case "right":
          top = rect.top + rect.height / 2;
          left = rect.right + gap;
          break;
        case "left":
          top = rect.top + rect.height / 2;
          left = rect.left - gap;
          break;
        case "bottom":
          top = rect.bottom + gap;
          left = rect.left + rect.width / 2;
          break;
        case "top":
        default:
          top = rect.top - gap;
          left = rect.left + rect.width / 2;
          break;
      }

      setPosition((prev) => {
        if (prev.top === top && prev.left === left) return prev;
        return { top, left };
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [visible, side]);

  const tooltipPositionClasses =
    side === "right"
      ? "-translate-y-1/2"
      : side === "left"
        ? "-translate-x-full -translate-y-1/2"
        : side === "bottom"
          ? "-translate-x-1/2"
          : "-translate-x-1/2 -translate-y-full";

  return (
    <>
      <div
        ref={triggerRef}
        className={cn("inline-flex", className)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        {children}
      </div>
      {mounted && visible &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: position.top, left: position.left }}
            className={cn(
              "fixed z-[300] w-max max-w-[min(16rem,calc(100vw-1.5rem))] rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-xs leading-relaxed text-text-secondary shadow-[var(--shadow-card)] animate-fade-in pointer-events-none",
              tooltipPositionClasses,
            )}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
