import { cn } from "@/lib/utils";
import Link from "next/link";

import { LogoMark } from "@/components/logo-mark";

type LogoProps = {
  className?: string;
  showText?: boolean;
};

export default function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 px-5 py-4", className)}>
      <LogoMark imageClassName="h-8" frameClassName="rounded-lg p-0" alt="طاقم - Taqam" />
      {showText && (
        <span className="sr-only">طاقم - Taqam</span>
      )}
    </Link>
  );
}
