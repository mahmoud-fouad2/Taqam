import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  frameClassName?: string;
  imageClassName?: string;
  darkImageClassName?: string;
  alt?: string;
};

export function LogoMark({
  className,
  frameClassName,
  imageClassName,
  darkImageClassName,
  alt = "Taqam"
}: LogoMarkProps) {
  return (
    <span className={cn("inline-flex shrink-0", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center overflow-hidden rounded-xl bg-transparent p-0",
          frameClassName
        )}>
        <Image
          src="/logo-light.png"
          alt={alt}
          width={877}
          height={496}
          className={cn("block h-10 w-auto max-w-none dark:hidden", imageClassName)}
        />
        <Image
          src="/logo-dark.png"
          alt={alt}
          width={1536}
          height={1024}
          className={cn(
            "hidden h-10 w-auto max-w-none dark:block",
            imageClassName,
            darkImageClassName
          )}
        />
      </span>
    </span>
  );
}
