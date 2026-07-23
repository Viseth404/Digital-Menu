import { appConfig } from "./app-config";
import { UserRole } from "@/features/auth/types";

export type NavigationIcon =
  | "dashboard"
  | "merchants"
  | "stores"
  | "products"
  | "categories"
  | "orders"
  | "audit"
  | "system"
  | "users";

export type NavigationItem = {
  label: string;
  href: string;
  icon: NavigationIcon;
};

const dashboardItem: NavigationItem = {
  label: "Overview",
  href: appConfig.routes.dashboard,
  icon: "dashboard",
};

const navigationByRole: Record<UserRole, NavigationItem[]> = {
  ADMIN: [
    dashboardItem,
    {
      label: "Merchants",
      href: appConfig.routes.adminMerchants,
      icon: "merchants",
    },
    {
      label: "Platform users",
      href: appConfig.routes.adminUsers,
      icon: "users",
    },
    {
      label: "Administrators",
      href: appConfig.routes.adminAdministrators,
      icon: "users",
    },
    {
      label: "Platform orders",
      href: appConfig.routes.adminOrders,
      icon: "orders",
    },
    {
      label: "Audit log",
      href: appConfig.routes.adminAudit,
      icon: "audit",
    },
    {
      label: "System",
      href: appConfig.routes.adminSystem,
      icon: "system",
    },
    {
      label: "My profile",
      href: appConfig.routes.adminProfile,
      icon: "system",
    },
  ],
  MERCHANT: [
    dashboardItem,
    {
      label: "My stores",
      href: appConfig.routes.merchantStores,
      icon: "stores",
    },
    {
      label: "Products & items",
      href: appConfig.routes.merchantProducts,
      icon: "products",
    },
    {
      label: "Categories",
      href: appConfig.routes.merchantCategories,
      icon: "categories",
    },
    {
      label: "Orders & QR",
      href: appConfig.routes.merchantOrders,
      icon: "orders",
    },
  ],
  STAFF: [dashboardItem],
};

export function getNavigationForRole(role: UserRole): NavigationItem[] {
  return navigationByRole[role];
}

export function getNavigationLabel(role: UserRole): string {
  if (role === "ADMIN") return "Platform control";
  if (role === "MERCHANT") return "Merchant control";
  return "Restaurant";
}
