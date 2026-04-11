"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, ClipboardList, Home, User } from "lucide-react";

const tabs = [
  { href: "/m/home", label: "الرئيسية", Icon: Home },
  { href: "/m/attendance", label: "الحضور", Icon: CalendarCheck },
  { href: "/m/requests", label: "الطلبات", Icon: ClipboardList },
  { href: "/m/settings", label: "الملف الشخصي", Icon: User }
] as const;

export default function MobileBottomNav() {
  const pathname = usePathname() || "/";
  if (pathname === "/m" || pathname === "/m/login") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-slate-100 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
      <div className="grid grid-cols-4 pt-1 pb-[max(env(safe-area-inset-bottom),6px)]">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-[3px] py-1.5">
              <div
                className={
                  "flex size-8 items-center justify-center rounded-2xl transition-all duration-200 " +
                  (active ? "bg-primary/10 scale-110" : "")
                }>
                <Icon
                  className={
                    "size-[21px] transition-colors " + (active ? "text-primary" : "text-slate-300")
                  }
                  strokeWidth={active ? 2.3 : 1.7}
                />
              </div>
              <span
                className={
                  "text-[10px] leading-none transition-colors " +
                  (active ? "text-primary font-bold" : "font-medium text-slate-300")
                }>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
