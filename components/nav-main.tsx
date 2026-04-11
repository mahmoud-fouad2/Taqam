"use client";

import type { Icon } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  items
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname();

  const isActiveItem = (itemUrl: string) => {
    const isDashboardRoot =
      itemUrl === "/dashboard" || itemUrl === "/en/dashboard" || itemUrl.endsWith("/dashboard/super-admin");

    if (isDashboardRoot) {
      return pathname === itemUrl;
    }

    if (pathname === itemUrl) {
      return true;
    }

    const nextChar = pathname.charAt(itemUrl.length);
    return pathname.startsWith(itemUrl) && (nextChar === "/" || nextChar === "-");
  };

  return (
    <SidebarGroup className="px-1 py-2">
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-1.5">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActiveItem(item.url)}
                asChild>
                <Link
                  href={item.url}
                  className="flex w-full items-center gap-2 group-data-[collapsible=icon]/sidebar-wrapper:justify-center">
                  {item.icon && <item.icon className="opacity-90" />}
                  <span className="truncate group-data-[collapsible=icon]/sidebar-wrapper:hidden">
                    {item.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
