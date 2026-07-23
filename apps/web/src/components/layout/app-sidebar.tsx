"use client";

import { MerchantWorkspaceBrand } from "./merchant-workspace-brand";
import { PlatformBrand } from "./platform-brand";
import { SidebarNavigation } from "./sidebar-navigation";
import { UserMenu } from "./user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/features/auth/use-current-user";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const user = useCurrentUser();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {user?.role === "ADMIN" ? (
          <PlatformBrand />
        ) : user ? (
          <MerchantWorkspaceBrand />
        ) : null}
      </SidebarHeader>
      <SidebarContent>
        {user ? <SidebarNavigation role={user.role} /> : null}
      </SidebarContent>
      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
