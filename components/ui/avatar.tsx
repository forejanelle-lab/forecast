import { cn } from "@/lib/utils";
import { PreviewImage } from "@/components/ui/preview-image";

interface AvatarProps {
  initials: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  featured?: boolean;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

const pixelSizes = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export function Avatar({
  initials,
  imageUrl,
  size = "md",
  className,
  featured,
}: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full font-semibold overflow-hidden",
        "bg-gradient-to-br from-accent/30 to-accent/10 text-accent-hover",
        "ring-2 ring-bg-secondary",
        sizes[size],
        featured && "ring-accent/40",
        className,
      )}
    >
      {imageUrl ? (
        <PreviewImage
          src={imageUrl}
          alt=""
          width={pixelSizes[size]}
          height={pixelSizes[size]}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
      {featured && (
        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-accent ring-2 ring-bg-secondary" />
      )}
    </div>
  );
}
