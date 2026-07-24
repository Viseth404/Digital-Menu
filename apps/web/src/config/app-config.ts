export const appConfig = {
  name: "TeamOne Digital-Menu",
  description: "Restaurant management system",
  supportEmail: "admin@savor.com",
  copyrightYear: 2026,

  apiBaseUrl: "/api",

  sessionCookieName: "restaurant_session",

  routes: {
    dashboard: "/",
    login: "/login",
    adminMerchants: "/admin/merchants",
    adminUsers: "/admin/users",
    adminOrders: "/admin/orders",
    adminAudit: "/admin/audit",
    adminSystem: "/admin/system",
    adminAdministrators: "/admin/administrators",
    adminProfile: "/admin/profile",
    merchantStores: "/merchant/stores",
    merchantProducts: "/merchant/products",
    merchantCategories: "/merchant/categories",
    merchantOrders: "/merchant/orders",
  },
} as const;

export function getPublicStorePath(
  merchantSlug: string,
  storeSlug: string,
): string {
  return `/store/${merchantSlug}/${storeSlug}`;
}
