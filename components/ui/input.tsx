import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => (
    <div className="relative">
      {icon && (
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
      )}
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-bg-secondary",
          "px-4 text-[15px] text-text-primary placeholder:text-text-secondary/60",
          "transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50",
          icon && "pl-10",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
Input.displayName = "Input";
