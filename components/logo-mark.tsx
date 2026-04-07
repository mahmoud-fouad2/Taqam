import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  frameClassName?: string;
  imageClassName?: string;
  alt?: string;
};

export function LogoMark({
  className,
  frameClassName,
  imageClassName,
  alt = "Taqam",
}: LogoMarkProps) {
  return (
    <span className={cn("inline-flex shrink-0", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center overflow-hidden rounded-xl bg-white p-0 shadow-sm ring-1 ring-black/10 dark:bg-white dark:ring-white/20",
          frameClassName
        )}
      >
        <Image
          src="/logo-tight.jpeg"
          alt={alt}
          width={877}
          height={496}
          className={cn("block h-10 w-auto max-w-none", imageClassName)}
        />
      </span>
    </span>
  );
}