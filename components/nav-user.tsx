"use client";

import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { startLocaleTransition } from "@/components/locale-transition";
import {
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
  IconMoon,
  IconSun
} from "@tabler/icons-react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";

import { signOut } from "next-auth/react";

export function NavUser({
  user
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile, state } = useSidebar();
  const { theme, setTheme } = useTheme();
  const locale = useClientLocale("ar");

  const toggleLocale = () => {
    const next = locale === "ar" ? "en" : "ar";
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `taqam_locale=${next}; path=/; max-age=${maxAge}; samesite=lax`;
    startLocaleTransition(() => window.location.reload());
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="border-sidebar-border/70 bg-sidebar-accent/30 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-xl border transition-all">
              <Avatar className="border-sidebar-border/60 h-8 w-8 rounded-lg border">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              {state !== "collapsed" && (
                <>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                  </div>
                  <IconDotsVertical className="ms-auto size-4" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="border-border/70 bg-popover/95 w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border shadow-xl backdrop-blur-xl"
            side={isMobile ? "bottom" : locale === "ar" ? "left" : "right"}
            align="end"
            sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/my-profile">
                  <IconUserCircle />
                  {locale === "ar" ? "عرض الملف الشخصي" : "View profile"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notifications">
                  <IconNotification />
                  {locale === "ar" ? "الإشعارات" : "Notifications"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  toggleTheme();
                }}>
                <span className="inline-flex items-center gap-2">
                  {theme === "dark" ? (
                    <IconSun className="size-5" />
                  ) : (
                    <IconMoon className="size-5" />
                  )}
                  {theme === "dark"
                    ? locale === "ar"
                      ? "الوضع النهاري"
                      : "Light Mode"
                    : locale === "ar"
                      ? "الوضع الليلي"
                      : "Dark Mode"}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  toggleLocale();
                }}>
                <span className="inline-flex items-center gap-2">
                  {/* Mini pill showing current locale */}
                  <span
                    dir="ltr"
                    className="bg-muted ring-border/50 inline-flex h-5 w-[42px] shrink-0 items-center rounded-full px-0.5 ring-1">
                    <span
                      className={`flex-1 text-center text-[9px] font-bold ${locale === "ar" ? "text-foreground" : "text-muted-foreground/40"}`}>
                      AR
                    </span>
                    <span className="bg-border/60 mx-0.5 h-3 w-px" />
                    <span
                      className={`flex-1 text-center text-[9px] font-bold ${locale === "en" ? "text-foreground" : "text-muted-foreground/40"}`}>
                      EN
                    </span>
                  </span>
                  {locale === "ar" ? "English" : "العربية"}
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleLogout();
              }}>
              <IconLogout />
              {locale === "ar" ? "تسجيل خروج" : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
