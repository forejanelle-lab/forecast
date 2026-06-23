import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  goldHover?: boolean;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  className,
  goldHover = false,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={cn(
        "group rounded-[20px] bg-bg-secondary border border-border/60 p-6",
        "shadow-[var(--shadow-soft)] transition-all duration-300",
        "hover:shadow-[var(--shadow-card)]",
        goldHover && "hover:border-accent/50 hover:bg-accent/5",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p
            className={cn(
              "text-sm font-medium text-text-secondary transition-colors duration-300",
              goldHover && "group-hover:text-accent",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "text-3xl font-bold tracking-tight text-text-primary transition-all duration-300",
              goldHover &&
                "group-hover:bg-gradient-to-r group-hover:from-[#c8a86b] group-hover:via-[#e8d5a8] group-hover:to-[#b58d4b] group-hover:bg-clip-text group-hover:text-transparent",
            )}
          >
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-danger" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  isPositive ? "text-success" : "text-danger",
                )}
              >
                {isPositive ? "+" : ""}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-text-secondary">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl bg-bg-sidebar text-accent transition-all duration-300",
              goldHover && "group-hover:bg-accent group-hover:text-white",
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
