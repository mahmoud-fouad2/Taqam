"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  HelpCircle,
  Languages,
  LogOut,
  User,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Mail
} from "lucide-react";
import { getSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { startLocaleTransition } from "@/components/locale-transition";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { isSuperAdminRole } from "@/lib/access-control";
import { getText } from "@/lib/i18n/text";
import { notificationsService } from "@/lib/api";
import type { Notification } from "@/lib/types/self-service";

export function DashboardHeaderActions({ locale }: { locale: "ar" | "en" }) {
  const t = getText(locale);
  const { theme, setTheme } = useTheme();
  const [avatarSrc, setAvatarSrc] = useState<string>("/images/avatars/1.png");

  const [role, setRole] = useState<string | undefined>(undefined);
  const [hasTenant, setHasTenant] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const tenant = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("taqam_tenant="));
      if (mounted) setHasTenant(Boolean(tenant));
      const session = await getSession();
      if (mounted) {
        setRole((session?.user as any)?.role);
        // Set user name and email from session
        const user = session?.user as any;
        if (user) {
          setUserName(
            user.name ||
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              (locale === "ar" ? "مستخدم" : "User")
          );
          setUserEmail(user.email || "");
        }
      }

      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        const json = await res.json();
        if (mounted && json?.data) {
          const avatar = json.data.avatar as string | undefined;
          if (avatar) setAvatarSrc(avatar);
          // Update with more accurate profile data
          const firstName = json.data.firstName || "";
          const lastName = json.data.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim();
          if (fullName) setUserName(fullName);
          if (json.data.email) setUserEmail(json.data.email);
        }
      } catch {
        // Keep fallback data
      }
    })();
    return () => {
      mounted = false;
    };
  }, [locale]);

  const isPlatformAdmin = isSuperAdminRole(role);
  const isSuperAdminNoTenant = isPlatformAdmin && !hasTenant;
  const isSuperAdminWithTenant = isPlatformAdmin && hasTenant;

  const exitTenantContext = () => {
    const maxAge = 0;
    document.cookie = `taqam_tenant=; path=/; max-age=${maxAge}; samesite=lax`;
    window.location.href = "/dashboard/super-admin";
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await notificationsService.getAll({ page: 1, pageSize: 20 });
        if (!isMounted) return;
        setNotifications(res.success && res.data ? res.data.notifications : []);
      } catch {
        if (!isMounted) return;
        setNotifications([]);
      }
    };

    void load();

    // Poll every 30 seconds for new notifications
    const interval = setInterval(() => void load(), 30_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const markRead = (id: string) => {
    if (!id) return;
    if (readIds.has(id)) return;
    const next = new Set(readIds);
    next.add(id);
    void notificationsService.markAsRead(id);
    setReadIds(next);
  };

  const markAllRead = () => {
    const next = new Set(readIds);
    for (const n of notifications) next.add(n.id);
    void notificationsService.markAllAsRead();
    setReadIds(next);
  };

  const { unreadCount, latest } = useMemo(() => {
    const withRead: Notification[] = notifications.map((n: Notification) => ({
      ...n,
      isRead: n.isRead || readIds.has(n.id)
    }));

    const unreadCount = withRead.filter((n: Notification) => !n.isRead).length;
    const latest = [...withRead]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    return { unreadCount, latest };
  }, [notifications, readIds]);

  const toggleLocale = () => {
    const next = locale === "ar" ? "en" : "ar";
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `taqam_locale=${next}; path=/; max-age=${maxAge}; samesite=lax`;

    const path = window.location.pathname;
    const isDashboardPath =
      path === "/dashboard" ||
      path.startsWith("/dashboard/") ||
      path === "/en/dashboard" ||
      path.startsWith("/en/dashboard/");

    if (isDashboardPath) {
      const target = path.replace(/^\/en(?=\/dashboard)/, "") || "/dashboard";
      startLocaleTransition(() => {
        window.location.href = `${target}${window.location.search}`;
      });
      return;
    }

    const hasEnPrefix = path === "/en" || path.startsWith("/en/");
    const stripped = hasEnPrefix ? path.replace(/^\/en(?=\/|$)/, "") || "/" : path;
    const target = next === "en" ? (stripped === "/" ? "/en" : `/en${stripped}`) : stripped;

    startLocaleTransition(() => {
      window.location.href = `${target}${window.location.search}`;
    });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const actionIconBtnClass =
    "h-9 w-9 rounded-lg border border-border/70 bg-background/75 shadow-sm hover:bg-accent/80";
  const dropdownSurfaceClass =
    "rounded-xl border border-border/70 bg-popover/95 shadow-xl backdrop-blur-xl";

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-lg border border-border/70 bg-background/75 px-3 shadow-sm hover:bg-accent/80"
            aria-label={locale === "ar" ? "اختيار اللغة" : "Choose language"}
          >
            <Languages className="h-4 w-4" />
            <span className="text-sm font-medium">{locale === "ar" ? "العربية" : "English"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={`w-48 ${dropdownSurfaceClass}`}>
          <DropdownMenuLabel>{locale === "ar" ? "اللغة" : "Language"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={locale === "ar" ? undefined : (e: Event) => {
            e.preventDefault();
            toggleLocale();
          }}>
            <span className="flex flex-1 items-center justify-between">
              <span>العربية</span>
              {locale === "ar" ? <Check className="h-4 w-4" /> : null}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={locale === "en" ? undefined : (e: Event) => {
            e.preventDefault();
            toggleLocale();
          }}>
            <span className="flex flex-1 items-center justify-between">
              <span>English</span>
              {locale === "en" ? <Check className="h-4 w-4" /> : null}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={actionIconBtnClass}
        aria-label={locale === "ar" ? "تبديل المظهر" : "Toggle theme"}
        onClick={toggleTheme}>
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      {/* Help */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={actionIconBtnClass}>
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">{t.common.helpCenter}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={`w-72 ${dropdownSurfaceClass}`}>
          <DropdownMenuLabel>{t.common.helpCenter}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {isPlatformAdmin ? (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/super-admin"
                    className="flex items-center justify-between">
                    <span>{locale === "ar" ? "لوحة المنصة" : "Platform dashboard"}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/super-admin/insights"
                    className="flex items-center justify-between">
                    <span>{locale === "ar" ? "تقارير المنصة" : "Platform insights"}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/super-admin/content"
                    className="flex items-center justify-between">
                    <span>{locale === "ar" ? "المحتوى والسيو" : "Content & SEO"}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/super-admin/tenants"
                    className="flex items-center justify-between">
                    <span>{locale === "ar" ? "إدارة الشركات" : "Manage tenants"}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/super-admin/requests"
                    className="flex items-center justify-between">
                    <span>{locale === "ar" ? "طلبات الاشتراك" : "Subscription requests"}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/support"
                    className="flex items-center justify-between">
                    <span>{locale === "ar" ? "الدعم الفني" : "Support desk"}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/help-center"
                    className="flex items-center justify-between">
                    <span>{locale === "ar" ? "مركز المساعدة" : "Help center"}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/super-admin/pricing"
                    className="flex items-center justify-between">
                    <span>{locale === "ar" ? "الأسعار والباقات" : "Pricing & plans"}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/super-admin/settings"
                    className="flex items-center justify-between">
                    <span>{locale === "ar" ? "إعدادات المنصة" : "Platform settings"}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                {isSuperAdminWithTenant ? (
                  <DropdownMenuItem
                    onSelect={(e: Event) => {
                      e.preventDefault();
                      exitTenantContext();
                    }}>
                    <ChevronLeft className="me-2 h-4 w-4" />
                    {locale === "ar" ? "مسح سياق الشركة" : "Clear tenant context"}
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/help-center"
                    className="flex items-center justify-between">
                    <span>{t.common.helpCenter}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/academy"
                    className="flex items-center justify-between">
                    <span>{t.common.academy}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/support"
                    className="flex items-center justify-between">
                    <span>{locale === "ar" ? "الدعم الفني" : "Support"}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/ideas" className="flex items-center justify-between">
                    <span>{t.common.shareIdeas}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard/whats-new"
                    className="flex items-center justify-between">
                    <span>{t.common.whatsNew}</span>
                    {locale === "ar" ? (
                      <ChevronLeft className="h-4 w-4 opacity-60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    )}
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className={`relative ${actionIconBtnClass}`}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -end-0.5 -top-0.5">
                <Badge className="h-5 min-w-5 justify-center rounded-full px-1 text-[11px]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              </span>
            )}
            <span className="sr-only">{t.common.notifications}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={`w-96 ${dropdownSurfaceClass}`}>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>{t.common.notifications}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  markAllRead();
                }}>
                {locale === "ar" ? "تحديد الكل كمقروء" : "Mark all read"}
              </button>
              <Link
                href="/dashboard/notifications"
                className="text-muted-foreground hover:text-foreground text-xs">
                {t.common.viewAll}
              </Link>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-[320px] overflow-auto">
            {latest.length === 0 ? (
              <div className="text-muted-foreground p-6 text-center text-sm">
                {locale === "ar" ? "لا توجد إشعارات" : "No notifications"}
              </div>
            ) : (
              latest.map((n) => (
                <DropdownMenuItem key={n.id} asChild>
                  <Link
                    href="/dashboard/notifications"
                    className="flex flex-col gap-1 py-3"
                    onClick={() => markRead(n.id)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{n.title}</span>
                      {!n.isRead && <span className="bg-primary h-2 w-2 rounded-full" />}
                    </div>
                    <span className="text-muted-foreground line-clamp-2 text-xs">{n.message}</span>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="border-border/70 bg-background/75 hover:bg-accent/80 h-9 gap-2 rounded-lg border px-2 shadow-sm">
            <Avatar className="h-7 w-7">
              <AvatarImage src={avatarSrc} alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">
              {userName || (locale === "ar" ? "مستخدم" : "User")}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={`w-72 ${dropdownSurfaceClass}`}>
          <DropdownMenuLabel className="p-0">
            <div className="flex items-center gap-2 px-2 py-2">
              <Avatar className="h-9 w-9 rounded-lg">
                <AvatarImage src={avatarSrc} alt="User" />
                <AvatarFallback className="rounded-lg">U</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {userName || (locale === "ar" ? "مستخدم" : "User")}
                </div>
                <div className="text-muted-foreground truncate text-xs">{userEmail || ""}</div>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/my-profile">
                <User className="me-2 h-4 w-4" />
                {t.common.viewProfile}
              </Link>
            </DropdownMenuItem>
            {isSuperAdminWithTenant ? (
              <DropdownMenuItem
                onSelect={(e: Event) => {
                  e.preventDefault();
                  exitTenantContext();
                }}>
                <ChevronLeft className="me-2 h-4 w-4" />
                {locale === "ar" ? "الرجوع للوحة السوبر أدمن" : "Back to Super Admin"}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              <Link href="/dashboard/account/change-password">
                <KeyRound className="me-2 h-4 w-4" />
                {t.common.changePassword}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/account/change-email">
                <Mail className="me-2 h-4 w-4" />
                {locale === "ar" ? "تغيير البريد الإلكتروني" : "Change email"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e: Event) => {
                e.preventDefault();
                toggleTheme();
              }}>
              <span className="inline-flex items-center gap-2">
                {theme === "dark" ? (
                  <Sun className="me-2 h-4 w-4" />
                ) : (
                  <Moon className="me-2 h-4 w-4" />
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
              onSelect={(e: Event) => {
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
            onSelect={(e: Event) => {
              e.preventDefault();
              logout();
            }}>
            <LogOut className="me-2 h-4 w-4" />
            {t.common.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
