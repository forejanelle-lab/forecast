import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "accent" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary:
    "bg-text-primary text-white hover:bg-text-primary/90 shadow-sm",
  secondary:
    "bg-bg-secondary text-text-primary border border-border hover:bg-bg-sidebar",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-bg-sidebar",
  accent:
    "bg-accent text-white hover:bg-accent-hover shadow-sm",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px] font-medium",
  lg: "h-13 px-7 text-base font-medium",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
Button.displayName = "Button";
