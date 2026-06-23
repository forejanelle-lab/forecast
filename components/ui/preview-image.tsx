import Image from "next/image";
import { cn } from "@/lib/utils";

interface PreviewImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/** User-uploaded blob/data URLs require unoptimized next/image. */
export function PreviewImage({
  src,
  alt,
  width,
  height,
  className,
}: PreviewImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      className={cn(className)}
    />
  );
}
