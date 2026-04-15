"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { isSuperAdminRole } from "@/lib/access-control";
import { getDashboardNav } from "@/lib/dashboard-nav";
import { useClientLocale } from "@/lib/i18n/use-client-locale";
import { LogoMark } from "@/components/logo-mark";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const locale = useClientLocale("ar");
  const { data: session } = useSession();
  const [role, setRole] = React.useState<string | undefined>(undefined);
  const [user, setUser] = React.useState<{ name: string; email: string; avatar: string } | null>(
    null
  );

  React.useEffect(() => {
    const sessionUser = session?.user as
      | {
          role?: string;
          name?: string;
          firstName?: string;
          lastName?: string;
          email?: string;
          avatar?: string;
        }
      | undefined;

    setRole(sessionUser?.role);

    const name =
      sessionUser?.name ||
      `${sessionUser?.firstName || ""} ${sessionUser?.lastName || ""}`.trim() ||
      "User";
    const email = sessionUser?.email || "";
    const avatar = sessionUser?.avatar || "/images/avatars/1.png";

    setUser(sessionUser ? { name, email, avatar } : null);
  }, [session]);

  const navItems = React.useMemo(() => getDashboardNav(locale, role), [locale, role]);
  const homeUrl = isSuperAdminRole(role) ? "/dashboard/super-admin" : "/dashboard";
  const workspaceLabel = isSuperAdminRole(role)
    ? locale === "ar"
      ? "إدارة المنصة"
      : "Platform Admin"
    : locale === "ar"
      ? "مساحة الشركة"
      : "Tenant Workspace";

  return (
    <Sidebar collapsible="icon" className="dashboard-app-sidebar" {...props}>
      <SidebarHeader className="px-2 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="border-sidebar-border/70 bg-sidebar-accent/40 hover:bg-sidebar-accent rounded-xl border !p-2 shadow-sm transition-all">
              <Link href={homeUrl}>
                <LogoMark
                  frameClassName="size-9 rounded-lg border border-sidebar-border/60 bg-sidebar p-1 shadow-sm"
                  imageClassName="h-[18px]"
                  darkImageClassName="h-[21px]"
                />
                <div className="grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-bold tracking-tight">طاقم</span>
                  <span className="text-sidebar-foreground/65 truncate text-xs">
                    {workspaceLabel}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border/70 border-t px-2 pt-2 pb-2">
        {user ? <NavUser user={user} /> : null}
      </SidebarFooter>
    </Sidebar>
  );
}
