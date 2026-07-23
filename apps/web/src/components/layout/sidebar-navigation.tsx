"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2Icon,
  FileClockIcon,
  LayoutDashboardIcon,
  PackageOpenIcon,
  QrCodeIcon,
  SettingsIcon,
  StoreIcon,
  TagsIcon,
  UserCogIcon,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  getNavigationForRole,
  getNavigationLabel,
  NavigationIcon,
} from "@/config/navigation";
import { UserRole } from "@/features/auth/types";

const icons: Record<NavigationIcon, React.ComponentType> = {
  dashboard: LayoutDashboardIcon,
  merchants: Building2Icon,
  stores: StoreIcon,
  products: PackageOpenIcon,
  categories: TagsIcon,
  users: UserCogIcon,
  orders: QrCodeIcon,
  audit: FileClockIcon,
  system: SettingsIcon,
};

type SidebarNavigationProps = {
  role: UserRole;
};

export function SidebarNavigation({ role }: SidebarNavigationProps) {
  const pathname = usePathname();
  const navigation = getNavigationForRole(role);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{getNavigationLabel(role)}</SidebarGroupLabel>
      <SidebarMenu>
        {navigation.map((item) => {
          const Icon = icons[item.icon];

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={item.label}
                render={<Link href={item.href} />}
              >
                <Icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
