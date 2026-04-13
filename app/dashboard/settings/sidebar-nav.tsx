"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { getText } from "@/lib/i18n/text";

const t = getText("ar");

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useClientLocale();
  const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const isRtl = locale === "ar";

  return (
    <nav
      dir={isRtl ? "rtl" : "ltr"}
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:items-stretch lg:overflow-visible lg:pb-0",
        className
      )}
      {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            currentPath === item.href || pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-muted",
            "w-max shrink-0 justify-start whitespace-nowrap text-start rtl:justify-end rtl:text-right lg:w-full"
          )}>
          {item.title}
        </Link>
      ))}
    </nav>
  );
}