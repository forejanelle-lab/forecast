import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  className?: string;
  imageClassName?: string;
  variant?: "default" | "sidebar";
}

export function Logo({
  href = "/",
  className,
  imageClassName,
  variant = "default",
}: LogoProps) {
  if (variant === "sidebar") {
    return (
      <Link
        href={href}
        className={cn(
          "flex w-full h-14 items-center justify-center overflow-hidden bg-white border-b border-border/60",
          className,
        )}
      >
        <Image
          src="/forecast-logo.png"
          alt="Fore Cast Casting"
          width={500}
          height={500}
          priority
          className={cn(
            "h-full w-full object-contain scale-[1.2]",
            imageClassName,
          )}
        />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn("inline-flex shrink-0 bg-white rounded-lg overflow-hidden", className)}
    >
      <Image
        src="/forecast-logo.png"
        alt="Fore Cast Casting"
        width={500}
        height={500}
        priority
        className={cn("h-12 w-auto object-contain", imageClassName)}
      />
    </Link>
  );
}
