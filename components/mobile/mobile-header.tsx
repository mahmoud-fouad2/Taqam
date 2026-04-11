"use client";

import Link from "next/link";
import { Bell, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
  dateText: string;
  avatarUrl?: string | null;
  initials?: string;
};

export default function MobileHeader({ dateText, avatarUrl, initials }: Props) {
  return (
    <header className="flex items-center justify-between py-2">
      {/* Right side: date */}
      <div className="flex items-center gap-1.5 text-[13px] text-slate-400">
        <Calendar className="size-4" />
        <span className="tabular-nums">{dateText}</span>
      </div>

      {/* Left side: notif + avatar */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="relative flex size-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100"
          aria-label="Notifications">
          <Bell className="size-[18px] text-slate-400" />
        </button>
        <Link href="/m/settings">
          <Avatar className="ring-primary/15 size-10 ring-2">
            <AvatarImage src={avatarUrl || ""} alt="" />
            <AvatarFallback className="bg-primary/10 text-primary text-[13px] font-bold">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
